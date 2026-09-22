import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "../../lib/cn"

/**
 * Pagination control.
 *
 * Builds a windowed page list with ellipses so a 40-page catalogue doesn't
 * render 40 buttons — first, last, and a window around the current page.
 * On mobile the numbered buttons collapse to a "Page X of Y" label, which
 * keeps the control inside a 375px viewport.
 */

function buildPages(current, total, siblings = 1) {
  const totalSlots = siblings * 2 + 5 // first + last + current + 2 siblings + 2 ellipses

  if (total <= totalSlots) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const left = Math.max(current - siblings, 1)
  const right = Math.min(current + siblings, total)

  const showLeftEllipsis = left > 2
  const showRightEllipsis = right < total - 1

  const pages = [1]

  if (showLeftEllipsis) pages.push("left-ellipsis")

  for (let page = Math.max(2, left); page <= Math.min(total - 1, right); page++) {
    pages.push(page)
  }

  if (showRightEllipsis) pages.push("right-ellipsis")

  pages.push(total)

  return pages
}

const Pagination = ({ currentPage = 1, totalPages = 1, onPageChange, siblings = 1, className }) => {
  if (!totalPages || totalPages <= 1) return null

  const pages = buildPages(currentPage, totalPages, siblings)

  const go = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    onPageChange?.(page)
  }

  const arrowClass = cn(
    "inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-gray-300 bg-white px-3",
    "text-sm font-medium text-gray-700 transition-colors duration-200",
    "hover:border-gray-400 hover:bg-gray-50",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-gray-300",
  )

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-2", className)}>
      <button type="button" onClick={() => go(currentPage - 1)} disabled={currentPage === 1} className={arrowClass}>
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
        <span className="sr-only sm:hidden">Previous page</span>
      </button>

      {/* Mobile: compact label. */}
      <span className="px-2 text-sm font-medium text-gray-700 tabular-nums sm:hidden">
        Page {currentPage} of {totalPages}
      </span>

      {/* sm+: numbered buttons. */}
      <ul className="hidden items-center gap-1 sm:flex">
        {pages.map((page, index) => {
          if (typeof page === "string") {
            return (
              <li key={`${page}-${index}`} aria-hidden="true" className="px-1.5 text-sm text-gray-400">
                &hellip;
              </li>
            )
          }

          const isCurrent = page === currentPage

          return (
            <li key={page}>
              <button
                type="button"
                onClick={() => go(page)}
                aria-current={isCurrent ? "page" : undefined}
                aria-label={`Go to page ${page}`}
                className={cn(
                  "inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-lg px-2.5",
                  "text-sm font-medium tabular-nums transition-colors duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2",
                  isCurrent
                    ? "bg-pink-600 text-white shadow-sm"
                    : "border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50",
                )}
              >
                {page}
              </button>
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        onClick={() => go(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={arrowClass}
      >
        <span className="hidden sm:inline">Next</span>
        <span className="sr-only sm:hidden">Next page</span>
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </button>
    </nav>
  )
}

export default Pagination
