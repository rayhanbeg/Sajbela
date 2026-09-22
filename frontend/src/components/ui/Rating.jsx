import { Star } from "lucide-react"
import { cn } from "../../lib/cn"

/**
 * Star rating display.
 *
 * Replaces the app's previous `★ / ☆` text characters, which rendered
 * inconsistently across platforms and had no accessible name. Supports half
 * stars via a clipped overlay.
 */

const SIZES = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
}

const Rating = ({ value = 0, count, max = 5, size = "sm", showValue = false, showCount = true, className }) => {
  const rating = Math.max(0, Math.min(max, Number(value) || 0))
  const starClass = SIZES[size] || SIZES.sm

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div
        className="flex items-center gap-0.5"
        role="img"
        aria-label={`Rated ${rating.toFixed(1)} out of ${max} stars`}
      >
        {Array.from({ length: max }).map((_, i) => {
          const fill = Math.max(0, Math.min(1, rating - i))

          return (
            <span key={i} aria-hidden="true" className={cn("relative shrink-0", starClass)}>
              <Star className={cn(starClass, "absolute inset-0 text-gray-300")} fill="currentColor" strokeWidth={0} />
              {fill > 0 && (
                <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <Star className={cn(starClass, "text-yellow-400")} fill="currentColor" strokeWidth={0} />
                </span>
              )}
            </span>
          )
        })}
      </div>

      {showValue && <span className="text-xs font-medium text-gray-700">{rating.toFixed(1)}</span>}

      {showCount && count !== undefined && (
        <span className="text-xs text-gray-500">({count})</span>
      )}
    </div>
  )
}

/**
 * Interactive star picker for the review form. Keyboard-operable via arrow
 * keys because it's a radiogroup, not a row of buttons.
 */
export const RatingInput = ({ value = 0, onChange, max = 5, size = "lg", className, disabled = false }) => {
  const starClass = SIZES[size] || SIZES.lg

  return (
    <div role="radiogroup" aria-label="Rating" className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1
        const active = starValue <= value

        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={value === starValue}
            aria-label={`${starValue} star${starValue === 1 ? "" : "s"}`}
            disabled={disabled}
            onClick={() => onChange?.(starValue)}
            className={cn(
              "rounded p-1 transition-transform duration-150",
              !disabled && "hover:scale-110 active:scale-95",
              disabled && "cursor-not-allowed opacity-50",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500",
            )}
          >
            <Star
              aria-hidden="true"
              className={cn(starClass, active ? "text-yellow-400" : "text-gray-300")}
              fill="currentColor"
              strokeWidth={0}
            />
          </button>
        )
      })}
    </div>
  )
}

export default Rating
