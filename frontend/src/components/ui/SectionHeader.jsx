import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { cn } from "../../lib/cn"

/**
 * Section heading used across the home page and shop sections, so every
 * "Shop by Category" / "New Arrivals" / "Best Sellers" block shares the same
 * rhythm instead of each one inventing its own margins.
 */
const SectionHeader = ({
  eyebrow,
  title,
  description,
  align = "center",
  actionLabel,
  actionTo,
  as: Heading = "h2",
  className,
}) => {
  const centered = align === "center"

  return (
    <div
      className={cn(
        "mb-6 gap-4 md:mb-8",
        centered ? "text-center" : "flex flex-wrap items-end justify-between text-left",
        className,
      )}
    >
      <div className={cn("min-w-0", centered && "mx-auto max-w-2xl")}>
        {eyebrow && (
          <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-[0.12em] text-pink-600">
            {eyebrow}
          </span>
        )}

        <Heading className="text-display-sm font-bold text-gray-900">{title}</Heading>

        {description && <p className="mt-2 text-sm text-gray-600 md:text-base">{description}</p>}
      </div>

      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className={cn(
            "group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-pink-600",
            "transition-colors hover:text-pink-700",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 rounded",
            centered && "mt-4",
          )}
        >
          {actionLabel}
          <ArrowRight
            aria-hidden="true"
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  )
}

export default SectionHeader
