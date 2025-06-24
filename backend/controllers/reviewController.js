import Review from "../models/Review.js"
import Product from "../models/Product.js"
import Order from "../models/Order.js"

// Get reviews for a product
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const reviews = await Review.find({
      product: productId,
      isActive: true,
    })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Review.countDocuments({
      product: productId,
      isActive: true,
    })

    res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get product reviews error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Create a review
export const createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, title, comment, images } = req.body

    // Validate required fields
    if (!productId || !orderId || !rating) {
      return res.status(400).json({
        message: "Product ID, Order ID, and rating are required",
      })
    }

    // Check if order exists and belongs to user
    const order = await Order.findOne({
      _id: orderId,
      user: req.userId,
      status: "delivered",
    })

    if (!order) {
      return res.status(400).json({
        message: "Order not found or not delivered",
      })
    }

    // Check if product is in the order
    const orderItem = order.orderItems.find((item) => item.product.toString() === productId)

    if (!orderItem) {
      return res.status(400).json({
        message: "Product not found in this order",
      })
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      user: req.userId,
      product: productId,
      order: orderId,
    })

    if (existingReview) {
      return res.status(400).json({
        message: "You have already reviewed this product",
      })
    }

    // Create review
    const review = new Review({
      user: req.userId,
      product: productId,
      order: orderId,
      rating,
      title,
      comment,
      images: images || [],
      isVerified: true,
    })

    await review.save()

    // Update product rating
    await updateProductRating(productId)

    // Populate user info for response
    await review.populate("user", "name")

    res.status(201).json(review)
  } catch (error) {
    console.error("Create review error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Update a review
export const updateReview = async (req, res) => {
  try {
    const { rating, title, comment, images } = req.body

    const review = await Review.findOne({
      _id: req.params.id,
      user: req.userId,
    })

    if (!review) {
      return res.status(404).json({ message: "Review not found" })
    }

    // Update fields
    if (rating) review.rating = rating
    if (title !== undefined) review.title = title
    if (comment !== undefined) review.comment = comment
    if (images !== undefined) review.images = images

    await review.save()

    // Update product rating
    await updateProductRating(review.product)

    await review.populate("user", "name")

    res.json(review)
  } catch (error) {
    console.error("Update review error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      user: req.userId,
    })

    if (!review) {
      return res.status(404).json({ message: "Review not found" })
    }

    const productId = review.product

    await Review.findByIdAndDelete(req.params.id)

    // Update product rating
    await updateProductRating(productId)

    res.json({ message: "Review deleted successfully" })
  } catch (error) {
    console.error("Delete review error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get user's reviews
export const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.userId })
      .populate("product", "name images price")
      .populate("order", "orderNumber")
      .sort({ createdAt: -1 })

    res.json(reviews)
  } catch (error) {
    console.error("Get my reviews error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get reviewable products (delivered orders without reviews)
export const getReviewableProducts = async (req, res) => {
  try {
    // Get all delivered orders for the user
    const deliveredOrders = await Order.find({
      user: req.userId,
      status: "delivered",
    }).populate("orderItems.product", "name images price")

    const reviewableProducts = []

    for (const order of deliveredOrders) {
      for (const item of order.orderItems) {
        if (!item.product) continue // Skip if product is deleted

        // Check if this product has already been reviewed for this order
        const existingReview = await Review.findOne({
          user: req.userId,
          product: item.product._id,
          order: order._id,
        })

        if (!existingReview) {
          reviewableProducts.push({
            orderId: order._id,
            orderNumber: order.orderNumber || order._id,
            product: {
              _id: item.product._id,
              name: item.product.name || item.name,
              images: item.product.images || [],
              price: item.product.price || item.price,
            },
            quantity: item.quantity,
            price: item.price,
            deliveredAt: order.updatedAt,
          })
        }
      }
    }

    res.json(reviewableProducts)
  } catch (error) {
    console.error("Get reviewable products error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Check if review exists for a product and order
export const checkReview = async (req, res) => {
  try {
    const { productId, orderId } = req.params

    const review = await Review.findOne({
      user: req.userId,
      product: productId,
      order: orderId,
    })

    res.json({ exists: !!review, review })
  } catch (error) {
    console.error("Check review error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Helper function to update product rating
async function updateProductRating(productId) {
  try {
    const reviews = await Review.find({
      product: productId,
      isActive: true,
    })

    if (reviews.length === 0) {
      await Product.findByIdAndUpdate(productId, {
        rating: 0,
        numReviews: 0,
      })
      return
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = totalRating / reviews.length

    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      numReviews: reviews.length,
    })
  } catch (error) {
    console.error("Update product rating error:", error)
  }
}
