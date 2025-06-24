import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

dotenv.config()

import authRoutes from "./routes/auth.js"
import productRoutes from "./routes/products.js"
import orderRoutes from "./routes/orders.js"
import addressRoutes from "./routes/addresses.js"
import uploadRoutes from "./routes/upload.js"
import userRoutes from "./routes/users.js"
import reviewRoutes from "./routes/reviews.js"
import cartRoutes from "./routes/cart.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
)

app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/addresses", addressRoutes)
app.use("/api/upload", uploadRoutes)
app.use("/api/users", userRoutes)
app.use("/api/reviews", reviewRoutes)
app.use("/api/cart", cartRoutes)

app.get("/api/health", (req, res) => {
  res.json({
    message: "Server is running!",
    cloudinary: {
      configured: !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      ),
    },
  })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
  })
})

app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" })
})

let isConnected = false

async function connectDB() {
  if (!isConnected) {
    try {
      await mongoose.connect(process.env.MONGODB_URI)
      isConnected = true
      console.log("✅ Connected to MongoDB")
    } catch (error) {
      console.error("❌ MongoDB connection error:", error)
    }
  }
}

// ✅ LOCAL MODE: Use `node server.js`
if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 5000
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    })
  })
}

// ✅ VERCEL MODE: Export handler for serverless
export default async function handler(req, res) {
  await connectDB()
  return app(req, res)
}
