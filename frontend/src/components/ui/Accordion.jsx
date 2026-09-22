import { useId, useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/cn"

/**
 * Accordion built on native <button> + aria-expanded.
 *
 * Used for FAQ, product detail panels on mobile, and the shop filter groups.
 * `allowMultiple` lets several panels stay open (filters); leave it off for
 * a classic one-at-a-time FAQ.
 */

export const AccordionItem = ({ title, subtitle, children, open, onToggle, icon, badge, className }) => {
  const id = useId()

  return (
    <div className={cn("border-b border-gray-200 last:border-b-0", className)}>
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          id={`${id}-trigger`}
          className={cn(
            "flex w-full items-center gap-3 py-4 text-left",
            "transition-colors duration-200 hover:text-pink-600",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2",
          )}
        >
          {icon && (
            <span aria-hidden="true" className="shrink-0 text-pink-600 [&_svg]:h-5 [&_svg]:w-5">
              {icon}
            </span>
          )}

          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-gray-900 sm:text-base">{title}</span>
            {subtitle && <span className="mt-0.5 block text-xs text-gray-500">{subtitle}</span>}
          </span>

          {badge}

          <ChevronDown
            aria-hidden="true"
            className={cn(
              "h-5 w-5 shrink-0 text-gray-400 transition-transform duration-300 ease-out-expo",
              open && "rotate-180",
            )}
          />
        </button>
      </h3>

      {/* grid-rows trick animates height without measuring the content. */}
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-trigger`}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out-expo",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="pb-4 text-sm leading-relaxed text-gray-600">{children}</div>
        </div>
      </div>
    </div>
  )
}

const Accordion = ({ items = [], allowMultiple = false, defaultOpen = [], className }) => {
  const [openIds, setOpenIds] = useState(() => new Set(defaultOpen))

  const toggle = (id) => {
    setOpenIds((prev) => {
      const next = new Set(allowMultiple ? prev : [])
      if (prev.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className={className}>
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          title={item.title}
          subtitle={item.subtitle}
          icon={item.icon}
          badge={item.badge}
          open={openIds.has(item.id)}
          onToggle={() => toggle(item.id)}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  )
}

export default Accordion
