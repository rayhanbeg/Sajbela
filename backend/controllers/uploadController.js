import { cloudinary, upload } from "../config/cloudinary.js"
import fs from "fs"

// Upload single image
export const uploadSingle = async (req, res) => {
  try {
    console.log("📤 Upload request received")
    console.log("📋 Request details:", {
      hasFile: !!req.file,
      fileSize: req.file?.size,
      fileName: req.file?.originalname,
      mimetype: req.file?.mimetype,
    })

    if (!req.file) {
      console.log("❌ No file in request")
      return res.status(400).json({ message: "No file uploaded" })
    }

    console.log("📁 File details:", {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
    })

    console.log("☁️ Uploading to Cloudinary...")

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error("❌ Cloudinary not configured properly")
      return res.status(500).json({
        success: false,
        message: "Server configuration error - Cloudinary not configured",
        error: "Missing Cloudinary credentials",
      })
    }

    // Upload to Cloudinary using the configured instance
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "sajbela-products",
      transformation: [{ width: 800, height: 800, crop: "limit" }, { quality: "auto" }, { format: "auto" }],
    })

    console.log("✅ Cloudinary upload successful:", {
      url: result.secure_url,
      publicId: result.public_id,
    })

    // Delete local file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
      console.log("🗑️ Local file deleted")
    }

    res.json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl: result.secure_url,
      publicId: result.public_id,
      url: result.secure_url, // For backward compatibility
    })
  } catch (error) {
    console.error("❌ Upload error details:")
    console.error("Error message:", error.message)
    console.error("Error code:", error.http_code || error.code)
    console.error("Full error:", error)

    // Clean up local file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
      console.log("🗑️ Local file cleaned up after error")
    }

    // Send detailed error response
    let errorMessage = "Server error uploading image"

    if (error.message && error.message.includes("Invalid API Key")) {
      errorMessage = "Cloudinary configuration error - Invalid API Key"
    } else if (error.message && error.message.includes("Invalid API Secret")) {
      errorMessage = "Cloudinary configuration error - Invalid API Secret"
    } else if (error.message && error.message.includes("cloud name")) {
      errorMessage = "Cloudinary configuration error - Invalid Cloud Name"
    } else if (error.message) {
      errorMessage = `Upload failed: ${error.message}`
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message || "Unknown error",
      details: {
        code: error.http_code || error.code || "No code",
        name: error.name || "Unknown error type",
      },
    })
  }
}

// Upload multiple images
export const uploadMultiple = async (req, res) => {
  try {
    console.log("📤 Multiple upload request received")

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" })
    }

    console.log(`📁 Processing ${req.files.length} files`)

    const uploadPromises = req.files.map(async (file) => {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "sajbela-products",
        transformation: [{ width: 800, height: 800, crop: "limit" }, { quality: "auto" }, { format: "auto" }],
      })

      // Delete local file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path)
      }

      return {
        imageUrl: result.secure_url,
        publicId: result.public_id,
      }
    })

    const results = await Promise.all(uploadPromises)
    console.log(`✅ ${results.length} images uploaded successfully`)

    res.json({
      success: true,
      message: "Images uploaded successfully",
      images: results,
    })
  } catch (error) {
    console.error("❌ Multiple upload error:", error)

    // Clean up local files
    if (req.files) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path)
        }
      })
    }

    res.status(500).json({
      success: false,
      message: "Server error uploading images",
      error: error.message,
    })
  }
}

// Delete image from Cloudinary
export const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.body

    if (!publicId) {
      return res.status(400).json({ message: "Public ID is required" })
    }

    console.log("🗑️ Deleting image:", publicId)

    await cloudinary.uploader.destroy(publicId)
    console.log("✅ Image deleted successfully")

    res.json({
      success: true,
      message: "Image deleted successfully",
    })
  } catch (error) {
    console.error("❌ Delete image error:", error)
    res.status(500).json({
      success: false,
      message: "Server error deleting image",
      error: error.message,
    })
  }
}

// Export the configured upload middleware from cloudinary config
export { upload }
