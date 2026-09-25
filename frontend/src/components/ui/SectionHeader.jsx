import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { cn } from "../../lib/cn"

/**
 * Section heading used across the home page and shop sections, so every
 * "Shop by category" / "New arrivals" / "Best sellers" block shares the same
 * rhythm instead of each one inventing its own margins.
 *
 * There used to be an `eyebrow` prop rendering a small uppercase line above
 * the title, and every section used it — "Just in" over "New arrivals",
 * "Browse" over "Shop by category". Two headings that say the same thing is
 * noise, so the prop is gone rather than merely unused, which keeps it from
 * creeping back one section at a time.
 */
const SectionHeader = ({
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
        "mb-5 gap-4 md:mb-7",
        centered ? "text-center" : "flex flex-wrap items-end justify-between text-left",
        className,
      )}
    >
      <div className={cn("min-w-0", centered && "mx-auto max-w-2xl")}>
        <Heading className="text-display-sm font-bold text-gray-900">{title}</Heading>

        {description && <p className="mt-1.5 text-sm text-gray-600">{description}</p>}
      </div>

      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className={cn(
            "group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-pink-600",
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
