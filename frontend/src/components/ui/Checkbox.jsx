import { forwardRef, useId } from "react"
import { cn } from "../../lib/cn"

/**
 * Checkbox with label, sized for a comfortable touch target on mobile.
 */
const Checkbox = forwardRef(function Checkbox({ label, hint, id, className, labelClassName, ...props }, ref) {
  const generatedId = useId()
  const inputId = id || generatedId

  const control = (
    <input
      ref={ref}
      id={inputId}
      type="checkbox"
      className={cn(
        "h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-pink-600",
        "transition-colors duration-150",
        "focus:ring-2 focus:ring-pink-500 focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )

  if (!label) return control

  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-5 items-center">{control}</div>
      <div className="min-w-0">
        <label
          htmlFor={inputId}
          className={cn("cursor-pointer select-none text-sm text-gray-700", labelClassName)}
        >
          {label}
        </label>
        {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
      </div>
    </div>
  )
})

export default Checkbox
