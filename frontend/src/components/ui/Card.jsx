import { forwardRef } from "react"
import { Link } from "react-router-dom"
import { cn } from "../../lib/cn"

/**
 * Surface container. Renders as a router Link when `to` is passed so whole
 * cards can be clickable without nesting interactive elements badly.
 */

const VARIANTS = {
  // Default surface — subtle border, soft shadow.
  elevated: "bg-white border border-gray-100 shadow-card",
  // Flat, for dense lists where many shadows would be noisy.
  flat: "bg-white border border-gray-200",
  // No chrome; useful when the card sits on a coloured section.
  plain: "bg-white",
  // Tinted, for highlighted/promo blocks.
  brand: "bg-pink-50 border border-pink-100",
  muted: "bg-gray-50 border border-gray-100",
}

const PADDING = {
  none: "",
  sm: "p-3",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6",
  xl: "p-6 sm:p-8",
}

const Card = forwardRef(function Card(
  { as, to, variant = "elevated", padding = "none", interactive = false, className, children, ...props },
  ref,
) {
  const classes = cn(
    "rounded-card overflow-hidden",
    VARIANTS[variant] || VARIANTS.elevated,
    PADDING[padding] ?? "",
    interactive && [
      "transition-[box-shadow,transform,border-color] duration-300 ease-out-expo",
      "hover:-translate-y-0.5 hover:shadow-card-hover",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2",
    ],
    className,
  )

  if (to) {
    return (
      <Link ref={ref} to={to} className={cn("block", classes)} {...props}>
        {children}
      </Link>
    )
  }

  const Component = as || "div"

  return (
    <Component ref={ref} className={classes} {...props}>
      {children}
    </Component>
  )
})

/** Card header with optional title, description and trailing action. */
export const CardHeader = ({ title, description, action, className, children }) => (
  <div className={cn("flex items-start justify-between gap-4 border-b border-gray-100 px-4 py-4 sm:px-5", className)}>
    {children || (
      <div className="min-w-0">
        {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
        {description && <p className="mt-0.5 text-sm text-gray-600">{description}</p>}
      </div>
    )}
    {action && <div className="shrink-0">{action}</div>}
  </div>
)

export const CardBody = ({ className, children }) => (
  <div className={cn("px-4 py-4 sm:px-5", className)}>{children}</div>
)

export const CardFooter = ({ className, children }) => (
  <div className={cn("border-t border-gray-100 bg-gray-50 px-4 py-3.5 sm:px-5", className)}>{children}</div>
)

export default Card
