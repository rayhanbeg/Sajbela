import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import api from "../../lib/api"
import { cn } from "../../lib/cn"
import ProductCard from "../products/ProductCard"
import { Button, ErrorState, IconButton, SectionHeader, SkeletonProductCard } from "../ui"

/**
 * One data-driven product section, used by New Arrivals / Combos / Best
 * Sellers. Those three files were previously ~150 lines each of copy-pasted
 * fetch + skeleton + star-rendering + card markup; they're now thin configs.
 *
 * `layout`:
 *   "rail" — horizontal scroll-snap on mobile, grid from md up. Keeps a long
 *            home page from becoming an endless vertical scroll on phones.
 *   "grid" — always a responsive grid.
 *
 * The rail uses native CSS scroll-snap rather than Swiper: it's real
 * scrollable content (so it works with a trackpad, a screen reader's
 * navigation and keyboard scrolling), and it ships no JavaScript.
 */

const GRID_CLASSES = "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6"

/** Endpoints return a bare array; a couple return { data: [...] }. Accept both. */
function unwrap(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.products)) return payload.products
  return []
}

const ProductShowcase = ({
  endpoint,
  eyebrow,
  title,
  description,
  actionLabel,
  actionTo,
  layout = "rail",
  limit = 8,
  skeletonCount = 4,
  exclude,
  className,
  priority = false,
}) => {
  const [products, setProducts] = useState([])
  const [status, setStatus] = useState("loading") // loading | ready | error
  const railRef = useRef(null)
  const [scroll, setScroll] = useState({ start: true, end: true })

  // Depend on a string, not the array — an inline `exclude={[id]}` would have a
  // new identity every render and re-fetch forever.
  const excludeKey = (Array.isArray(exclude) ? exclude : exclude ? [exclude] : []).filter(Boolean).join(",")

  const load = useCallback(
    async (signal) => {
      setStatus("loading")
      try {
        const response = await api.get(endpoint, { signal })
        // Keeps the product you're already looking at out of its own "related
        // products" rail. Filter before slicing so the row stays full.
        const excluded = excludeKey ? excludeKey.split(",") : []
        setProducts(
          unwrap(response.data)
            .filter((product) => !excluded.includes(product._id))
            .slice(0, limit),
        )
        setStatus("ready")
      } catch (error) {
        // An aborted request isn't a failure — the component just unmounted.
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") return
        console.error(`Failed to load ${endpoint}:`, error)
        setStatus("error")
      }
    },
    [endpoint, limit, excludeKey],
  )

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  /** Tracks whether the arrows should be disabled at either end of the rail. */
  const syncScroll = useCallback(() => {
    const el = railRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    setScroll({ start: el.scrollLeft <= 4, end: el.scrollLeft >= maxScroll - 4 })
  }, [])

  useEffect(() => {
    if (layout !== "rail" || status !== "ready") return
    syncScroll()
    const el = railRef.current
    if (!el) return
    el.addEventListener("scroll", syncScroll, { passive: true })
    window.addEventListener("resize", syncScroll)
    return () => {
      el.removeEventListener("scroll", syncScroll)
      window.removeEventListener("resize", syncScroll)
    }
  }, [layout, status, products.length, syncScroll])

  const nudge = (direction) => {
    const el = railRef.current
    if (!el) return
    // Scroll by a bit less than a full viewport so the next card peeks in.
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" })
  }

  // A failed section shouldn't wipe out the rest of the home page, but it also
  // shouldn't silently vanish the way the old components did — show a retry.
  if (status === "error") {
    return (
      <section className={cn("py-10 md:py-14", className)}>
        <div className="page-container">
          <SectionHeader eyebrow={eyebrow} title={title} description={description} align="left" />
          <ErrorState
            size="sm"
            description={`We couldn't load ${title.toLowerCase()} right now.`}
            onRetry={() => load()}
          />
        </div>
      </section>
    )
  }

  if (status === "ready" && products.length === 0) return null

  const showRail = layout === "rail"
  const canScroll = showRail && products.length > 2

  return (
    <section className={cn("py-10 md:py-14", className)}>
      <div className="page-container">
        <div className="flex items-end justify-between gap-4">
          <SectionHeader
            eyebrow={eyebrow}
            title={title}
            description={description}
            align="left"
            className="flex-1"
          />

          {canScroll && (
            // Margins mirror SectionHeader's own mb-6/md:mb-8 so the arrows
            // sit on the same baseline as the heading block.
            <div className="mb-6 hidden shrink-0 gap-2 md:mb-8 md:flex">
              <IconButton
                label={`Scroll ${title} left`}
                variant="outline"
                onClick={() => nudge(-1)}
                disabled={scroll.start}
              >
                <ChevronLeft />
              </IconButton>
              <IconButton
                label={`Scroll ${title} right`}
                variant="outline"
                onClick={() => nudge(1)}
                disabled={scroll.end}
              >
                <ChevronRight />
              </IconButton>
            </div>
          )}
        </div>

        {status === "loading" ? (
          <div className={GRID_CLASSES} aria-hidden="true">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <SkeletonProductCard key={i} />
            ))}
          </div>
        ) : showRail ? (
          <>
            {/*
              Mobile: negative margin + padding so cards bleed to the screen
              edge while the first one still lines up with the page gutter.
            */}
            <ul
              ref={railRef}
              className={cn(
                "-mx-4 flex snap-x-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 scrollbar-hide",
                "sm:gap-4",
                "md:mx-0 md:px-0 md:pb-0",
              )}
            >
              {products.map((product, index) => (
                <li
                  key={product._id}
                  className="w-[46%] min-w-[9.5rem] shrink-0 snap-start-always sm:w-[38%] md:w-[31%] lg:w-[23.5%]"
                >
                  <ProductCard
                    product={product}
                    priority={priority && index === 0}
                    sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 24vw"
                  />
                </li>
              ))}
            </ul>

            {actionLabel && actionTo && (
              <div className="mt-7 text-center md:mt-9">
                <Button to={actionTo} variant="outline" size="lg">
                  {actionLabel}
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <ul className={GRID_CLASSES}>
              {products.map((product, index) => (
                <li key={product._id}>
                  <ProductCard
                    product={product}
                    priority={priority && index < 2}
                    sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 24vw"
                  />
                </li>
              ))}
            </ul>

            {actionLabel && actionTo && (
              <div className="mt-7 text-center md:mt-9">
                <Button to={actionTo} variant="outline" size="lg">
                  {actionLabel}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default ProductShowcase
