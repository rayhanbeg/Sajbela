import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useSearchParams } from "react-router-dom"
import { PackageSearch, SlidersHorizontal } from "lucide-react"

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
import {
  Badge,
  Button,
  Drawer,
  EmptyState,
  ErrorState,
  Pagination,
  Select,
  SkeletonProductCard,
} from "../ui"
import ProductCard from "./ProductCard"
import ProductFilters from "./ProductFilters"

/**
 * The shop experience: filters + sort + grid + pagination.
 *
 * Shared by /products and /category/:slug so the two can't drift apart. The
 * category route passes `lockedFilters={{ category: slug }}`, which forces the
 * filter into every request but keeps it out of the URL and out of the filter
 * panel — the route already says which category you're in.
 *
 * All state lives in the query string. The previous implementation mirrored
 * the filters into component state as well, and the two copies had to be kept
 * in sync by an `isInitialized` flag and two chained effects.
 */

const GRID_CLASSES = "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:gap-5 xl:grid-cols-4"

const ProductCatalog = ({ lockedFilters = {}, emptyAction, className }) => {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const { products, pagination, loading, error } = useSelector((state) => state.products)

  const [filtersOpen, setFiltersOpen] = useState(false)

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

  const chips = describeActiveFilters(filters, lockedKeys)
  const totalPages = pagination?.totalPages ?? 1

  const filterPanel = (
    <ProductFilters
      filters={filters}
      lockedKeys={lockedKeys}
      onChange={patch}
      onClear={clearAll}
      showClear={chips.length > 0}
    />
  )

  return (
    <div className={cn("page-container py-6 md:py-10", className)}>
      <div className="lg:flex lg:gap-8">
        {/* ── Desktop sidebar ─────────────────────────────────── */}
        <aside className="hidden w-64 shrink-0 lg:block xl:w-72">
          {/* top-24 clears the sticky header + announcement bar. */}
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-card border border-gray-100 bg-white p-5 shadow-card">
            {filterPanel}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* ── Toolbar ───────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiltersOpen(true)}
                leftIcon={<SlidersHorizontal className="h-4 w-4" />}
                className="lg:hidden"
              >
                Filters
                {chips.length > 0 && (
                  <Badge tone="brand-solid" size="xs" className="ml-1">
                    {chips.length}
                  </Badge>
                )}
              </Button>

              <Select
                size="sm"
                value={sort}
                aria-label="Sort products"
                onChange={(event) => patch({ sort: event.target.value === DEFAULT_SORT ? "" : event.target.value })}
                containerClassName="w-40 sm:w-48"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* ── Active filter chips ───────────────────────────── */}
          {chips.length > 0 && (
            <ul className="flex flex-wrap items-center gap-2 pt-4">
              {chips.map((chip) => (
                <li key={chip.key}>
                  <button
                    type="button"
                    onClick={() => patch(chip.patch)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-pill bg-pink-50 py-1.5 pl-3 pr-2.5",
                      "text-xs font-medium text-pink-800 ring-1 ring-inset ring-pink-200",
                      "transition-colors hover:bg-pink-100",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500",
                    )}
                  >
                    {chip.label}
                    <span aria-hidden="true" className="text-sm leading-none text-pink-500">
                      &times;
                    </span>
                    <span className="sr-only">Remove filter</span>
                  </button>
                </li>
              ))}

              <li>
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded px-1 text-xs font-semibold text-gray-500 underline-offset-2 hover:text-gray-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                >
                  Clear all
                </button>
              </li>
            </ul>
          )}

          {/* ── Results ───────────────────────────────────────── */}
          <div className="pt-5 md:pt-6">
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
                title="No products match these filters"
                description={
                  chips.length > 0
                    ? "Try removing a filter."
                    : "Nothing here yet — check back soon."
                }
                action={
                  chips.length > 0 ? (
                    <Button onClick={clearAll}>Clear all filters</Button>
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
                        sizes="(max-width: 640px) 47vw, (max-width: 768px) 31vw, (max-width: 1280px) 30vw, 22vw"
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
          </div>
        </div>
      </div>

      {/* ── Mobile filter sheet ─────────────────────────────── */}
      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        side="bottom"
        title="Filters"
        footer={
          <div className="flex gap-2.5">
            {chips.length > 0 && (
              <Button variant="outline" size="lg" onClick={clearAll} className="flex-1">
                Clear all
              </Button>
            )}
            <Button size="lg" onClick={() => setFiltersOpen(false)} className="flex-1">
              {/* Filters apply live, so this confirms rather than submits. */}
              {loading ? "Show results" : `Show ${total} ${total === 1 ? "result" : "results"}`}
            </Button>
          </div>
        }
        bodyClassName="px-4 py-4"
      >
        <ProductFilters filters={filters} lockedKeys={lockedKeys} onChange={patch} onClear={clearAll} showClear={false} />
      </Drawer>
    </div>
  )
}

export default ProductCatalog
