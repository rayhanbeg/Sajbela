import { Link } from "react-router-dom"
import { cn } from "../../lib/cn"
import { Skeleton } from "../ui"

/**
 * Overview metric.
 *
 * The old dashboard cards were `bg-white rounded-lg shadow-md p-6` with an
 * icon in a tinted square and no loading treatment, so every figure rendered
 * as a confident `0` while the requests were still in flight — which reads as
 * "no orders today", not "still loading".
 */

const TONES = {
  brand: "bg-pink-50 text-pink-600",
  info: "bg-blue-50 text-blue-600",
  success: "bg-green-50 text-green-600",
  warning: "bg-yellow-50 text-yellow-700",
  danger: "bg-red-50 text-red-600",
  neutral: "bg-gray-100 text-gray-600",
}

const StatCard = ({ label, value, hint, icon: Icon, tone = "neutral", loading = false, to, className }) => {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        {Icon && (
          <span
            aria-hidden="true"
            className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", TONES[tone] || TONES.neutral)}
          >
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>

      {loading ? (
        <Skeleton className="mt-2.5 h-8 w-20" />
      ) : (
        <p className="mt-1.5 text-2xl font-bold tracking-tight text-gray-900 tabular-nums">{value}</p>
      )}

      {hint && !loading && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </>
  )

  const shell = cn(
    "rounded-card border border-gray-200 bg-white p-4 sm:p-5",
    to && "block transition-shadow duration-200 hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2",
    className,
  )

  if (to) {
    return (
      <Link to={to} className={shell}>
        {body}
      </Link>
    )
  }

  return <div className={shell}>{body}</div>
}

export default StatCard
