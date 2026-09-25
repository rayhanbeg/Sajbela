import { useCallback, useEffect, useState } from "react"

import api from "../../lib/api"
import { cn } from "../../lib/cn"
import ProductCard from "../products/ProductCard"
import { ErrorState, SectionHeader, SkeletonProductCard } from "../ui"

/**
 * One data-driven product section, used by New Arrivals / Combos / Best
 * Sellers. Those three files were previously ~150 lines each of copy-pasted
 * fetch + skeleton + star-rendering + card markup; they're now thin configs.
 *
 * `layout`:
 *   "rail" — scroll-snap row on phones, plain grid from md up.
 *   "grid" — always a responsive grid.
 *
 * Why the rail stops at `md`: it used to stay a rail at every width, which
 * meant desktop needed a pair of scroll arrows, a scroll-position listener and
 * a resize listener just to make a horizontal row usable with a mouse. Above
 * `md` there's room for a real grid, so the arrows and all their state are
 * gone. Below `md` it's a native CSS scroll-snap row — no JavaScript, and it
 * still works with a trackpad, keyboard and screen-reader navigation.
 */

const GRID_CLASSES = "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5"

const CARD_SIZES = "(max-width: 640px) 46vw, (max-width: 768px) 38vw, (max-width: 1024px) 31vw, 24vw"

/** Endpoints return a bare array; a couple return { data: [...] }. Accept both. */
function unwrap(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.products)) return payload.products
  return []
}

const ProductShowcase = ({
  endpoint,
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

  const header = (
    <SectionHeader
      title={title}
      description={description}
      align="left"
      actionLabel={actionLabel}
      actionTo={actionTo}
    />
  )

  // A failed section shouldn't wipe out the rest of the home page, but it also
  // shouldn't silently vanish the way the old components did — show a retry.
  if (status === "error") {
    return (
      <section className={cn("py-8 md:py-12", className)}>
        <div className="page-container">
          {header}
          <ErrorState size="sm" description={`We couldn't load ${title.toLowerCase()}.`} onRetry={() => load()} />
        </div>
      </section>
    )
  }

  if (status === "ready" && products.length === 0) return null

  return (
    <section className={cn("py-8 md:py-12", className)}>
      <div className="page-container">
        {header}

        {status === "loading" ? (
          <div className={GRID_CLASSES} aria-hidden="true">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <SkeletonProductCard key={i} />
            ))}
          </div>
        ) : (
          <ul
            className={cn(
              layout === "rail"
                ? [
                    /*
                      Phones: negative margin + matching padding so the cards
                      bleed to the screen edge while the first one still lines
                      up with the page gutter.
                    */
                    "-mx-4 flex snap-x-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 scrollbar-hide",
                    "sm:gap-4",
                    // md+: drop out of the scroll container into a grid.
                    "md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0",
                    "lg:grid-cols-4",
                  ].join(" ")
                : GRID_CLASSES,
            )}
          >
            {products.map((product, index) => (
              <li
                key={product._id}
                className={
                  layout === "rail"
                    ? "w-[46%] min-w-[10rem] shrink-0 snap-start-always sm:w-[38%] md:w-auto md:min-w-0"
                    : undefined
                }
              >
                <ProductCard product={product} priority={priority && index < 2} sizes={CARD_SIZES} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export default ProductShowcase
