import { cn } from "../../lib/cn"
import { formatPrice } from "../../lib/utils"

/**
 * Price display with optional strike-through original and discount badge.
 *
 * Centralises the "is this actually discounted?" check — `originalPrice` is
 * optional on Product and is sometimes present but <= price, which would
 * otherwise render a nonsensical "0% OFF" or a higher struck-through value.
 */

const SIZES = {
  sm: { current: "text-sm", original: "text-xs", badge: "text-[0.625rem] px-1.5 py-0.5" },
  md: { current: "text-base", original: "text-xs", badge: "text-xs px-1.5 py-0.5" },
  lg: { current: "text-xl", original: "text-sm", badge: "text-xs px-2 py-0.5" },
  xl: { current: "text-2xl sm:text-3xl", original: "text-base", badge: "text-sm px-2 py-1" },
}

export function getDiscount(price, originalPrice) {
  const current = Number(price) || 0
  const original = Number(originalPrice) || 0

  if (!original || original <= current) return null

  return {
    original,
    amount: original - current,
    percent: Math.round(((original - current) / original) * 100),
  }
}

const Price = ({
  price,
  originalPrice,
  size = "md",
  showBadge = true,
  layout = "row",
  className,
  currentClassName,
}) => {
  const s = SIZES[size] || SIZES.md
  const discount = getDiscount(price, originalPrice)

  return (
    <div
      className={cn(
        "flex gap-x-2 gap-y-0.5",
        layout === "column" ? "flex-col items-start" : "flex-wrap items-baseline",
        className,
      )}
    >
      <span className={cn("font-bold text-pink-600", s.current, currentClassName)}>{formatPrice(price)}</span>

      {discount && (
        <span className={cn("flex items-baseline gap-2")}>
          <span className={cn("text-gray-400 line-through", s.original)}>{formatPrice(discount.original)}</span>

          {showBadge && (
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded font-bold uppercase tracking-wide",
                "bg-red-500 text-white",
                s.badge,
              )}
            >
              {discount.percent}% off
            </span>
          )}
        </span>
      )}
    </div>
  )
}

export default Price
