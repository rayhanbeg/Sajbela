import { cn } from "../../lib/cn"

/**
 * Indeterminate loading spinner.
 * `label` is announced to screen readers; pass null inside a button that
 * already has its own accessible text.
 */
const Spinner = ({ size = "md", className, label = "Loading" }) => {
  const sizes = {
    xs: "h-3 w-3 border",
    sm: "h-4 w-4 border-2",
    md: "h-5 w-5 border-2",
    lg: "h-8 w-8 border-2",
    xl: "h-12 w-12 border-[3px]",
  }

  return (
    <span
      role={label ? "status" : undefined}
      aria-live={label ? "polite" : undefined}
      className={cn("inline-block", className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "block animate-spin rounded-full border-current border-r-transparent align-[-0.125em]",
          sizes[size] || sizes.md,
        )}
      />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  )
}

export default Spinner
