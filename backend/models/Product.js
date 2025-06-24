import mongoose from "mongoose"

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: ["bangles", "earrings", "cosmetics", "necklaces", "rings", "alna", "combo"],
      lowercase: true,
    },
    images: [
      {
        url: String,
        public_id: String,
      },
    ],
    colors: [
      {
        name: String,
        code: String,
        available: {
          type: Boolean,
          default: true,
        },
        stock: {
          type: Number,
          default: 0,
        },
      },
    ],
    sizes: [
      {
        size: String,
        measurement: String,
        available: {
          type: Boolean,
          default: true,
        },
        stock: {
          type: Number,
          default: 0,
        },
      },
    ],
    inStock: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    isCombo: {
      type: Boolean,
      default: false,
    },
    tags: [String],
    specifications: {
      material: String,
      weight: String,
      dimensions: String,
      color: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
)

// Add indexes for better performance
productSchema.index({ category: 1 })
productSchema.index({ name: "text", description: "text" })
productSchema.index({ price: 1 })
productSchema.index({ rating: -1 })
productSchema.index({ createdAt: -1 })
productSchema.index({ featured: 1 })
productSchema.index({ isNewArrival: 1 })
productSchema.index({ isCombo: 1 })

const Product = mongoose.model("Product", productSchema)

export default Product
