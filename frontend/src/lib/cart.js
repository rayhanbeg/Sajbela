import { SHIPPING } from "./navigation"
import { productImageUrl } from "./cloudinary"

/**
 * Cart line-item and delivery-charge maths.
 *
 * These rules were previously written out three times — in CartPage, in
 * CheckoutPage and again in the backend order controller — with the thresholds
 * hard-coded as bare numbers (`if (subtotal >= 2000)`). When the outside-Dhaka
 * charge changed from 100 to 120 only some of those copies were updated.
 *
 * The values live in SHIPPING (lib/navigation); this module is the only place
 * on the client that decides what they mean.
 */

/**
 * Cart items are populated documents (`{ product: {...}, quantity }`) from the
 * API, but older code paths pushed flat objects. Normalise both to one shape.
 */
export function readCartItem(item) {
  const product = item?.product && typeof item.product === "object" ? item.product : item

  return {
    id: item?._id || product?._id,
    productId: product?._id || item?.productId || item?.product,
    name: product?.name || item?.name || "Product",
    // The line price is snapshotted onto the cart item at add time, so it wins
    // over the product's current price — that's the price the user agreed to.
    price: Number(item?.price ?? product?.price ?? 0),
    image: productImageUrl(product),
    quantity: Number(item?.quantity) || 1,
    selectedSize: item?.selectedSize || null,
    selectedColor: item?.selectedColor || null,
    stock: Number(product?.stock) || 0,
    category: product?.category,
  }
}

/** "Gold · M" — the variant summary shown under a line item. */
export function variantLabel(item) {
  return [item?.selectedColor, item?.selectedSize].filter(Boolean).join(" · ")
}

export function lineTotal(item) {
  const line = readCartItem(item)
  return line.price * line.quantity
}

export function cartSubtotal(items = []) {
  return items.reduce((sum, item) => sum + lineTotal(item), 0)
}

/** Delivery is charged by district; everything outside Dhaka is one flat rate. */
export function isInsideDhaka(district) {
  return String(district || "").trim().toLowerCase() === "dhaka"
}

export function deliveryCharge(subtotal, district) {
  if (subtotal >= SHIPPING.freeThreshold) return 0
  return isInsideDhaka(district) ? SHIPPING.insideDhaka : SHIPPING.outsideDhaka
}

/**
 * Every number the order summary needs, from one call.
 *
 * `district` may be undefined (no saved address yet, guest checkout before the
 * form is filled in) — then `estimated` is true and the UI should say so
 * rather than presenting a guess as the final total.
 */
export function cartTotals(items = [], district) {
  const subtotal = cartSubtotal(items)
  const shipping = deliveryCharge(subtotal, district)
  const freeShippingRemaining = Math.max(0, SHIPPING.freeThreshold - subtotal)

  return {
    subtotal,
    shipping,
    total: subtotal + shipping,
    freeShippingRemaining,
    hasFreeShipping: subtotal >= SHIPPING.freeThreshold,
    // Progress bar towards the free-delivery threshold, 0–100.
    freeShippingProgress: Math.min(100, (subtotal / SHIPPING.freeThreshold) * 100),
    estimated: !district && subtotal < SHIPPING.freeThreshold,
    zone: isInsideDhaka(district) ? "Inside Dhaka" : district ? "Outside Dhaka" : null,
  }
}

export function totalItemCount(items = []) {
  return items.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0)
}
