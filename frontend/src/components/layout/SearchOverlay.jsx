import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Clock, Search, X } from "lucide-react"
import api from "../../lib/api"
import { cn } from "../../lib/cn"
import { formatPrice } from "../../lib/utils"
import { useDebouncedValue, useEscapeKey, useScrollLock } from "../../lib/hooks"
import { CATEGORIES, categoryPath } from "../../lib/navigation"
import { Button, IconButton, Image, Skeleton } from "../ui"

const RECENT_KEY = "sajbela:recent-searches"
const MAX_RECENT = 5

/** Shortest query worth a round trip — one letter matches most of the catalogue. */
const MIN_QUERY = 2
const MAX_SUGGESTIONS = 6

/** Open and close take the same time, so one constant drives the CSS and the
 *  unmount timer. Change it here and both stay in step. */
const TRANSITION_MS = 200

function readRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : []
  } catch {
    return []
  }
}

function pushRecent(term) {
  try {
    const next = [term, ...readRecent().filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    return next
  } catch {
    return readRecent()
  }
}

/**
 * Full-screen search overlay, opened from the header (desktop) and the bottom
 * nav (mobile).
 *
 * ── Why it animates both ways ────────────────────────────────────────────
 *
 * It used to be `if (!open) return null` plus `animate-fade-in`, which gives you
 * half a transition: the panel fades in, then vanishes on the frame you close
 * it. A dialog that appears gently and disappears abruptly reads as a glitch, so
 * `open` (the intent) and `mounted` (the DOM) are now separate. Closing flips
 * the transition classes, waits out the animation, and *then* unmounts.
 *
 * `shown` is flipped a frame after mount rather than in the same commit —
 * a transition needs a painted start value to animate away from, so applying the
 * open classes immediately would jump straight to the end state.
 *
 * ── Suggestions ──────────────────────────────────────────────────────────
 *
 * Typing shows matching products inline. The old overlay only ever offered "run
 * this search on the shop page", so finding one known product meant a full page
 * load, a grid, and then a second tap — for a catalogue this size the product is
 * usually the answer, not the result page. The full search is still one tap away
 * at the bottom, and Enter still runs it.
 *
 * Failures are silent by design: suggestions are a shortcut, and an error panel
 * where the shortcut would be is louder than not having it.
 */
const SearchOverlay = ({ open, onClose }) => {
  const navigate = useNavigate()
  const inputRef = useRef(null)

  const [mounted, setMounted] = useState(open)
  const [shown, setShown] = useState(open)

  const [query, setQuery] = useState("")
  const [recent, setRecent] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)

  // Locked while the panel is *visible*, not just while it's wanted — releasing
  // it at the start of the exit would reflow the page behind a fading dialog.
  useScrollLock(mounted)
  useEscapeKey(open, onClose)

  /* ── Mount / enter / exit ─────────────────────────────────── */
  useEffect(() => {
    if (!open) {
      setShown(false)
      const timer = setTimeout(() => setMounted(false), TRANSITION_MS)
      return () => clearTimeout(timer)
    }

    setMounted(true)

    // Two frames: the first lets React commit the panel in its closed state, the
    // second guarantees the browser painted it before the classes flip.
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setShown(true))
    })

    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [open])

  /* ── Reset on open ────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return

    setRecent(readRecent())
    setQuery("")
    setSuggestions([])
    // Delay focus a frame so the open animation doesn't fight the keyboard.
    const timer = setTimeout(() => inputRef.current?.focus(), 60)
    return () => clearTimeout(timer)
  }, [open])

  /* ── Suggestions ──────────────────────────────────────────── */
  const trimmed = query.trim()
  const debouncedQuery = useDebouncedValue(trimmed, 250)

  useEffect(() => {
    if (!open || debouncedQuery.length < MIN_QUERY) {
      setSuggestions([])
      setSearching(false)
      return
    }

    const controller = new AbortController()
    setSearching(true)

    api
      .get(`/products?search=${encodeURIComponent(debouncedQuery)}&limit=${MAX_SUGGESTIONS}`, {
        signal: controller.signal,
      })
      .then(({ data }) => {
        setSuggestions((Array.isArray(data) ? data : data?.products || []).slice(0, MAX_SUGGESTIONS))
        setSearching(false)
      })
      .catch((error) => {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") return
        setSuggestions([])
        setSearching(false)
      })

    return () => controller.abort()
  }, [open, debouncedQuery])

  const runSearch = (term) => {
    const value = term.trim()
    if (!value) return

    setRecent(pushRecent(value))
    navigate(`/products?search=${encodeURIComponent(value)}`)
    onClose?.()
  }

  const openProduct = (product) => {
    navigate(`/products/${product._id}`)
    onClose?.()
  }

  const clearRecent = () => {
    try {
      localStorage.removeItem(RECENT_KEY)
    } catch {
      /* ignore */
    }
    setRecent([])
  }

  if (!mounted) return null

  // Only wait on the network once the debounce has caught up with the field —
  // otherwise every keystroke would blank the list for 250ms.
  const awaitingResults = searching || debouncedQuery !== trimmed

  return createPortal(
    <div className="fixed inset-0 z-overlay flex flex-col">
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-gray-900/50 backdrop-blur-sm",
          "transition-opacity duration-200 motion-reduce:transition-none",
          shown ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search products"
        className={cn(
          "relative flex max-h-full w-full flex-col bg-white shadow-drawer",
          "rounded-b-sheet sm:mx-auto sm:mt-20 sm:max-w-2xl sm:rounded-sheet",
          "transition-all duration-200 ease-out-expo motion-reduce:transition-none",
          // Drops in from above on phones, where it's pinned to the top edge;
          // settles out of a slight scale on the centred desktop sheet.
          shown ? "translate-y-0 opacity-100 sm:scale-100" : "-translate-y-3 opacity-0 sm:scale-[0.98]",
        )}
      >
        {/* Search field */}
        <form
          onSubmit={(event) => {
            event.preventDefault()
            runSearch(query)
          }}
          className="flex shrink-0 items-center gap-2 border-b border-gray-100 p-3 pt-safe sm:p-4"
        >
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search bangles, earrings, cosmetics…"
              aria-label="Search products"
              /* text-base (16px) prevents iOS Safari zooming in on focus. */
              className={cn(
                "h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-10 text-base text-gray-900",
                "placeholder:text-gray-400 transition-colors",
                "focus:border-pink-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-200",
              )}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("")
                  inputRef.current?.focus()
                }}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
          </div>

          <IconButton label="Close search" onClick={onClose} size="lg" className="shrink-0">
            <X />
          </IconButton>
        </form>

        {/* One calc() rather than `pb-4 pb-safe`: both set padding-bottom and the
            custom utility would simply win, dropping the 1rem. This used to be
            `pb-bottom-nav`, which reserved 4rem for a bar that sits at z-45 —
            behind this overlay, and so never over this content. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-6">
          {trimmed ? (
            /* ── Typing: products first ─────────────────────── */
            <div className="flex flex-col gap-4">
              {suggestions.length > 0 && (
                <ul className="-mx-2 flex flex-col">
                  {suggestions.map((product) => (
                    <li key={product._id}>
                      <button
                        type="button"
                        onClick={() => openProduct(product)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors",
                          "hover:bg-gray-50",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500",
                        )}
                      >
                        <Image
                          src={product.images?.[0]?.url || product.image}
                          alt=""
                          aspect="square"
                          fit="cover"
                          width={120}
                          sizes="48px"
                          background="bg-gray-50"
                          rounded="rounded-lg"
                          className="h-12 w-12 shrink-0"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-gray-900">{product.name}</span>
                          <span className="mt-0.5 block text-xs text-gray-500">{formatPrice(product.price)}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Three skeleton rows while the first response is in flight.
                  Subsequent queries keep the previous list on screen instead —
                  swapping results for placeholders on every keystroke flickers. */}
              {suggestions.length === 0 && awaitingResults && trimmed.length >= MIN_QUERY && (
                <ul aria-hidden="true" className="-mx-2 flex flex-col">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <li key={i} className="flex items-center gap-3 p-2">
                      <Skeleton className="h-12 w-12 shrink-0" />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-2/3" rounded="rounded" />
                        <Skeleton className="h-3 w-16" rounded="rounded" />
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {suggestions.length === 0 && !awaitingResults && trimmed.length >= MIN_QUERY && (
                <p role="status" className="px-1 py-2 text-sm text-gray-500">
                  No products match &ldquo;{trimmed}&rdquo;.
                </p>
              )}

              {/* Always available, so Enter and the button agree — and so a
                  suggestion list that missed the mark isn't a dead end. Outline
                  while there are products above it (they're the primary answer),
                  solid when there aren't and this is the only way forward. */}
              <Button
                variant={suggestions.length > 0 ? "outline" : "primary"}
                fullWidth
                onClick={() => runSearch(query)}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="justify-between"
              >
                <span className="truncate">Search all for &ldquo;{trimmed}&rdquo;</span>
              </Button>
            </div>
          ) : (
            /* ── Empty field: somewhere to go ───────────────── */
            <>
              {recent.length > 0 && (
                <section className="mb-6">
                  <div className="mb-2.5 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Recent</h3>
                    <button
                      type="button"
                      onClick={clearRecent}
                      className="text-xs font-medium text-pink-600 transition-colors hover:text-pink-700"
                    >
                      Clear
                    </button>
                  </div>

                  <ul className="-mx-2 flex flex-col">
                    {recent.map((term) => (
                      <li key={term}>
                        <button
                          type="button"
                          onClick={() => runSearch(term)}
                          className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-pink-600"
                        >
                          <Clock aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-400" />
                          <span className="truncate">{term}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section>
                <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Categories</h3>

                <ul className="flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => (
                    <li key={category.slug}>
                      <button
                        type="button"
                        onClick={() => {
                          navigate(categoryPath(category.slug))
                          onClose?.()
                        }}
                        className={cn(
                          "rounded-full border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-700",
                          "transition-colors duration-200 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500",
                        )}
                      >
                        {category.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default SearchOverlay
