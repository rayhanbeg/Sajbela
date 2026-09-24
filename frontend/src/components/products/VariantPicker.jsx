import { Check } from "lucide-react"

import { cn } from "../../lib/cn"

/**
 * Variant selection for the product page.
 *
 * Replaces two hand-rolled dropdowns that each duplicated their own open/close
 * state, click-outside handling and option markup. Swatches and chips show
 * every option at once — on a phone that's one tap instead of three, and the
 * out-of-stock options stay visible (and disabled) rather than being filtered
 * out, so "sold out in my size" reads as information rather than absence.
 *
 * Both pickers are radiogroups: arrow keys move between options natively
 * because they're real radio inputs behind the styled label.
 */

/** Colour names the catalogue uses that have no `code` stored on the product. */
const NAMED_COLORS = {
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  purple: "#a855f7",
  pink: "#ec4899",
  black: "#111827",
  white: "#ffffff",
  gray: "#9ca3af",
  grey: "#9ca3af",
  brown: "#92400e",
  navy: "#1e3a8a",
  maroon: "#7f1d1d",
  olive: "#65a30d",
  teal: "#14b8a6",
  silver: "#c0c0c0",
  gold: "#d4af37",
  "rose gold": "#b76e79",
  cream: "#fdf6e3",
  beige: "#e8dcc4",
}

const MULTI_GRADIENT = "linear-gradient(135deg, #f472b6, #a855f7, #38bdf8, #4ade80, #fbbf24)"

/**
 * Products store the swatch as `code`; a few older records used `hexCode`.
 * Anything unrecognised falls back to a neutral chip rather than a wrong colour.
 */
export function colorSwatch(color) {
  const raw = color?.code || color?.hexCode
  if (typeof raw === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw.trim())) return raw.trim()

  const name = String(color?.name || "").trim().toLowerCase()
  if (name.includes("multi")) return MULTI_GRADIENT
  return NAMED_COLORS[name] || null
}

const isSellable = (option) => option?.available !== false && Number(option?.stock) > 0

/** Shared shell for one selectable option. */
const Option = ({ name, checked, disabled, onSelect, className, children, srLabel }) => (
  <label
    className={cn(
      "relative inline-flex cursor-pointer items-center justify-center",
      "transition-all duration-200 ease-in-out-smooth",
      "focus-within:ring-2 focus-within:ring-pink-500 focus-within:ring-offset-2",
      disabled && "cursor-not-allowed",
      className,
    )}
  >
    <input
      type="radio"
      name={name}
      checked={checked}
      disabled={disabled}
      onChange={onSelect}
      className="sr-only"
    />
    <span className="sr-only">{srLabel}</span>
    {children}
  </label>
)

/* ── Colours ─────────────────────────────────────────────── */

export const ColorPicker = ({ colors = [], value, onChange, className }) => {
  if (colors.length === 0) return null

  return (
    <fieldset className={className}>
      <legend className="mb-2.5 flex w-full items-baseline justify-between gap-3 text-sm font-semibold text-gray-900">
        <span>Colour</span>
        <span className={cn("text-sm font-normal", value ? "text-gray-600" : "text-pink-600")}>
          {value ? value.name : "Choose a colour"}
        </span>
      </legend>

      <div className="flex flex-wrap gap-2.5">
        {colors.map((color, index) => {
          const swatch = colorSwatch(color)
          const sellable = isSellable(color)
          const checked = value?.name === color.name

          return (
            <Option
              key={`${color.name}-${index}`}
              name="product-color"
              checked={checked}
              disabled={!sellable}
              onSelect={() => onChange(color)}
              srLabel={`${color.name}${sellable ? "" : " — out of stock"}`}
              className="rounded-full"
            >
              <span
                aria-hidden="true"
                title={color.name}
                style={swatch ? { background: swatch } : undefined}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-inset ring-black/10",
                  "transition-transform duration-200",
                  !swatch && "bg-gray-100 text-[0.625rem] font-semibold uppercase text-gray-500",
                  checked
                    ? "scale-105 outline outline-2 outline-offset-2 outline-pink-600"
                    : sellable && "hover:scale-105",
                  !sellable && "opacity-40",
                )}
              >
                {checked && (
                  <Check
                    className={cn(
                      "h-4 w-4 drop-shadow",
                      // Pale swatches need a dark tick to stay visible.
                      swatch && /^#(f|e)/i.test(swatch) ? "text-gray-900" : "text-white",
                    )}
                    strokeWidth={3}
                  />
                )}
                {!swatch && !checked && color.name.slice(0, 2)}
              </span>

              {!sellable && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-1/2 h-px -rotate-45 bg-gray-400"
                />
              )}
            </Option>
          )
        })}
      </div>
    </fieldset>
  )
}

/* ── Sizes ───────────────────────────────────────────────── */

export const SizePicker = ({ sizes = [], value, onChange, className, sizeGuideAction }) => {
  // Blank entries exist in older product records; they'd render as empty chips.
  const options = sizes.filter((option) => option?.size && String(option.size).trim() !== "")
  if (options.length === 0) return null

  return (
    <fieldset className={className}>
      <legend className="mb-2.5 flex w-full items-baseline justify-between gap-3 text-sm font-semibold text-gray-900">
        <span>Size</span>
        {sizeGuideAction || (
          <span className={cn("text-sm font-normal", value ? "text-gray-600" : "text-pink-600")}>
            {value ? value.measurement || value.size : "Choose a size"}
          </span>
        )}
      </legend>

      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => {
          const sellable = isSellable(option)
          const checked = value?.size === option.size

          return (
            <Option
              key={`${option.size}-${index}`}
              name="product-size"
              checked={checked}
              disabled={!sellable}
              onSelect={() => onChange(option)}
              srLabel={`Size ${option.size}${option.measurement ? `, ${option.measurement}` : ""}${
                sellable ? "" : " — out of stock"
              }`}
              className="rounded-lg"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-11 min-w-[2.75rem] items-center justify-center rounded-lg border px-3",
                  "text-sm font-semibold transition-colors duration-200",
                  checked
                    ? "border-pink-600 bg-pink-600 text-white"
                    : sellable
                      ? "border-gray-300 bg-white text-gray-900 hover:border-gray-900"
                      : "border-gray-200 bg-gray-50 text-gray-400 line-through",
                )}
              >
                {option.size}
              </span>
            </Option>
          )
        })}
      </div>

      {value?.measurement && (
        <p className="mt-2 text-xs text-gray-500">
          Size {value.size} measures {value.measurement}.
        </p>
      )}
    </fieldset>
  )
}
