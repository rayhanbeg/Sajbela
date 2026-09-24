import { cn } from "../../lib/cn"

/**
 * Bar chart for the dashboard's revenue trend.
 *
 * Hand-rolled SVG rather than a charting dependency: it's one series of at
 * most fourteen bars, and the brief keeps the existing stack. The whole thing
 * is `role="img"` with a summary label, plus a screen-reader table — a chart
 * that only exists visually tells an admin using a screen reader nothing.
 *
 * `data`: [{ label, value, title }]
 */

const MiniBarChart = ({ data, ariaLabel, formatValue = (value) => String(value), className, emptyMessage }) => {
  const max = Math.max(...data.map((point) => point.value), 0)

  if (data.length === 0 || max <= 0) {
    return (
      <p className={cn("py-10 text-center text-sm text-gray-500", className)}>
        {emptyMessage || "No data for this period yet."}
      </p>
    )
  }

  return (
    <div className={className}>
      <div role="img" aria-label={ariaLabel} className="flex h-40 items-end gap-1 sm:gap-1.5">
        {data.map((point) => {
          // Floor at 2% so a day with a single small order is still a visible
          // mark rather than an invisible sliver.
          const height = point.value > 0 ? Math.max((point.value / max) * 100, 2) : 0

          return (
            <div key={point.label} className="group flex h-full min-w-0 flex-1 flex-col justify-end">
              <div className="relative flex h-full items-end">
                <div
                  style={{ height: `${height}%` }}
                  className={cn(
                    "w-full rounded-t transition-colors duration-200",
                    point.value > 0 ? "bg-pink-200 group-hover:bg-pink-400" : "bg-gray-100",
                  )}
                />
                {point.value > 0 && (
                  <span
                    className={cn(
                      "pointer-events-none absolute -top-1 left-1/2 hidden -translate-x-1/2 -translate-y-full",
                      "whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white",
                      "group-hover:block",
                    )}
                  >
                    {point.title || formatValue(point.value)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div aria-hidden="true" className="mt-2 flex gap-1 sm:gap-1.5">
        {data.map((point, index) => (
          <span
            key={point.label}
            className={cn(
              "min-w-0 flex-1 truncate text-center text-[0.625rem] text-gray-400",
              // Every label at 14 bars is unreadable on a phone; show every
              // other one below sm.
              index % 2 === 1 && "hidden sm:block",
            )}
          >
            {point.label}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.label}>
              <th scope="row">{point.label}</th>
              <td>{formatValue(point.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default MiniBarChart
