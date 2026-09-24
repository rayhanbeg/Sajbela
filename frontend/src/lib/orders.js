/**
 * Order vocabulary — status names, progress steps, labels and formatting.
 *
 * All of this was previously inlined per page. `getStatusColor` existed in
 * three files with three different colour maps, `formatSizeDisplay` in four
 * (with ragged spacing: "S  – 2.4/24" had a double space, "XL– 2.10/30" was
 * missing one), and the "order number" was variously `_id.slice(-6)`,
 * `_id.slice(-8)` and `Date.now()` — so a shopper's confirmation page, their
 * order history and the admin table could all show different numbers for the
 * same order.
 *
 * One definition here, imported by the account panels and the admin tables.
 */

export const ORDER_STATUS_META = {
  pending: {
    label: "Pending",
    tone: "neutral",
    hint: "We've received your order and will confirm it shortly.",
  },
  processing: {
    label: "Processing",
    tone: "warning",
    hint: "We're packing your items.",
  },
  shipped: {
    label: "Shipped",
    tone: "info",
    hint: "Your parcel is on its way with the courier.",
  },
  delivered: {
    label: "Delivered",
    tone: "success",
    hint: "Delivered. We hope you love it.",
  },
  cancelled: {
    label: "Cancelled",
    tone: "danger",
    hint: "This order was cancelled and won't be delivered.",
  },
}

/** The happy path, in order. `cancelled` is deliberately not a step. */
export const ORDER_PROGRESS = ["pending", "processing", "shipped", "delivered"]

/** Every status, for filter dropdowns and the admin status picker. */
export const ORDER_STATUSES = Object.keys(ORDER_STATUS_META)

/** Statuses a shopper is still allowed to cancel themselves. */
const CANCELLABLE = new Set(["pending", "processing"])

export function statusMeta(status) {
  if (ORDER_STATUS_META[status]) return ORDER_STATUS_META[status]

  // Unknown status from the API: show it rather than swallow it.
  const raw = String(status || "")
  return {
    label: raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "Unknown",
    tone: "neutral",
    hint: "",
  }
}

export function isCancellable(status) {
  return CANCELLABLE.has(status)
}

/** Position on the progress track, or -1 for cancelled/unknown. */
export function progressIndex(status) {
  return ORDER_PROGRESS.indexOf(status)
}

/**
 * The customer-facing order reference, e.g. "SJ4F9A2C".
 * Derived from the Mongo id so it's stable and matches what admin sees.
 */
export function orderNumber(id) {
  if (!id) return "—"
  return `SJ${String(id).slice(-6).toUpperCase()}`
}

export function paymentLabel(method) {
  if (method === "cash_on_delivery" || method === "cod") return "Cash on delivery"
  if (method === "bkash") return "bKash"
  if (method === "nagad") return "Nagad"
  if (method === "rocket") return "Rocket"
  return method || "—"
}

/**
 * Bangle sizes carry a diameter the shopper picked from, and it's the only way
 * to tell two otherwise identical line items apart — so it stays in the label.
 */
const SIZE_LABELS = {
  S: "S – 2.4/24",
  M: "M – 2.6/26",
  L: "L – 2.8/28",
  XL: "XL – 2.10/30",
}

export function sizeLabel(size) {
  if (!size) return null
  return SIZE_LABELS[size] || size
}

/** "Gold · M – 2.6/26" — the variant summary under an order line. */
export function orderItemVariant(item) {
  return [item?.selectedColor, sizeLabel(item?.selectedSize)].filter(Boolean).join(" · ")
}

/** Units, not lines: 2 × bangle + 1 × lipstick is 3 items. */
export function orderItemCount(order) {
  return (order?.orderItems || []).reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0)
}

/**
 * Who to show against an order in the admin table.
 *
 * `user` is populated with name+email by getAllOrders, but an account can be
 * deleted after the order was placed — the populate then yields null and the
 * old table rendered "Unknown". The shipping address always has a name and a
 * phone, so the parcel is still identifiable.
 */
export function orderCustomer(order) {
  return {
    name: order?.user?.name || order?.shippingAddress?.fullName || "Unknown",
    email: order?.user?.email || null,
    phone: order?.shippingAddress?.phone || null,
    deleted: Boolean(order?.user && !order.user.name),
    guest: !order?.user,
  }
}

/**
 * Shipping address → the display lines used everywhere it's shown.
 *
 * Two different shapes arrive here and they name the same two fields
 * differently:
 *
 *  - A saved address (models/Address.js) has `district` and `thana`.
 *  - An order's embedded `shippingAddress` (models/Order.js) has `city` and
 *    `postalCode` — and createOrder writes the district into `city` and the
 *    thana into `postalCode` ("Handle both district and city"). Bangladesh
 *    addresses don't use postcodes this way, so those two field names have
 *    never meant what they say.
 *
 * Reading both keeps every order in the existing history rendering correctly;
 * renaming the schema fields would strand the ones already written.
 */
export function addressLines(address) {
  if (!address) return []

  const thana = address.thana || address.postalCode
  const district = address.district || address.city

  return [address.address, [thana, district].filter(Boolean).join(", "), address.country].filter(Boolean)
}
