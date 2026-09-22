import { Fragment } from "react"
import { Link } from "react-router-dom"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "../../lib/cn"

/**
 * Breadcrumb trail.
 *
 *   <Breadcrumbs items={[{ label: "Shop", to: "/products" }, { label: "Bangles" }]} />
 *
 * The last item is always rendered as the current page (aria-current), never
 * as a link. A Home crumb is prepended unless `showHome` is false.
 */
const Breadcrumbs = ({ items = [], showHome = true, homeTo = "/", className }) => {
  const crumbs = showHome ? [{ label: "Home", to: homeTo, icon: Home }, ...items] : items

  if (crumbs.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide text-sm">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          const Icon = crumb.icon

          return (
            <Fragment key={`${crumb.label}-${index}`}>
              {index > 0 && (
                <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-gray-300" />
              )}

              <li className="shrink-0">
                {isLast || !crumb.to ? (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={cn("font-medium", isLast ? "text-gray-900" : "text-gray-500")}
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    to={crumb.to}
                    className="flex items-center gap-1 text-gray-500 transition-colors hover:text-pink-600"
                  >
                    {Icon && <Icon aria-hidden="true" className="h-3.5 w-3.5" />}
                    <span>{crumb.label}</span>
                  </Link>
                )}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumbs
