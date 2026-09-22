/**
 * Cloudinary URL helpers.
 *
 * Every product image in this store is served from Cloudinary, which means we
 * can ask for a correctly-sized, auto-formatted (AVIF/WebP) image per viewport
 * instead of shipping the full-size original to a 375px phone. That's the
 * single biggest Lighthouse win available to the storefront.
 *
 * A Cloudinary delivery URL looks like:
 *   https://res.cloudinary.com/<cloud>/image/upload/v1750672511/folder/id.png
 *                                                 ^ transformations go here
 *
 * Non-Cloudinary URLs (local placeholders, external images) pass through
 * untouched, so these helpers are always safe to call.
 */

const CLOUDINARY_UPLOAD_MARKER = "/image/upload/"

/** Default responsive widths, tuned to the breakpoints in the brief. */
export const DEFAULT_WIDTHS = [240, 375, 480, 640, 768, 960, 1280, 1600]

export const PLACEHOLDER_IMAGE = "/placeholder.svg"

function isCloudinaryUrl(url) {
  return typeof url === "string" && url.includes("res.cloudinary.com") && url.includes(CLOUDINARY_UPLOAD_MARKER)
}

/**
 * Insert transformations into a Cloudinary URL.
 *
 * @param {string} url      Original image URL.
 * @param {object} [opts]
 * @param {number} [opts.width]   Target width in px.
 * @param {number} [opts.height]  Target height in px.
 * @param {string} [opts.crop]    Crop mode (default "fill" when height is set, else "limit").
 * @param {string} [opts.gravity] Gravity for cropping, e.g. "auto".
 * @param {string} [opts.quality] Quality, default "auto".
 * @returns {string}
 */
export function cloudinaryUrl(url, opts = {}) {
  if (!url) return PLACEHOLDER_IMAGE
  if (!isCloudinaryUrl(url)) return url

  const { width, height, crop, gravity = "auto", quality = "auto" } = opts

  const transforms = ["f_auto", `q_${quality}`, "dpr_auto"]

  if (width) transforms.push(`w_${Math.round(width)}`)
  if (height) transforms.push(`h_${Math.round(height)}`)

  const cropMode = crop || (height ? "fill" : "limit")
  if (width || height) {
    transforms.push(`c_${cropMode}`)
    if (cropMode === "fill" || cropMode === "thumb") transforms.push(`g_${gravity}`)
  }

  const [prefix, suffix] = url.split(CLOUDINARY_UPLOAD_MARKER)
  return `${prefix}${CLOUDINARY_UPLOAD_MARKER}${transforms.join(",")}/${suffix}`
}

/**
 * Build a `srcset` string so the browser can pick the cheapest adequate image.
 * Returns undefined for non-Cloudinary URLs (no srcset is better than a wrong one).
 *
 * @param {string} url
 * @param {object} [opts]
 * @param {number[]} [opts.widths]
 * @param {number}   [opts.aspectRatio]  height / width, e.g. 1 for square.
 * @returns {string|undefined}
 */
export function cloudinarySrcSet(url, opts = {}) {
  if (!isCloudinaryUrl(url)) return undefined

  const { widths = DEFAULT_WIDTHS, aspectRatio } = opts

  return widths
    .map((w) => {
      const height = aspectRatio ? Math.round(w * aspectRatio) : undefined
      return `${cloudinaryUrl(url, { width: w, height })} ${w}w`
    })
    .join(", ")
}

/**
 * Tiny blurred version of the image, used as a CSS background placeholder so
 * the card has something to show while the real image decodes (no layout shift,
 * no grey flash).
 */
export function cloudinaryBlurUrl(url) {
  if (!isCloudinaryUrl(url)) return undefined
  return cloudinaryUrl(url, { width: 24, quality: "auto:low" })
}

/**
 * Pull the best available image URL off a product document.
 * Products store `images: [{ url, public_id }]`, but some older records and
 * cart line items use a flat `image` string — handle both.
 *
 * @param {object} product
 * @param {number} [index]
 * @returns {string}
 */
export function productImageUrl(product, index = 0) {
  if (!product) return PLACEHOLDER_IMAGE

  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images[index]?.url || product.images[0]?.url || PLACEHOLDER_IMAGE
  }

  return product.image || PLACEHOLDER_IMAGE
}
