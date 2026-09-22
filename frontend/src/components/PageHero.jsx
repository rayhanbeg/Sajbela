import { cn } from "../lib/cn"
import { Breadcrumbs } from "./ui"

/**
 * Shared header band for informational pages (About, Contact, FAQ, Shipping,
 * Returns, Privacy, Terms), so they stop each inventing their own title
 * treatment.
 */
const PageHero = ({ title, description, breadcrumbs, icon, className, children }) => {
  return (
    <section className={cn("border-b border-gray-100 bg-gradient-to-b from-pink-50 to-white", className)}>
      <div className="page-container py-8 md:py-12">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-4" />}

        <div className="flex items-start gap-4">
          {icon && (
            <span
              aria-hidden="true"
              className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-card bg-pink-600 text-white sm:flex [&_svg]:h-6 [&_svg]:w-6"
            >
              {icon}
            </span>
          )}

          <div className="min-w-0">
            <h1 className="text-display-sm font-bold text-gray-900">{title}</h1>
            {description && <p className="mt-2 max-w-2xl text-sm text-gray-600 md:text-base">{description}</p>}
          </div>
        </div>

        {children}
      </div>
    </section>
  )
}

export default PageHero
