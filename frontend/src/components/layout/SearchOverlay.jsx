import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Clock, Search, X } from "lucide-react"
import { cn } from "../../lib/cn"
import { useEscapeKey, useScrollLock } from "../../lib/hooks"
import { CATEGORIES, categoryPath } from "../../lib/navigation"
import { Button, IconButton } from "../ui"

const RECENT_KEY = "sajbela:recent-searches"
const MAX_RECENT = 5

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
 * Gives search a dedicated surface instead of a cramped inline field, and
 * surfaces recent searches + category shortcuts so an empty query still offers
 * somewhere to go.
 */
const SearchOverlay = ({ open, onClose }) => {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [query, setQuery] = useState("")
  const [recent, setRecent] = useState([])

  useScrollLock(open)
  useEscapeKey(open, onClose)

  useEffect(() => {
    if (!open) return

    setRecent(readRecent())
    setQuery("")
    // Delay focus a frame so the open animation doesn't fight the keyboard.
    const timer = setTimeout(() => inputRef.current?.focus(), 60)
    return () => clearTimeout(timer)
  }, [open])

  const runSearch = (term) => {
    const trimmed = term.trim()
    if (!trimmed) return

    setRecent(pushRecent(trimmed))
    navigate(`/products?search=${encodeURIComponent(trimmed)}`)
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

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-overlay flex flex-col">
      <div className="absolute inset-0 animate-fade-in bg-gray-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search products"
        className="relative flex max-h-full w-full animate-fade-in flex-col bg-white shadow-drawer sm:mx-auto sm:mt-20 sm:max-w-2xl sm:rounded-sheet"
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
              /* text-base (16px) prevents iOS Safari zooming in on focus. */              className={cn(
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

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-bottom-nav sm:pb-6">
          {query.trim() && (
            <Button
              fullWidth
              size="lg"
              onClick={() => runSearch(query)}
              rightIcon={<ArrowRight className="h-4 w-4" />}
              className="mb-6 justify-between"
            >
              <span className="truncate">Search for &ldquo;{query.trim()}&rdquo;</span>
            </Button>
          )}

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

              <ul className="flex flex-col">
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
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default SearchOverlay
