import { cn } from "../../lib/cn"

/**
 * Status / label pill.
 *
 * `tone` names map to the meanings already established in the app:
 *   success -> in stock, delivered      danger  -> out of stock, cancelled
 *   warning -> processing, low stock    brand   -> discounts, featured
 *   info    -> shipped                  neutral -> pending, default
 */

const TONES = {
  neutral: "bg-gray-100 text-gray-700 ring-gray-200",
  brand: "bg-pink-100 text-pink-800 ring-pink-200",
  "brand-solid": "bg-pink-600 text-white ring-pink-600",
  success: "bg-green-100 text-green-800 ring-green-200",
  warning: "bg-yellow-100 text-yellow-800 ring-yellow-200",
  danger: "bg-red-100 text-red-800 ring-red-200",
  "danger-solid": "bg-red-500 text-white ring-red-500",
  info: "bg-blue-100 text-blue-800 ring-blue-200",
  admin: "bg-yellow-200 text-yellow-900 ring-yellow-300",
}

const SIZES = {
  xs: "px-1.5 py-0.5 text-[0.625rem] gap-1",
  sm: "px-2 py-0.5 text-xs gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
  lg: "px-3 py-1.5 text-sm gap-1.5",
}

const Badge = ({ tone = "neutral", size = "sm", dot = false, icon, className, children, ...props }) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium ring-1 ring-inset whitespace-nowrap",
        SIZES[size] || SIZES.sm,
        TONES[tone] || TONES.neutral,
        className,
      )}
      {...props}
    >
      {dot && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {icon && (
        <span aria-hidden="true" className="[&_svg]:h-3 [&_svg]:w-3">
          {icon}
        </span>
      )}
      {children}
    </span>
  )
}

/**
 * Small count bubble for the cart icon. Caps at 99+ so a large cart can't
 * blow out the nav layout.
 */
export const CountBadge = ({ count = 0, max = 99, className, label }) => {
  if (!count || count < 1) return null

  const display = count > max ? `${max}+` : String(count)

  return (
    <span
      aria-label={label || `${count} items`}
      className={cn(
        "pointer-events-none absolute flex items-center justify-center rounded-full",
        "bg-red-500 px-1 text-[0.625rem] font-bold leading-none text-white",
        "ring-2 ring-white",
        display.length > 2 ? "h-4 min-w-[1.375rem]" : "h-4 w-4",
        className,
      )}
    >
      {display}
    </span>
  )
}

export default Badge
