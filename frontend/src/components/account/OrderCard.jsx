import { ChevronRight } from "lucide-react"
import { Badge, Button, Image } from "../ui"
import { formatDate, formatPrice } from "../../lib/utils"
import { isCancellable, orderItemCount, orderNumber, paymentLabel, statusMeta } from "../../lib/orders"

/**
 * One row in the order history.
 *
 * The previous version rendered every line item — image, size, colour, unit
 * price — inline for every order, so a shopper with ten orders scrolled past a
 * hundred rows to find one. The card is now a summary; the full breakdown and
 * the per-item review buttons live in the detail dialog.
 */

const MAX_THUMBS = 4

const OrderCard = ({ order, onView, onCancel }) => {
  const meta = statusMeta(order.status)
  const items = order.orderItems || []
  const thumbs = items.slice(0, MAX_THUMBS)
  const hidden = items.length - thumbs.length
  const units = orderItemCount(order)

  const summary =
    items.length === 0
      ? "No items"
      : items.length === 1
        ? items[0].name
        : `${items[0].name} + ${items.length - 1} more`

  return (
    <li>
      <article className="rounded-card border border-gray-200 bg-white transition-shadow duration-300 ease-out-expo hover:shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight text-gray-900">{orderNumber(order._id)}</h3>
            <p className="mt-0.5 text-xs text-gray-500">{formatDate(order.createdAt)}</p>
          </div>

          <Badge tone={meta.tone} size="md" dot>
            {meta.label}
          </Badge>
        </div>

        <div className="flex items-center gap-4 px-4 py-4 sm:px-5">
          <div className="flex shrink-0 -space-x-2">
            {thumbs.map((item, index) => (
              <Image
                key={`${item.product || item.name}-${index}`}
                src={item.image}
                alt=""
                aspect="square"
                width={120}
                sizes="56px"
                className="h-12 w-12 shrink-0 ring-2 ring-white sm:h-14 sm:w-14"
                rounded="rounded-lg"
              />
            ))}

            {hidden > 0 && (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-semibold text-gray-600 ring-2 ring-white sm:h-14 sm:w-14">
                +{hidden}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{summary}</p>
            <p className="mt-0.5 text-xs text-gray-500">
              {units} {units === 1 ? "item" : "items"} · {paymentLabel(order.paymentMethod)}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-base font-bold text-gray-900">{formatPrice(order.totalPrice)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:px-5">
          <p className="hidden text-xs text-gray-500 sm:block">{meta.hint}</p>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            {isCancellable(order.status) && (
              <Button variant="danger-soft" size="sm" className="flex-1 sm:flex-none" onClick={() => onCancel(order)}>
                Cancel order
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              rightIcon={<ChevronRight className="h-4 w-4" />}
              onClick={() => onView(order)}
            >
              View details
            </Button>
          </div>
        </div>
      </article>
    </li>
  )
}

export default OrderCard
