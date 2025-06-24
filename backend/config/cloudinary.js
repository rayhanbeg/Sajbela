import { v2 as cloudinary } from "cloudinary"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import multer from "multer"
import dotenv from "dotenv"

dotenv.config()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "sajbela-products",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ width: 800, height: 800, crop: "limit" }, { quality: "auto" }],
  },
})

// Create multer upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files are allowed!"), false)
    }
  },
})

// Test Cloudinary connection
const testCloudinaryConnection = async () => {
  try {
    console.log("🔍 Testing Cloudinary connection...")

    // Check if all required environment variables are set
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error("Missing required Cloudinary environment variables")
    }

    // Simple test - try to upload a small test image and then delete it
    const testResult = await cloudinary.uploader.upload(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      {
        folder: "test",
        public_id: "connection_test",
        overwrite: true,
      },
    )

    // Clean up test image
    await cloudinary.uploader.destroy(testResult.public_id)

    console.log("✅ Cloudinary connected successfully")
    console.log("📊 Account info:", {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      public_id: testResult.public_id,
      status: "Connected",
    })
  } catch (error) {
    console.error("❌ Cloudinary connection failed:")
    console.error("Full error:", error)
    console.error("Error details:", {
      message: error.message || "Unknown error",
      code: error.http_code || error.code || "No code",
      name: error.name || "Unknown error type",
    })

    console.log("Current Cloudinary configuration:")
    console.log("- Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME)
    console.log("- API Key:", process.env.CLOUDINARY_API_KEY)
    console.log(
      "- API Secret Length:",
      process.env.CLOUDINARY_API_SECRET ? process.env.CLOUDINARY_API_SECRET.length : 0,
    )
    console.log(
      "- API Secret First 4 chars:",
      process.env.CLOUDINARY_API_SECRET ? process.env.CLOUDINARY_API_SECRET.substring(0, 4) + "..." : "NOT SET",
    )

    // Provide specific guidance based on error
    if (error.http_code === 401 && error.message && error.message.includes("Invalid Signature")) {
      console.log("🔐 SIGNATURE ERROR - Your API Secret is incorrect!")
      console.log("📋 Steps to fix:")
      console.log("   1. Go to your Cloudinary Dashboard")
      console.log("   2. Navigate to Settings > Security")
      console.log("   3. Copy the API Secret exactly (no extra spaces)")
      console.log("   4. Update your .env file: CLOUDINARY_API_SECRET=your_secret_here")
      console.log("   5. Restart your server")
      console.log("⚠️  Make sure you're using the API Secret from the SAME account as your Cloud Name and API Key")
    } else if (error.message && error.message.includes("Invalid API Key")) {
      console.log("🔑 Invalid API Key - please check your CLOUDINARY_API_KEY")
    } else if (error.message && error.message.includes("cloud name")) {
      console.log("☁️ Invalid Cloud Name - please check your CLOUDINARY_CLOUD_NAME")
    } else {
      console.log("🌐 Connection issue - please check your credentials and internet connection")
    }
  }
}

// Test connection with a small delay to avoid startup issues
setTimeout(testCloudinaryConnection, 1000)

export { cloudinary, upload }
