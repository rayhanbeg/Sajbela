import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useSearchParams } from "react-router-dom"
import { ArrowUpDown, Check, PackageSearch, SlidersHorizontal } from "lucide-react"

import { fetchProducts } from "../../lib/store/productSlice"
import {
  DEFAULT_SORT,
  FILTER_KEYS,
  PAGE_SIZE,
  SORT_OPTIONS,
  applyFilterPatch,
  describeActiveFilters,
  readFilters,
  readPage,
  readSort,
  toQueryParams,
} from "../../lib/catalog"
import { cn } from "../../lib/cn"
import { Button, Drawer, EmptyState, ErrorState, IconButton, Pagination, SkeletonProductCard } from "../ui"
import ProductCard from "./ProductCard"
import ProductFilters from "./ProductFilters"

/**
 * The shop experience: products, and two icons to control them.
 *
 * Shared by /products and /category/:slug so the two can't drift apart. The
 * category route passes `lockedFilters={{ category: slug }}`, which forces the
 * filter into every request but keeps it out of the URL and out of the filter
 * panel — the route already says which category you're in.
 *
 * All state lives in the query string. The previous implementation mirrored
 * the filters into component state as well, and the two copies had to be kept
 * in sync by an `isInitialized` flag and two chained effects.
 *
 * On chrome: this page used to carry a permanent 288px filter sidebar, a
 * labelled Filters button, a sort dropdown showing its current value, and a
 * row of removable filter chips with a "Clear all" link — four separate pieces
 * of furniture competing with the products for attention. Everything now lives
 * behind two icon buttons, which leaves the grid the full width of the page at
 * every breakpoint. Nothing was dropped: both sheets reach the same filters and
 * the same sort options, and a dot on the filter icon reports when a filter is
 * narrowing the results. The category cross-links that used to sit in the
 * sidebar are still crawlable from the header and footer, which list every
 * category on every page.
 */

const GRID_CLASSES = "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5"

// Four columns at lg and no sidebar, so a card is roughly a quarter of the
// content width once the gutters are taken off.
const CARD_SIZES = "(max-width: 640px) 47vw, (max-width: 768px) 31vw, 24vw"

const ProductCatalog = ({ lockedFilters = {}, emptyAction, className }) => {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const { products, pagination, loading, error } = useSelector((state) => state.products)

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const lockedKeys = Object.keys(lockedFilters)

  const urlFilters = readFilters(searchParams)
  const sort = readSort(searchParams)
  const page = readPage(searchParams)

  // Locked values win — a stray ?category=rings on /category/bangles shouldn't
  // show rings under a "Bangles" heading.
  const filters = { ...urlFilters, ...lockedFilters }

  /*
   * The effect keys off a *string*, not the params object. A freshly built
   * object has a new identity on every render, so depending on it directly
   * would re-fetch in a loop.
   */
  const queryKey = JSON.stringify(toQueryParams({ filters, sort, page }))

  useEffect(() => {
    dispatch(fetchProducts(JSON.parse(queryKey)))
  }, [dispatch, queryKey])

  const patch = (changes) => {
    setSearchParams(applyFilterPatch(searchParams, changes), { replace: true })
  }

  const clearAll = () => {
    const next = new URLSearchParams(searchParams)
    for (const key of [...FILTER_KEYS, "page"]) {
      if (!lockedKeys.includes(key)) next.delete(key)
    }
    setSearchParams(next, { replace: true })
  }

  const goToPage = (nextPage) => {
    setSearchParams(applyFilterPatch(searchParams, { page: nextPage }), { replace: false })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Counted, not listed. The number rides on the icon's accessible name so the
  // dot isn't the only way to know a filter is on.
  const activeCount = describeActiveFilters(filters, lockedKeys).length
  const totalPages = pagination?.totalPages ?? 1

  return (
    <div className={cn("page-container py-5 md:py-8", className)}>
      {/* ── Controls ──────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-2 pb-4">
        <IconButton label="Sort products" variant="outline" onClick={() => setSortOpen(true)}>
          <ArrowUpDown />
        </IconButton>

        <IconButton
          label={activeCount > 0 ? `Filters, ${activeCount} applied` : "Filters"}
          variant="outline"
          onClick={() => setFiltersOpen(true)}
        >
          <SlidersHorizontal />
          {activeCount > 0 && (
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-pink-600 ring-2 ring-white" />
          )}
        </IconButton>
      </div>

      {/* ── Products ──────────────────────────────────────────── */}
      {loading ? (
        <div className={GRID_CLASSES} aria-hidden="true">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <SkeletonProductCard key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          description={typeof error === "string" ? error : "We couldn't load these products."}
          onRetry={() => dispatch(fetchProducts(JSON.parse(queryKey)))}
        />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<PackageSearch />}
          title="No products found"
          action={
            activeCount > 0 ? (
              <Button onClick={clearAll}>Clear filters</Button>
            ) : (
              emptyAction || <Button to="/products">Browse all products</Button>
            )
          }
        />
      ) : (
        <>
          <ul className={GRID_CLASSES}>
            {products.map((product, index) => (
              <li key={product._id}>
                <ProductCard
                  product={product}
                  // First row is above the fold on most viewports.
                  priority={page === 1 && index < 4}
                  sizes={CARD_SIZES}
                />
              </li>
            ))}
          </ul>

          <Pagination
            currentPage={pagination?.currentPage || page}
            totalPages={totalPages}
            onPageChange={goToPage}
            className="mt-10"
          />
        </>
      )}

      {/* ── Filter sheet ──────────────────────────────────────── */}
      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        side="bottom"
        title="Filters"
        bodyClassName="px-4 py-4"
      >
        {/*
          No footer. Filters apply live, so a "Show N results" button only ever
          confirmed something that had already happened — and "Clear all" is
          rendered by the panel itself whenever there's something to clear.
        */}
        <ProductFilters
          filters={filters}
          lockedKeys={lockedKeys}
          onChange={patch}
          onClear={clearAll}
          showClear={activeCount > 0}
        />
      </Drawer>

      {/* ── Sort sheet ────────────────────────────────────────── */}
      <Drawer open={sortOpen} onClose={() => setSortOpen(false)} side="bottom" title="Sort" bodyClassName="px-2 py-2">
        <ul>
          {SORT_OPTIONS.map((option) => {
            const selected = sort === option.value

            return (
              <li key={option.value}>
                <button
                  type="button"
                  aria-current={selected || undefined}
                  onClick={() => {
                    // The default sort is implied by an absent param, which
                    // keeps the tidiest URL shareable.
                    patch({ sort: option.value === DEFAULT_SORT ? "" : option.value })
                    setSortOpen(false)
                  }}
                  className={cn(
                    "flex min-h-[2.75rem] w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm",
                    "transition-colors duration-150",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500",
                    selected ? "bg-pink-50/70 font-medium text-pink-900" : "text-gray-700 hover:bg-gray-50",
                  )}
                >
                  {option.label}
                  {selected && <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-pink-600" />}
                </button>
              </li>
            )
          })}
        </ul>
      </Drawer>
    </div>
  )
}

export default ProductCatalog
