import { CATEGORIES } from "./navigation"
import { formatPrice } from "./utils"

/**
 * Catalogue filtering: the option lists and the URL <-> state mapping.
 *
 * The URL is the single source of truth for the shop page. Every filter change
 * writes a query string and the page reacts to it, so a filtered view is
 * shareable, bookmarkable, and survives the back button — previously the page
 * kept a second copy of the filters in component state and the two could drift.
 *
 * Param names and values must match what backend/controllers/productController
 * accepts: category, search, color, price ("min-max"), minPrice, maxPrice,
 * sort, page, limit.
 */

export const PAGE_SIZE = 12

/** Colour names are matched case-insensitively against colors.name / color. */
export const COLORS = [
  { value: "gold", label: "Gold", swatch: "#d4af37" },
  { value: "silver", label: "Silver", swatch: "#c0c0c0" },
  { value: "rose-gold", label: "Rose Gold", swatch: "#b76e79" },
  { value: "black", label: "Black", swatch: "#1f2937" },
  { value: "white", label: "White", swatch: "#f9fafb" },
  { value: "red", label: "Red", swatch: "#dc2626" },
  { value: "blue", label: "Blue", swatch: "#2563eb" },
  { value: "green", label: "Green", swatch: "#16a34a" },
  { value: "pink", label: "Pink", swatch: "#ec4899" },
]

/** 999999 is the backend's "no upper bound" sentinel. */
export const PRICE_RANGES = [
  { value: "0-1000", label: `Under ${formatPrice(1000)}` },
  { value: "1000-2000", label: `${formatPrice(1000)} – ${formatPrice(2000)}` },
  { value: "2000-5000", label: `${formatPrice(2000)} – ${formatPrice(5000)}` },
  { value: "5000-999999", label: `Above ${formatPrice(5000)}` },
]

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
]

export const DEFAULT_SORT = "newest"

/**
 * Curated slices of the catalogue, linked to from the home-page rails.
 * The backend maps these onto `isNewArrival` / `isCombo`.
 */
export const SECTIONS = [
  { value: "new-arrivals", label: "New arrivals" },
  { value: "combo", label: "Combos" },
]

/** Filter keys only — `sort` and `page` are handled separately. */
export const FILTER_KEYS = ["category", "color", "price", "search", "minPrice", "maxPrice", "section"]

/** URLSearchParams -> a plain filter object with "" for absent values. */
export function readFilters(searchParams) {
  const filters = {}
  for (const key of FILTER_KEYS) {
    filters[key] = searchParams.get(key) || ""
  }
  return filters
}

export function readSort(searchParams) {
  const sort = searchParams.get("sort")
  return SORT_OPTIONS.some((option) => option.value === sort) ? sort : DEFAULT_SORT
}

export function readPage(searchParams) {
  const page = Number.parseInt(searchParams.get("page"), 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

/**
 * Build the params object sent to GET /api/products.
 * Empty strings are dropped so we never send `category=`.
 */
export function toQueryParams({ filters, sort, page, limit = PAGE_SIZE }) {
  const params = { page, limit, sort }

  for (const key of FILTER_KEYS) {
    const value = filters[key]?.toString().trim()
    if (value) params[key] = value
  }

  return params
}

/**
 * Apply a patch to the current search params.
 * Any filter change resets to page 1 — staying on page 4 of a result set that
 * now has 2 pages is how you get a confusing "no products found".
 */
export function applyFilterPatch(searchParams, patch) {
  const next = new URLSearchParams(searchParams)

  for (const [key, value] of Object.entries(patch)) {
    if (value === "" || value === null || value === undefined) {
      next.delete(key)
    } else {
      next.set(key, String(value))
    }
  }

  if (!Object.prototype.hasOwnProperty.call(patch, "page")) {
    next.delete("page")
  }

  return next
}

/** Removable chips for the active-filter row. `lockedKeys` are not removable. */
export function describeActiveFilters(filters, lockedKeys = []) {
  const chips = []

  const push = (key, label, patch) => {
    if (lockedKeys.includes(key)) return
    chips.push({ key, label, patch })
  }

  if (filters.section) {
    const section = SECTIONS.find((s) => s.value === filters.section)
    push("section", section?.label || filters.section, { section: "" })
  }

  if (filters.category) {
    const category = CATEGORIES.find((c) => c.slug === filters.category.toLowerCase())
    push("category", category?.label || filters.category, { category: "" })
  }

  if (filters.color) {
    const color = COLORS.find((c) => c.value === filters.color)
    push("color", color?.label || filters.color, { color: "" })
  }

  if (filters.price) {
    const range = PRICE_RANGES.find((r) => r.value === filters.price)
    push("price", range?.label || filters.price, { price: "" })
  }

  // A custom range is only meaningful when no preset is active.
  if (!filters.price && (filters.minPrice || filters.maxPrice)) {
    const min = filters.minPrice ? formatPrice(filters.minPrice) : formatPrice(0)
    const max = filters.maxPrice ? formatPrice(filters.maxPrice) : "any"
    push("minPrice", `${min} – ${max}`, { minPrice: "", maxPrice: "" })
  }

  if (filters.search) {
    push("search", `“${filters.search}”`, { search: "" })
  }

  return chips
}

/** True when anything beyond the locked keys is filtering the results. */
export function hasActiveFilters(filters, lockedKeys = []) {
  return describeActiveFilters(filters, lockedKeys).length > 0
}
