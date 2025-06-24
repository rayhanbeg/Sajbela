import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

// Import routes
import authRoutes from "./routes/auth.js"
import productRoutes from "./routes/products.js"
import orderRoutes from "./routes/orders.js"
import addressRoutes from "./routes/addresses.js"
import uploadRoutes from "./routes/upload.js"
import userRoutes from "./routes/users.js"
import reviewRoutes from "./routes/reviews.js"
import cartRoutes from "./routes/cart.js"

// ES6 module fix for __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5000",
    credentials: true,
  }),
)

app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/addresses", addressRoutes)
app.use("/api/upload", uploadRoutes)
app.use("/api/users", userRoutes)
app.use("/api/reviews", reviewRoutes)
app.use("/api/cart", cartRoutes)

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running!" })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: "Something went wrong!" })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" })
})

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB")
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error)
    process.exit(1)
  })

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
