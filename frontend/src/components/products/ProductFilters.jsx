import { useEffect, useState } from "react"
import { X } from "lucide-react"

import { COLORS, PRICE_RANGES } from "../../lib/catalog"
import { CATEGORIES, categoryPath } from "../../lib/navigation"
import { cn } from "../../lib/cn"
import { Button, Input } from "../ui"

/**
 * Catalogue filter panel. Purely presentational — it reads the current filter
 * values and reports changes through `onChange(patch)`; the page owns the URL.
 *
 * Rendered twice: as a sticky sidebar from lg up, and inside a bottom-sheet
 * Drawer on mobile. `lockedKeys` hides controls that the route already fixes
 * (the category control on /category/:slug, for instance).
 */

const Group = ({ title, children }) => (
  <fieldset className="border-t border-gray-100 py-5 first:border-t-0 first:pt-0">
    <legend className="mb-3 text-sm font-semibold text-gray-900">{title}</legend>
    {children}
  </fieldset>
)

/**
 * Filter options are single-select (the API takes one value per key) but they
 * must also be clearable, which a plain radio group can't do — clicking the
 * checked radio again does nothing. These are radios for keyboard semantics
 * with an onClick that toggles off when already selected.
 */
const OptionRow = ({ name, value, checked, onSelect, children }) => (
  <label
    className={cn(
      "flex min-h-[2.25rem] cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 -mx-2",
      "transition-colors duration-150 hover:bg-gray-50",
      checked && "bg-pink-50/70 hover:bg-pink-50",
    )}
  >
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={() => onSelect(value)}
      onClick={() => {
        if (checked) onSelect("")
      }}
      className="h-4 w-4 shrink-0 border-gray-300 text-pink-600 focus:ring-2 focus:ring-pink-500 focus:ring-offset-0"
    />
    <span className={cn("min-w-0 flex-1 text-sm", checked ? "font-medium text-pink-900" : "text-gray-700")}>
      {children}
    </span>
  </label>
)

const ProductFilters = ({ filters, onChange, onClear, lockedKeys = [], showClear = true, className }) => {
  // Custom price inputs are local until submitted — firing a request on every
  // keystroke of "1500" would issue four queries and three empty result flashes.
  const [minPrice, setMinPrice] = useState(filters.minPrice || "")
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice || "")

  useEffect(() => {
    setMinPrice(filters.minPrice || "")
    setMaxPrice(filters.maxPrice || "")
  }, [filters.minPrice, filters.maxPrice])

  const applyCustomPrice = (event) => {
    event.preventDefault()
    // Clearing `price` matters: the API checks the preset range first and
    // would ignore min/max while a preset is still set.
    onChange({ price: "", minPrice: minPrice.trim(), maxPrice: maxPrice.trim() })
  }

  const customPriceDirty = minPrice !== (filters.minPrice || "") || maxPrice !== (filters.maxPrice || "")

  return (
    <div className={cn("flex flex-col", className)}>
      {showClear && (
        <div className="flex items-center justify-between gap-3 pb-4">
          <h2 className="text-base font-semibold text-gray-900">Filters</h2>
          <button
            type="button"
            onClick={onClear}
            className={cn(
              "inline-flex items-center gap-1 rounded text-sm font-medium text-pink-600",
              "transition-colors hover:text-pink-700",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2",
            )}
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
            Clear all
          </button>
        </div>
      )}

      {!lockedKeys.includes("category") && (
        <Group title="Category">
          <div className="space-y-0.5">
            {CATEGORIES.map((category) => (
              <OptionRow
                key={category.slug}
                name="category"
                value={category.slug}
                checked={filters.category?.toLowerCase() === category.slug}
                onSelect={(value) => onChange({ category: value })}
              >
                {category.label}
              </OptionRow>
            ))}
          </div>
        </Group>
      )}

      <Group title="Colour">
        <div className="space-y-0.5">
          {COLORS.map((color) => (
            <OptionRow
              key={color.value}
              name="color"
              value={color.value}
              checked={filters.color === color.value}
              onSelect={(value) => onChange({ color: value })}
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: color.swatch }}
                  className="h-4 w-4 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
                />
                {color.label}
              </span>
            </OptionRow>
          ))}
        </div>
      </Group>

      <Group title="Price">
        <div className="space-y-0.5">
          {PRICE_RANGES.map((range) => (
            <OptionRow
              key={range.value}
              name="price"
              value={range.value}
              checked={filters.price === range.value}
              // Selecting a preset clears any custom range so the two can't conflict.
              onSelect={(value) => onChange({ price: value, minPrice: "", maxPrice: "" })}
            >
              {range.label}
            </OptionRow>
          ))}
        </div>

        <form onSubmit={applyCustomPrice} className="mt-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              size="sm"
              placeholder="Min"
              aria-label="Minimum price"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
            />
            <span aria-hidden="true" className="text-sm text-gray-400">
              –
            </span>
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              size="sm"
              placeholder="Max"
              aria-label="Maximum price"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
            />
          </div>

          <Button type="submit" variant="secondary" size="sm" fullWidth disabled={!customPriceDirty}>
            Apply price range
          </Button>
        </form>
      </Group>

      {/* Cross-links: quicker than opening the category group when you already
          know where you're headed, and they give the crawler real category URLs. */}
      {lockedKeys.includes("category") && (
        <Group title="Other categories">
          <ul className="flex flex-wrap gap-1.5">
            {CATEGORIES.filter((c) => c.slug !== filters.category?.toLowerCase()).map((category) => (
              <li key={category.slug}>
                <Button to={categoryPath(category.slug)} variant="outline" size="xs">
                  {category.label}
                </Button>
              </li>
            ))}
          </ul>
        </Group>
      )}
    </div>
  )
}

export default ProductFilters
