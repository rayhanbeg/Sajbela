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
  readSort,
  toQueryParams,
} from "../../lib/catalog"
import { cn } from "../../lib/cn"
import { Button, Drawer, EmptyState, ErrorState, IconButton, SkeletonProductCard, useToast } from "../ui"
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
 *
 * ── Paging ───────────────────────────────────────────────────────────────
 *
 * One "Load more" button, not a numbered strip. Page numbers make sense for a
 * table you scan and return to; for a photo grid you browse, they interrupt it
 * — every click threw the shopper back to the top of a fresh page and lost the
 * row they were looking at, and on a 375px screen the numbers had already
 * collapsed to a "Page 3 of 9" label that told them nothing they could act on.
 *
 * The page number is no longer in the URL either. It could only lie: reloading
 * a ?page=3 link would show products 25–36 with nothing above them, which is
 * not the view that was shared. Filters and sort stay in the URL, where they
 * describe a result set that reproduces exactly.
 */

const GRID_CLASSES = "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5"

// Four columns at lg and no sidebar, so a card is roughly a quarter of the
// content width once the gutters are taken off.
const CARD_SIZES = "(max-width: 640px) 47vw, (max-width: 768px) 31vw, 24vw"

const ProductCatalog = ({ lockedFilters = {}, emptyAction, className }) => {
  const dispatch = useDispatch()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const { products, pagination, loading, loadingMore, error } = useSelector((state) => state.products)

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const lockedKeys = Object.keys(lockedFilters)

  const urlFilters = readFilters(searchParams)
  const sort = readSort(searchParams)

  // Locked values win — a stray ?category=rings on /category/bangles shouldn't
  // show rings under a "Bangles" heading.
  const filters = { ...urlFilters, ...lockedFilters }

  /*
   * The effect keys off a *string*, not the params object. A freshly built
   * object has a new identity on every render, so depending on it directly
   * would re-fetch in a loop.
   *
   * Always page 1: this is the "the query changed, start over" fetch. Growing
   * the list is `loadMore`'s job and it dispatches directly, so a re-render
   * can't replay it.
   */
  const queryKey = JSON.stringify(toQueryParams({ filters, sort, page: 1 }))

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

  /*
   * The next page number comes from the server's own `currentPage` rather than
   * a counter here, so the two can't drift — and because the button is disabled
   * while the request is in flight, a double tap can't skip a page.
   */
  const loadMore = async () => {
    const nextPage = (pagination?.currentPage || 1) + 1

    try {
      await dispatch(fetchProducts({ ...JSON.parse(queryKey), page: nextPage, append: true })).unwrap()
    } catch {
      toast.error("Couldn't load more products")
    }
  }

  // Counted, not listed. The number rides on the icon's accessible name so the
  // dot isn't the only way to know a filter is on.
  const activeCount = describeActiveFilters(filters, lockedKeys).length
  const hasMore = pagination?.hasNext ?? (pagination?.currentPage || 1) < (pagination?.totalPages ?? 1)

  return (
    <div className={cn("page-container py-5 md:py-8", className)}>
      {/*
        ── Controls ────────────────────────────────────────────
        One at each end rather than a pair in the corner. They do opposite
        things — one reorders what's there, the other changes what's there —
        and sitting them shoulder to shoulder read as a single two-part
        control, which is also how you end up tapping the wrong one.
      */}
      <div className="flex items-center justify-between gap-2 pb-4">
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
                  priority={index < 4}
                  sizes={CARD_SIZES}
                />
              </li>
            ))}
          </ul>

          {/*
            One button, centred, and nothing else. No "showing 24 of 57" line
            above it — the grid is the count, and the button already says
            there's more. It stays mounted while it loads, so focus doesn't
            move and the keyboard can click it again the moment it's live.
          */}
          {hasMore && (
            <div className="mt-8 flex justify-center md:mt-10">
              <Button
                variant="outline"
                size="lg"
                onClick={loadMore}
                loading={loadingMore}
                loadingText="Loading…"
                className="min-w-[11rem]"
              >
                Load more
              </Button>
            </div>
          )}
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
