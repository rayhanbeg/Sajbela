import { AlertCircle, RefreshCw } from "lucide-react"
import { cn } from "../../lib/cn"
import Button from "./Button"

/**
 * Error state with a retry affordance.
 *
 * Distinct from EmptyState on purpose: "nothing here" and "something broke"
 * need different colours and different actions, and conflating them is how
 * users end up thinking a failed request means an empty catalogue.
 */
const ErrorState = ({
  title = "Something went wrong",
  description = "We couldn't load this right now. Please try again.",
  onRetry,
  retryLabel = "Try again",
  action,
  size = "md",
  className,
}) => {
  const sizes = {
    sm: { wrap: "py-8", icon: "h-12 w-12", title: "text-base", text: "text-sm" },
    md: { wrap: "py-14", icon: "h-16 w-16", title: "text-lg", text: "text-sm" },
    lg: { wrap: "py-20", icon: "h-20 w-20", title: "text-xl", text: "text-base" },
  }
  const s = sizes[size] || sizes.md

  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center justify-center px-4 text-center", s.wrap, className)}
    >
      <div
        aria-hidden="true"
        className={cn(
          "mb-4 flex items-center justify-center rounded-full bg-red-50 text-red-600",
          s.icon,
          "[&_svg]:h-1/2 [&_svg]:w-1/2",
        )}
      >
        <AlertCircle />
      </div>

      <h3 className={cn("font-semibold text-gray-900", s.title)}>{title}</h3>
      <p className={cn("mx-auto mt-2 max-w-sm leading-relaxed text-gray-600", s.text)}>{description}</p>

      {(onRetry || action) && (
        <div className="mt-6 flex flex-col-reverse items-center gap-2.5 sm:flex-row">
          {action}
          {onRetry && (
            <Button variant="secondary" onClick={onRetry} leftIcon={<RefreshCw className="h-4 w-4" />}>
              {retryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default ErrorState
