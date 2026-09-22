import { cn } from "../../lib/cn"

/**
 * Empty state — "no products match these filters", "your cart is empty",
 * "no orders yet". Always offers a way forward rather than a dead end.
 */
const EmptyState = ({ icon, title, description, action, secondaryAction, size = "md", className }) => {
  const sizes = {
    sm: { wrap: "py-8", icon: "h-12 w-12", title: "text-base", text: "text-sm" },
    md: { wrap: "py-14", icon: "h-16 w-16", title: "text-lg", text: "text-sm" },
    lg: { wrap: "py-20", icon: "h-20 w-20", title: "text-xl", text: "text-base" },
  }
  const s = sizes[size] || sizes.md

  return (
    <div className={cn("flex flex-col items-center justify-center px-4 text-center", s.wrap, className)}>
      {icon && (
        <div
          aria-hidden="true"
          className={cn(
            "mb-4 flex items-center justify-center rounded-full bg-pink-50 text-pink-600",
            s.icon,
            "[&_svg]:h-1/2 [&_svg]:w-1/2",
          )}
        >
          {icon}
        </div>
      )}

      <h3 className={cn("font-semibold text-gray-900", s.title)}>{title}</h3>

      {description && (
        <p className={cn("mx-auto mt-2 max-w-sm leading-relaxed text-gray-600", s.text)}>{description}</p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-col-reverse items-center gap-2.5 sm:flex-row">
          {secondaryAction}
          {action}
        </div>
      )}
    </div>
  )
}

export default EmptyState
