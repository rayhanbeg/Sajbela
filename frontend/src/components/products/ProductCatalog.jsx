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
import { useMediaQuery } from "../../lib/hooks"
import { Button, Drawer, EmptyState, ErrorState, IconButton, Select, SkeletonProductCard, useToast } from "../ui"
import ProductCard from "./ProductCard"
import ProductFilters from "./ProductFilters"

/**
 * The shop experience: products, and the controls that narrow them.
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
 * ── Controls, by screen size ──────────────────────────────────────────────
 *
 * Two different patterns, because a phone and a desktop are not short and tall
 * versions of the same problem.
 *
 * Below lg the filters and the sort live in bottom sheets behind a pair of
 * icons. There is no room for a sidebar next to a two-column grid on a 360px
 * screen, and a sheet is the native idiom for "temporarily take over the
 * screen to answer one question".
 *
 * From lg up they're both permanent, which is what every catalogue of any size
 * does: a filter column down the left, and a sort control on the right of the
 * grid's own toolbar. The reasons are specific rather than conventional —
 *
 *  - There is spare width at lg. Four product columns don't need it, and a
 *    sidebar costs nothing that the grid was using.
 *  - With a mouse, a sheet is two clicks and a dismissal for what a sidebar
 *    does in one, and the dismissal throws away the list of what else you
 *    could have picked.
 *  - The sidebar is the state display. A closed sheet has to be summarised —
 *    a dot, a count, a row of chips — and all three are reconstructions of
 *    something the open panel simply shows. That's why there are no filter
 *    chips above the desktop grid: the checked radio in the sidebar is the
 *    chip, and it's also the control that undoes it.
 *  - Sort is a value, not an action, so on desktop it reads as one: a labelled
 *    control showing "Newest" rather than an icon you have to open to find out.
 *    It's a native <select>, so it's one tab stop and it gives phones the OS
 *    picker if it ever renders there.
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

// Three columns from md, four only at xl. At lg the sidebar takes 15rem out of
// the row, and a fourth column on what's left makes a 157px card — too small
// for a 4:5 photo with a name and a price under it.
const GRID_CLASSES = "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:gap-5 xl:grid-cols-4"

// Steps at the two points the layout changes: the sidebar appearing at lg, and
// the fourth column at xl. Past xl the page container is capped, so the last
// entry is a width rather than a fraction of the viewport.
const CARD_SIZES = "(max-width: 640px) 47vw, (max-width: 1024px) 31vw, (max-width: 1280px) 22vw, 220px"

const ProductCatalog = ({ lockedFilters = {}, emptyAction, className }) => {
  const dispatch = useDispatch()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const { products, pagination, loading, loadingMore, error } = useSelector((state) => state.products)

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  // The sheets belong to the small-screen layout only. Without this, rotating a
  // tablet into landscape with the filter sheet open leaves it covering the
  // sidebar that has just appeared behind it, showing the same controls twice.
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  useEffect(() => {
    if (!isDesktop) return
    setFiltersOpen(false)
    setSortOpen(false)
  }, [isDesktop])

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
      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-8 xl:grid-cols-[16rem_minmax(0,1fr)] xl:gap-10">
        {/*
          ── Filter sidebar (lg and up) ────────────────────────
          `lg:items-start` on the grid is what makes the sticky work: a grid
          item stretches to the row height by default, which leaves a sticky
          box nothing to travel inside. Content-height item, full-height grid
          area, so it pins.

          Capped and scrollable in case the panel outgrows a short laptop
          screen — otherwise its last group would be unreachable while it's
          pinned.
        */}
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pb-2">
          <ProductFilters
            heading
            filters={filters}
            lockedKeys={lockedKeys}
            onChange={patch}
            onClear={clearAll}
            showClear={activeCount > 0}
          />
        </aside>

        {/* `min-w-0` so a long product name can't widen the column past its share. */}
        <div className="min-w-0">
          {/*
            ── Controls, below lg ──────────────────────────────
            One at each end rather than a pair in the corner. They do opposite
            things — one reorders what's there, the other changes what's there
            — and sitting them shoulder to shoulder read as a single two-part
            control, which is also how you end up tapping the wrong one.
          */}
          <div className="flex items-center justify-between gap-2 pb-4 lg:hidden">
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

          {/*
            ── Controls, lg and up ─────────────────────────────
            The count on the left is the one thing the desktop layout can say
            that the grid can't: with a sidebar full of filters next to it, how
            many products a choice left behind is the feedback for having made
            it. Sort sits on the right of the same rule, showing its value.
          */}
          <div className="hidden items-center justify-between gap-4 border-b border-gray-100 pb-4 lg:flex">
            <p className="text-sm text-gray-500">
              {typeof pagination?.total === "number" && !loading ? (
                <>
                  <span className="font-medium text-gray-900">{pagination.total}</span>{" "}
                  {pagination.total === 1 ? "product" : "products"}
                </>
              ) : (
                <span className="sr-only">Loading products</span>
              )}
            </p>

            <label className="flex shrink-0 items-center gap-2">
              <span className="text-sm text-gray-500">Sort</span>
              <Select
                size="sm"
                value={sort}
                onChange={(event) => patch({ sort: event.target.value === DEFAULT_SORT ? "" : event.target.value })}
                containerClassName="w-48"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          {/* ── Products ────────────────────────────────────── */}
          <div className="lg:pt-5">
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
                  One button, centred, and nothing else. No "showing 24 of 57"
                  line above it — the grid is the count, and the button already
                  says there's more. It stays mounted while it loads, so focus
                  doesn't move and the keyboard can click it again the moment
                  it's live.
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
          </div>
        </div>
      </div>

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
