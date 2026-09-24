import { cn } from "../../lib/cn"

/**
 * Page title + primary action, and the section container the admin pages
 * build out of. Both exist so the five pages stop each inventing their own
 * heading size and card padding — the old set ran from `text-2xl` to
 * `text-3xl` with `p-4`, `p-6` and `px-6 py-3` containers side by side.
 */

export const AdminPageHeader = ({ title, description, actions, className }) => (
  <div className={cn("mb-5 flex flex-wrap items-start justify-between gap-3 sm:mb-6 sm:gap-4", className)}>
    <div className="min-w-0">
      <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">{title}</h1>
      {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
)

export const Panel = ({ title, description, actions, footer, bodyClassName, className, children }) => (
  <section className={cn("overflow-hidden rounded-card border border-gray-200 bg-white", className)}>
    {(title || actions) && (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          {title && <h2 className="text-sm font-semibold text-gray-900">{title}</h2>}
          {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    )}

    <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>

    {footer && <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 sm:px-5">{footer}</div>}
  </section>
)

/**
 * Form section: a titled band with its fields indented under it. Used by the
 * product form, which previously stacked four unlabelled white boxes with no
 * indication of which fields belonged together.
 */
export const FormSection = ({ title, description, icon: Icon, children, className }) => (
  <section className={cn("rounded-card border border-gray-200 bg-white p-4 sm:p-6", className)}>
    <div className="mb-4 flex items-start gap-3 sm:mb-5">
      {Icon && (
        <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-pink-50 text-pink-600">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-gray-600">{description}</p>}
      </div>
    </div>

    {children}
  </section>
)
