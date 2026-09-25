import { cloudinary, upload } from "../config/cloudinary.js"
import fs from "fs"

/**
 * Per-kind Cloudinary presets, chosen with `?kind=` on the upload request.
 *
 * Every image used to go through one `800x800 c_limit` — hero banners included.
 * A banner spans the full viewport, so on a 1440px screen the browser was
 * upscaling an 800px-wide file, which is why the hero looked soft no matter
 * what `srcset` the front end asked for: the detail was already gone.
 *
 * Products stay at 800x800. The largest a product image is ever displayed is
 * the PDP gallery at roughly 600px, and a square cap suits square product
 * shots. An unknown `kind` falls back to the product preset, so existing
 * callers that send no kind behave exactly as before.
 */
const PRESETS = {
  product: {
    folder: "sajbela-products",
    transformation: [{ width: 800, height: 800, crop: "limit" }, { quality: "auto" }, { format: "auto" }],
  },
  banner: {
    folder: "sajbela-banners",
    // Width only — a banner's height follows from the ratio it was designed
    // at, and capping both dimensions would crop the design.
    transformation: [{ width: 2000, crop: "limit" }, { quality: "auto" }, { format: "auto" }],
  },
}

const presetFor = (kind) => PRESETS[kind] || PRESETS.product

/** Drop the multer temp file. A failure here must not mask the real error. */
const cleanUp = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch (error) {
    console.error("Could not remove temp upload:", error.message)
  }
}

const cloudinaryConfigured = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)

/** Turn a Cloudinary SDK error into something an admin can act on. */
const uploadErrorMessage = (error) => {
  const message = error?.message || ""
  if (message.includes("Invalid API Key")) return "Cloudinary configuration error - invalid API key"
  if (message.includes("Invalid API Secret")) return "Cloudinary configuration error - invalid API secret"
  if (message.includes("cloud name")) return "Cloudinary configuration error - invalid cloud name"
  if (message.includes("File size too large")) return "That image is too large - try one under 5MB"
  return message ? `Upload failed: ${message}` : "Server error uploading image"
}

// Upload single image
export const uploadSingle = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" })
  }

  if (!cloudinaryConfigured()) {
    cleanUp(req.file.path)
    return res.status(500).json({
      success: false,
      message: "Server configuration error - Cloudinary is not configured",
    })
  }

  try {
    const result = await cloudinary.uploader.upload(req.file.path, presetFor(req.query.kind))

    res.json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      url: result.secure_url, // Back-compat: older admin code reads `url`.
    })
  } catch (error) {
    console.error("Upload error:", error.message)
    res.status(500).json({ success: false, message: uploadErrorMessage(error) })
  } finally {
    cleanUp(req.file.path)
  }
}

// Upload multiple images
export const uploadMultiple = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: "No files uploaded" })
  }

  if (!cloudinaryConfigured()) {
    req.files.forEach((file) => cleanUp(file.path))
    return res.status(500).json({
      success: false,
      message: "Server configuration error - Cloudinary is not configured",
    })
  }

  const preset = presetFor(req.query.kind)

  try {
    const images = await Promise.all(
      req.files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, preset)
        return { imageUrl: result.secure_url, publicId: result.public_id }
      }),
    )

    res.json({ success: true, message: "Images uploaded successfully", images })
  } catch (error) {
    console.error("Multiple upload error:", error.message)
    res.status(500).json({ success: false, message: uploadErrorMessage(error) })
  } finally {
    req.files.forEach((file) => cleanUp(file.path))
  }
}

// Delete image from Cloudinary
export const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.body

    if (!publicId) {
      return res.status(400).json({ success: false, message: "Public ID is required" })
    }

    await cloudinary.uploader.destroy(publicId)

    res.json({ success: true, message: "Image deleted successfully" })
  } catch (error) {
    console.error("Delete image error:", error.message)
    res.status(500).json({ success: false, message: "Server error deleting image" })
  }
}

// Export the configured upload middleware from cloudinary config
export { upload }
