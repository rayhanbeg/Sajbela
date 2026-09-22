import { Minus, Plus } from "lucide-react"
import { cn } from "../../lib/cn"
import Spinner from "./Spinner"

/**
 * Quantity stepper used on the product page, cart page and cart drawer.
 *
 * Clamps to [min, max] and disables the +/- buttons at the bounds rather than
 * silently ignoring clicks, so stock limits are visible.
 */

const SIZES = {
  sm: { wrap: "h-9", button: "w-9", value: "w-9 text-sm", icon: "h-3.5 w-3.5" },
  md: { wrap: "h-11", button: "w-11", value: "w-12 text-base", icon: "h-4 w-4" },
  lg: { wrap: "h-12", button: "w-12", value: "w-14 text-lg", icon: "h-5 w-5" },
}

const QuantityStepper = ({
  value = 1,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  disabled = false,
  loading = false,
  label = "Quantity",
  className,
}) => {
  const s = SIZES[size] || SIZES.md
  const isDisabled = disabled || loading

  const clamp = (next) => Math.max(min, Math.min(max, next))

  const decrement = () => onChange?.(clamp(value - 1))
  const increment = () => onChange?.(clamp(value + 1))

  const buttonClass = cn(
    "flex shrink-0 items-center justify-center text-gray-600",
    "transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500",
    "disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent",
    s.wrap,
    s.button,
  )

  return (
    <div
      className={cn(
        "inline-flex items-center overflow-hidden rounded-lg border border-gray-300 bg-white",
        isDisabled && "opacity-60",
        s.wrap,
        className,
      )}
    >
      <button
        type="button"
        onClick={decrement}
        disabled={isDisabled || value <= min}
        aria-label={`Decrease ${label.toLowerCase()}`}
        className={buttonClass}
      >
        <Minus aria-hidden="true" className={s.icon} />
      </button>

      <div
        role="status"
        aria-live="polite"
        aria-label={`${label}: ${value}`}
        className={cn(
          "flex shrink-0 items-center justify-center border-x border-gray-200 font-semibold text-gray-900 tabular-nums",
          s.wrap,
          s.value,
        )}
      >
        {loading ? <Spinner size="xs" label={null} className="text-pink-600" /> : value}
      </div>

      <button
        type="button"
        onClick={increment}
        disabled={isDisabled || value >= max}
        aria-label={`Increase ${label.toLowerCase()}`}
        className={buttonClass}
      >
        <Plus aria-hidden="true" className={s.icon} />
      </button>
    </div>
  )
}

export default QuantityStepper
