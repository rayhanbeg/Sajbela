import { useState } from "react"
import { CalendarDays, Mail, MapPin, Phone, Truck, User } from "lucide-react"
import { Badge, Button, FormField, Image, Modal, Select } from "../ui"
import {
  ORDER_STATUSES,
  addressLines,
  orderCustomer,
  orderItemCount,
  orderItemVariant,
  orderNumber,
  paymentLabel,
  statusMeta,
} from "../../lib/orders"
import { formatDate, formatPrice } from "../../lib/utils"

/**
 * Admin order detail.
 *
 * The old page had no detail view — every field lived in the table row, which
 * is why it needed eight columns and a horizontal scrollbar. Status changes
 * were an always-visible `<select>` per row that fired on `change`, so one
 * stray scroll-wheel tick over a closed dropdown marked an order delivered
 * with no confirmation and no undo.
 *
 * Here the status is a deliberate two-step: pick, then save. The button stays
 * disabled until the value actually differs from what's stored.
 */

const InfoRow = ({ icon: Icon, children }) => (
  <p className="flex items-start gap-2 text-sm text-gray-700">
    <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
    <span className="min-w-0">{children}</span>
  </p>
)

const OrderDetail = ({ order, onClose, onStatusChange }) => {
  const [status, setStatus] = useState(order.status)
  const [saving, setSaving] = useState(false)

  const meta = statusMeta(order.status)
  const customer = orderCustomer(order)
  const changed = status !== order.status

  const handleSave = async () => {
    setSaving(true)
    try {
      await onStatusChange?.(order._id, status)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={saving ? undefined : onClose}
      closeOnBackdrop={!saving}
      size="2xl"
      title={`Order ${orderNumber(order._id)}`}
      description={`Placed ${formatDate(order.createdAt)}`}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <FormField label="Order status" htmlFor="order-status" className="sm:w-56">
            {(field) => (
              <Select {...field} value={status} disabled={saving} onChange={(event) => setStatus(event.target.value)}>
                {ORDER_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {statusMeta(value).label}
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          <div className="flex gap-2.5">
            <Button variant="outline" disabled={saving} onClick={onClose}>
              Close
            </Button>
            <Button disabled={!changed} loading={saving} loadingText="Saving…" onClick={handleSave}>
              Update status
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={meta.tone} size="md" dot>
            {meta.label}
          </Badge>
          <Badge tone="neutral" size="md">
            {paymentLabel(order.paymentMethod)}
          </Badge>
          {order.isPaid && (
            <Badge tone="success" size="md">
              Paid
            </Badge>
          )}
          {order.isDelivered && order.deliveredAt && (
            <Badge tone="success" size="md">
              Delivered {formatDate(order.deliveredAt)}
            </Badge>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-card border border-gray-200 p-4">
            <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Customer</h3>
            <div className="space-y-1.5">
              <InfoRow icon={User}>
                <span className="font-medium text-gray-900">{customer.name}</span>
                {customer.guest && <span className="ml-1.5 text-xs text-gray-500">(guest)</span>}
              </InfoRow>
              {customer.email && (
                <InfoRow icon={Mail}>
                  <a href={`mailto:${customer.email}`} className="break-all hover:text-pink-600 hover:underline">
                    {customer.email}
                  </a>
                </InfoRow>
              )}
              {customer.phone && (
                <InfoRow icon={Phone}>
                  <a href={`tel:${customer.phone}`} className="hover:text-pink-600 hover:underline">
                    {customer.phone}
                  </a>
                </InfoRow>
              )}
              <InfoRow icon={CalendarDays}>{formatDate(order.createdAt)}</InfoRow>
            </div>
          </div>

          <div className="rounded-card border border-gray-200 p-4">
            <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Deliver to</h3>
            <div className="space-y-1.5">
              <InfoRow icon={MapPin}>
                <span className="font-medium text-gray-900">{order.shippingAddress?.fullName}</span>
              </InfoRow>
              <div className="pl-6 text-sm leading-relaxed text-gray-600">
                {addressLines(order.shippingAddress).map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-card border border-gray-200">
          <h3 className="flex items-baseline justify-between gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Items</span>
            <span className="text-xs text-gray-500">{orderItemCount(order)} units</span>
          </h3>

          <ul className="divide-y divide-gray-100">
            {(order.orderItems || []).map((item, index) => {
              const variant = orderItemVariant(item)

              return (
                <li key={`${item.product || item.name}-${index}`} className="flex items-center gap-3 px-4 py-3">
                  <Image
                    src={item.image}
                    alt=""
                    aspect="square"
                    width={120}
                    sizes="48px"
                    className="h-12 w-12 shrink-0"
                    rounded="rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {variant && <span>{variant} · </span>}
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium text-gray-900 tabular-nums">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </li>
              )
            })}
          </ul>

          <dl className="space-y-1.5 border-t border-gray-100 bg-gray-50 px-4 py-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Subtotal</dt>
              <dd className="tabular-nums text-gray-900">{formatPrice(order.itemsPrice)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="flex items-center gap-1.5 text-gray-600">
                <Truck aria-hidden="true" className="h-3.5 w-3.5" />
                Delivery
              </dt>
              <dd className="tabular-nums text-gray-900">
                {order.shippingPrice > 0 ? formatPrice(order.shippingPrice) : "Free"}
              </dd>
            </div>
            {order.taxPrice > 0 && (
              <div className="flex justify-between">
                <dt className="text-gray-600">Tax</dt>
                <dd className="tabular-nums text-gray-900">{formatPrice(order.taxPrice)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-1.5 text-base">
              <dt className="font-semibold text-gray-900">Total</dt>
              <dd className="font-bold tabular-nums text-gray-900">{formatPrice(order.totalPrice)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </Modal>
  )
}

export default OrderDetail
