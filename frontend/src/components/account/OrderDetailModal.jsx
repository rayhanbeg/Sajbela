import { useMemo } from "react"
import { Ban, MapPin, Phone, Star, Wallet } from "lucide-react"
import { Badge, Button, Image, Modal } from "../ui"
import OrderProgress from "./OrderProgress"
import { formatDate, formatPrice } from "../../lib/utils"
import {
  addressLines,
  isCancellable,
  orderItemVariant,
  orderNumber,
  paymentLabel,
  statusMeta,
} from "../../lib/orders"

/**
 * Full order breakdown.
 *
 * Replaces a hand-rolled `fixed inset-0 bg-black bg-opacity-50` overlay that
 * didn't trap focus, didn't close on Escape, didn't lock background scroll,
 * and whose close button was a Package icon.
 *
 * The address block reads district/thana — the fields the Address model
 * actually has. The old markup printed `city`, `state` and `postalCode`, which
 * are undefined on every order this app has ever taken, so shoppers saw a line
 * reading ", " under their street address.
 */

const productIdOf = (item) => (typeof item?.product === "object" ? item?.product?._id : item?.product)

const InfoBlock = ({ icon: Icon, title, children }) => (
  <div>
    <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {title}
    </h3>
    <div className="rounded-lg bg-gray-50 p-3.5 text-sm leading-relaxed text-gray-700">{children}</div>
  </div>
)

const SummaryRow = ({ label, value, strong = false }) => (
  <div className={strong ? "flex justify-between pt-3 text-base font-bold text-gray-900" : "flex justify-between"}>
    <span className={strong ? "" : "text-gray-600"}>{label}</span>
    <span className={strong ? "" : "font-medium text-gray-900"}>{value}</span>
  </div>
)

const OrderDetailModal = ({ order, open, onClose, reviewable = [], onReview, onCancel }) => {
  const reviewableIds = useMemo(() => {
    if (!order) return new Set()
    return new Set(reviewable.filter((entry) => entry.orderId === order._id).map((entry) => entry.product?._id))
  }, [reviewable, order])

  if (!order) return null

  const meta = statusMeta(order.status)
  const items = order.orderItems || []
  const address = order.shippingAddress
  const cancelled = order.status === "cancelled"
  const delivered = order.status === "delivered"

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={`Order ${orderNumber(order._id)}`}
      description={`Placed on ${formatDate(order.createdAt)}`}
      footer={
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          {isCancellable(order.status) && (
            <Button
              variant="danger-soft"
              onClick={() => {
                onClose()
                onCancel(order)
              }}
            >
              Cancel order
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className={cancelled ? "rounded-lg bg-red-50 p-4" : "rounded-lg bg-gray-50 p-4"}>
          <div className="mb-4 flex items-center gap-2.5">
            <Badge tone={meta.tone} size="md" dot>
              {meta.label}
            </Badge>
            <p className="text-sm text-gray-600">{meta.hint}</p>
          </div>

          {cancelled ? (
            <p className="flex items-start gap-2 text-sm text-red-700">
              <Ban aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              Nothing was charged. If you paid in advance, the refund is processed within 5 working days.
            </p>
          ) : (
            <OrderProgress status={order.status} />
          )}
        </div>

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Items ({items.length})
          </h3>

          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {items.map((item, index) => {
              const productId = productIdOf(item)
              const canReview = delivered && reviewableIds.has(productId)
              const variant = orderItemVariant(item)

              return (
                <li key={`${productId || item.name}-${index}`} className="flex items-start gap-3 p-3">
                  <Image
                    src={item.image}
                    alt=""
                    aspect="square"
                    width={160}
                    sizes="64px"
                    className="h-16 w-16 shrink-0"
                    rounded="rounded-lg"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-gray-900">{item.name}</p>
                    {variant && <p className="mt-0.5 text-xs text-gray-500">{variant}</p>}
                    <p className="mt-1 text-xs text-gray-600">
                      {item.quantity} × {formatPrice(item.price)}
                    </p>

                    {canReview && (
                      <Button
                        variant="ghost-brand"
                        size="xs"
                        className="mt-2 -ml-2"
                        leftIcon={<Star className="h-3.5 w-3.5" />}
                        onClick={() =>
                          onReview({
                            orderId: order._id,
                            product: {
                              _id: productId,
                              name: item.name,
                              images: item.image ? [{ url: item.image }] : [],
                            },
                          })
                        }
                      >
                        Write a review
                      </Button>
                    )}

                    {delivered && !canReview && (
                      <p className="mt-1.5 text-xs font-medium text-green-700">Reviewed</p>
                    )}
                  </div>

                  <p className="shrink-0 text-sm font-semibold text-gray-900">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </li>
              )
            })}
          </ul>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <InfoBlock icon={MapPin} title="Delivery address">
            <p className="font-medium text-gray-900">{address?.fullName}</p>
            {addressLines(address).map((line) => (
              <p key={line}>{line}</p>
            ))}
            {address?.phone && (
              <p className="mt-1.5 flex items-center gap-1.5 text-gray-600">
                <Phone aria-hidden="true" className="h-3.5 w-3.5" />
                {address.phone}
              </p>
            )}
          </InfoBlock>

          <InfoBlock icon={Wallet} title="Payment">
            <p className="font-medium text-gray-900">{paymentLabel(order.paymentMethod)}</p>
            <p className="mt-1 text-gray-600">
              {order.isPaid ? "Paid" : order.paymentMethod === "cash_on_delivery" ? "Pay when it arrives" : "Awaiting payment"}
            </p>
          </InfoBlock>
        </div>

        <section className="space-y-2 border-t border-gray-200 pt-4 text-sm">
          <SummaryRow label="Subtotal" value={formatPrice(order.itemsPrice)} />
          <SummaryRow
            label="Delivery"
            value={Number(order.shippingPrice) === 0 ? "Free" : formatPrice(order.shippingPrice)}
          />
          {Number(order.taxPrice) > 0 && <SummaryRow label="Tax" value={formatPrice(order.taxPrice)} />}
          <div className="border-t border-gray-200">
            <SummaryRow label="Total" value={formatPrice(order.totalPrice)} strong />
          </div>
        </section>
      </div>
    </Modal>
  )
}

export default OrderDetailModal
