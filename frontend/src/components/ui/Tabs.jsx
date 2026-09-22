import { useId, useRef, useState } from "react"
import { cn } from "../../lib/cn"

/**
 * Tab list following the WAI-ARIA tabs pattern: roving tabindex, arrow-key
 * navigation, Home/End support.
 *
 * Used for the product detail panels and the account page sections.
 *
 *   <Tabs tabs={[{ id: "desc", label: "Description", content: <p/> }]} />
 */
const Tabs = ({ tabs = [], defaultTab, variant = "underline", className, panelClassName, onChange }) => {
  const baseId = useId()
  const [active, setActive] = useState(defaultTab || tabs[0]?.id)
  const tabRefs = useRef({})

  const select = (id) => {
    setActive(id)
    onChange?.(id)
  }

  const handleKeyDown = (event) => {
    const ids = tabs.map((t) => t.id)
    const currentIndex = ids.indexOf(active)
    let nextIndex = null

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % ids.length
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + ids.length) % ids.length
    else if (event.key === "Home") nextIndex = 0
    else if (event.key === "End") nextIndex = ids.length - 1
    else return

    event.preventDefault()
    const nextId = ids[nextIndex]
    select(nextId)
    tabRefs.current[nextId]?.focus()
  }

  const isPills = variant === "pills"

  return (
    <div className={className}>
      <div
        role="tablist"
        onKeyDown={handleKeyDown}
        className={cn(
          "flex gap-1 overflow-x-auto scrollbar-hide",
          isPills ? "rounded-lg bg-gray-100 p-1" : "border-b border-gray-200",
        )}
      >
        {tabs.map((tab) => {
          const selected = tab.id === active

          return (
            <button
              key={tab.id}
              ref={(el) => (tabRefs.current[tab.id] = el)}
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(tab.id)}
              className={cn(
                "relative shrink-0 whitespace-nowrap px-4 text-sm font-medium",
                "transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500",
                isPills
                  ? cn(
                      "rounded-md py-2",
                      selected ? "bg-white text-pink-600 shadow-sm" : "text-gray-600 hover:text-gray-900",
                    )
                  : cn(
                      "-mb-px border-b-2 py-3",
                      selected
                        ? "border-pink-600 text-pink-600"
                        : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900",
                    ),
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums",
                    selected ? "bg-pink-100 text-pink-700" : "bg-gray-100 text-gray-600",
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={tab.id !== active}
          tabIndex={0}
          className={cn("focus:outline-none", tab.id === active && "animate-fade-in", panelClassName)}
        >
          {tab.id === active && tab.content}
        </div>
      ))}
    </div>
  )
}

export default Tabs
