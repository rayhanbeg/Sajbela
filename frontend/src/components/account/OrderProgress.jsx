import { CheckCircle2, Clock, Package, Truck } from "lucide-react"
import { cn } from "../../lib/cn"
import { ORDER_PROGRESS, progressIndex } from "../../lib/orders"

/**
 * Four-step delivery tracker.
 *
 * The old account page showed the status as a single coloured pill, which told
 * a shopper what stage they were at but not what came next. Cancelled orders
 * render nothing here — they left the track, and drawing a greyed-out path to
 * "Delivered" would be misleading.
 */

const STEPS = {
  pending: { icon: Clock, label: "Placed" },
  processing: { icon: Package, label: "Packed" },
  shipped: { icon: Truck, label: "Shipped" },
  delivered: { icon: CheckCircle2, label: "Delivered" },
}

const OrderProgress = ({ status, className }) => {
  const current = progressIndex(status)

  if (current === -1) return null

  return (
    <ol aria-label="Delivery progress" className={cn("grid grid-cols-4", className)}>
      {ORDER_PROGRESS.map((step, index) => {
        const { icon: Icon, label } = STEPS[step]
        const reached = index <= current
        const isLast = index === ORDER_PROGRESS.length - 1

        return (
          <li
            key={step}
            aria-current={index === current ? "step" : undefined}
            className="relative flex flex-col items-center"
          >
            {/* Centre-to-centre connector; equal grid columns make the maths exact. */}
            {!isLast && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-4 -mt-px h-0.5 left-[calc(50%_+_20px)] right-[calc(-50%_+_20px)]",
                  index < current ? "bg-pink-600" : "bg-gray-200",
                )}
              />
            )}

            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2",
                "transition-colors duration-300",
                reached ? "border-pink-600 bg-pink-600 text-white" : "border-gray-200 bg-white text-gray-400",
              )}
            >
              <Icon className="h-4 w-4" />
            </span>

            <span
              className={cn(
                "mt-2 px-1 text-center text-[0.6875rem] font-medium leading-tight sm:text-xs",
                reached ? "text-gray-900" : "text-gray-500",
              )}
            >
              {label}
            </span>

            <span className="sr-only">{reached ? "— done" : "— not yet"}</span>
          </li>
        )
      })}
    </ol>
  )
}

export default OrderProgress
