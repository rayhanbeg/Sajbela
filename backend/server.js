import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

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

dotenv.config()

const app = express()

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || ["http://localhost:5173", "https://sajbelafrontend.vercel.app"],
    credentials: true,
  })
)
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Mount routes
app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/addresses", addressRoutes)
app.use("/api/upload", uploadRoutes)
app.use("/api/users", userRoutes)
app.use("/api/reviews", reviewRoutes)
app.use("/api/cart", cartRoutes)

// Health check
app.get("/api", (req, res) => {
  res.json({ message: "Server running successfully" })
})

// MongoDB connect
let isConnected = false
const connectDB = async () => {
  if (isConnected) return
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    isConnected = true
    console.log("✅ MongoDB connected")
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message)
  }
}

// Localhost run
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`)
    })
  })
}

// Export for Vercel
const handler = async (req, res) => {
  await connectDB()
  return app(req, res)
}

export default handler
