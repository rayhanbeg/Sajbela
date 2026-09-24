/**
 * Product vocabulary — categories, variant options, stock arithmetic.
 *
 * The admin pages each had their own copy of this and they had drifted apart.
 * Two of the copies were also wrong about the schema:
 *
 *  - The product form wrote colour swatches as `colors[].hexCode`. The schema
 *    field is `colors[].code`, so Mongoose stripped the key on save and every
 *    product created through the admin had colourless swatches on the shop.
 *  - The product list read `product.isNew` and `product.isFeatured`. The
 *    schema has `isNewArrival` and `featured`, so the "New" and "Featured"
 *    badges never rendered for any product, ever.
 *
 * `code` and the real flag names are used below. See models/Product.js.
 */

export const PRODUCT_CATEGORIES = [
  { value: "bangles", label: "Bangles" },
  { value: "earrings", label: "Earrings" },
  { value: "necklaces", label: "Necklaces" },
  { value: "rings", label: "Rings" },
  { value: "cosmetics", label: "Cosmetics" },
  { value: "alna", label: "Alna" },
  { value: "combo", label: "Combo" },
]

export function categoryLabel(value) {
  const match = PRODUCT_CATEGORIES.find((category) => category.value === String(value || "").toLowerCase())
  if (match) return match.label

  const raw = String(value || "")
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "—"
}

/** Only bangles are sold by size, and only these four exist. */
export const BANGLE_SIZES = [
  { size: "S", measurement: "2.4/24" },
  { size: "M", measurement: "2.6/26" },
  { size: "L", measurement: "2.8/28" },
  { size: "XL", measurement: "2.10/30" },
]

export const SIZED_CATEGORY = "bangles"

export function isSizedCategory(category) {
  return String(category || "").toLowerCase() === SIZED_CATEGORY
}

export const PRODUCT_COLORS = [
  { name: "Multi Color", code: "#FF6B6B" },
  { name: "Red", code: "#FF0000" },
  { name: "Blue", code: "#0000FF" },
  { name: "Green", code: "#00FF00" },
  { name: "Yellow", code: "#FFFF00" },
  { name: "Purple", code: "#800080" },
  { name: "Orange", code: "#FFA500" },
  { name: "Pink", code: "#FFC0CB" },
  { name: "Black", code: "#000000" },
  { name: "White", code: "#FFFFFF" },
  { name: "Gold", code: "#FFD700" },
  { name: "Silver", code: "#C0C0C0" },
  { name: "Rose Gold", code: "#E8B4B8" },
]

/**
 * Swatch colour for a variant. `hexCode` is read as a fallback because
 * products saved before the field-name fix have it on the document — the
 * storefront's VariantPicker does the same.
 */
export function swatch(color) {
  return color?.code || color?.hexCode || "#E5E7EB"
}

export const LOW_STOCK_THRESHOLD = 5

/**
 * How many units are actually sellable, and where the number came from.
 *
 * This mirrors the order controller's decrement logic exactly
 * (controllers/orderController.js): a bangle's stock lives on its sizes, a
 * product with colours keeps it on the colours, and everything else uses the
 * top-level `stock` field. The old admin table only ever looked at sizes and
 * `stock`, so a lipstick tracked by shade showed "0" while its shades had
 * plenty — which is what made the low-stock counters untrustworthy.
 */
export function stockLevel(product) {
  const sizes = Array.isArray(product?.sizes) ? product.sizes : []
  const colors = Array.isArray(product?.colors) ? product.colors : []

  const sum = (variants) =>
    variants.reduce((total, variant) => total + (Number(variant?.stock) || 0), 0)

  if (isSizedCategory(product?.category) && sizes.length > 0) {
    return { total: sum(sizes), tracked: "sizes", variants: sizes }
  }

  if (colors.length > 0) {
    return { total: sum(colors), tracked: "colors", variants: colors }
  }

  return { total: Number(product?.stock) || 0, tracked: "simple", variants: [] }
}

/** Badge tone for a stock figure. */
export function stockTone(total) {
  if (total <= 0) return "danger"
  if (total <= LOW_STOCK_THRESHOLD) return "warning"
  return "success"
}

export function stockStatusLabel(total) {
  if (total <= 0) return "Out of stock"
  if (total <= LOW_STOCK_THRESHOLD) return "Low stock"
  return "In stock"
}

/** "3 of 4 sizes" / "2 of 5 colours" — the sub-line under a stock figure. */
export function variantSummary(product) {
  const { tracked, variants } = stockLevel(product)
  if (tracked === "simple") return null

  const inStock = variants.filter((variant) => (Number(variant?.stock) || 0) > 0).length
  const noun = tracked === "sizes" ? "size" : "colour"

  if (inStock === 0) return `No ${noun}s in stock`
  return `${inStock} of ${variants.length} ${noun}${variants.length === 1 ? "" : "s"}`
}

export function productImage(product) {
  return product?.images?.[0]?.url || product?.image || null
}

/**
 * Cloudinary id for an uploaded image. The schema stores `public_id`; the
 * upload endpoint answers with `publicId`, and the old form persisted that
 * spelling, so both are accepted when working out what to delete.
 */
export function imagePublicId(image) {
  return image?.public_id || image?.publicId || null
}

/** The merchandising flags, as they're actually named on the document. */
export const PRODUCT_FLAGS = [
  { key: "featured", label: "Featured", tone: "warning", hint: "Shows in the featured row on the home page." },
  { key: "isNewArrival", label: "New", tone: "info", hint: "Shows in New Arrivals and gets a badge on the card." },
  { key: "isCombo", label: "Combo", tone: "brand", hint: "Shows in the combo offers section." },
]

export function productFlags(product) {
  return PRODUCT_FLAGS.filter((flag) => Boolean(product?.[flag.key]))
}
