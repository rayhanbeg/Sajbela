import { forwardRef, useId } from "react"
import { cn } from "../../lib/cn"

/**
 * Radio input with label.
 *
 * For the larger "pick one card" pattern (payment method, filter groups) use
 * RadioCard instead — it wraps the whole card in the label so the entire
 * surface is clickable and keyboard-reachable.
 */
const Radio = forwardRef(function Radio({ label, hint, id, className, labelClassName, ...props }, ref) {
  const generatedId = useId()
  const inputId = id || generatedId

  const control = (
    <input
      ref={ref}
      id={inputId}
      type="radio"
      className={cn(
        "h-4 w-4 shrink-0 cursor-pointer border-gray-300 text-pink-600",
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
        <label htmlFor={inputId} className={cn("cursor-pointer select-none text-sm text-gray-700", labelClassName)}>
          {label}
        </label>
        {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
      </div>
    </div>
  )
})

/**
 * Selectable card driven by a radio input. The whole card is the label, so
 * clicking anywhere selects it and the native input keeps keyboard + screen
 * reader behaviour intact.
 */
export const RadioCard = forwardRef(function RadioCard(
  { label, description, checked, disabled = false, badge, icon, id, className, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id || generatedId

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "relative flex cursor-pointer items-start gap-3 rounded-lg border p-4",
        "transition-[border-color,background-color,box-shadow] duration-200 ease-in-out-smooth",
        checked ? "border-pink-600 bg-pink-50 ring-1 ring-pink-200" : "border-gray-200 bg-white hover:border-pink-300",
        disabled && "cursor-not-allowed opacity-50 hover:border-gray-200",
        "focus-within:ring-2 focus-within:ring-pink-500 focus-within:ring-offset-2",
        className,
      )}
    >
      <input
        ref={ref}
        id={inputId}
        type="radio"
        checked={checked}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer border-gray-300 text-pink-600 focus:ring-0 focus:ring-offset-0"
        {...props}
      />

      {icon && (
        <span aria-hidden="true" className="mt-px shrink-0 text-pink-600">
          {icon}
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="block text-sm font-semibold text-gray-900">{label}</span>
          {badge}
        </span>
        {description && <span className="mt-0.5 block text-xs text-gray-600">{description}</span>}
      </span>
    </label>
  )
})

export default Radio
