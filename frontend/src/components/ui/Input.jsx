import { forwardRef } from "react"
import { cn } from "../../lib/cn"

/** Shared control chrome so Input / Textarea / Select look identical. */
export const controlBase =
  "w-full rounded-lg border bg-white text-gray-900 placeholder:text-gray-400 " +
  "transition-[border-color,box-shadow] duration-200 ease-in-out-smooth " +
  "focus:outline-none focus:ring-2 focus:ring-offset-0 " +
  "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"

export const controlState = (invalid) =>
  invalid
    ? "border-red-400 focus:border-red-500 focus:ring-red-200"
    : "border-gray-300 hover:border-gray-400 focus:border-pink-500 focus:ring-pink-200"

export const controlSizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-3.5 text-sm",
  lg: "h-12 px-4 text-base",
}

/**
 * Text input with optional leading/trailing adornments.
 *
 * On mobile, `size="lg"` (16px text) avoids iOS Safari's auto-zoom on focus —
 * use it for checkout and auth forms.
 */
const Input = forwardRef(function Input(
  { size = "md", invalid = false, leftIcon, rightIcon, rightElement, className, containerClassName, ...props },
  ref,
) {
  const hasLeft = Boolean(leftIcon)
  const hasRight = Boolean(rightIcon || rightElement)

  const input = (
    <input
      ref={ref}
      className={cn(
        controlBase,
        controlState(invalid),
        controlSizes[size] || controlSizes.md,
        hasLeft && "pl-10",
        hasRight && "pr-10",
        className,
      )}
      {...props}
    />
  )

  if (!hasLeft && !hasRight) return input

  return (
    <div className={cn("relative", containerClassName)}>
      {hasLeft && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 [&_svg]:h-4 [&_svg]:w-4"
        >
          {leftIcon}
        </span>
      )}

      {input}

      {rightElement ? (
        <span className="absolute right-1 top-1/2 -translate-y-1/2">{rightElement}</span>
      ) : (
        rightIcon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 [&_svg]:h-4 [&_svg]:w-4"
          >
            {rightIcon}
          </span>
        )
      )}
    </div>
  )
})

export default Input
