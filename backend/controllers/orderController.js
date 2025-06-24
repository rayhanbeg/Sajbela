import Order from "../models/Order.js"
import Product from "../models/Product.js"
import Cart from "../models/Cart.js"
import { sendOrderConfirmation } from "../config/email.js"

// Get all orders (admin only)
export const getAllOrders = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." })
    }

    const { page = 1, limit = 10, status } = req.query
    const query = status ? { status } : {}

    const orders = await Order.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Order.countDocuments(query)

    res.json({
      orders,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Get all orders error:", error)
    res.status(500).json({ message: "Server error fetching orders" })
  }
}

// Create new order
export const createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, itemsPrice, taxPrice, shippingPrice, totalPrice } = req.body

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "No order items" })
    }

    console.log("Order items received:", orderItems)
    console.log("User ID:", req.user._id)

    // Log each item's color and size for debugging
    orderItems.forEach((item, index) => {
      console.log(`Item ${index}:`, {
        name: item.name,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
      })
    })

    // Verify products exist and have sufficient stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product)
      if (!product) {
        return res.status(404).json({ message: `Product ${item.name} not found` })
      }

      // Check if product is active - use isActive field or fallback to checking if product exists
      const productIsActive = product.isActive !== undefined ? product.isActive : true
      if (!productIsActive) {
        return res.status(400).json({ message: `Product ${item.name} is no longer available` })
      }

      // Check stock based on product type and selections
      if (product.category === "bangles" && item.selectedSize) {
        const sizeOption = product.sizes.find((s) => s.size === item.selectedSize)
        if (!sizeOption || !sizeOption.available || sizeOption.stock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for ${item.name} (Size: ${item.selectedSize})`,
          })
        }
      } else if (product.colors && product.colors.length > 0 && item.selectedColor) {
        const colorOption = product.colors.find((c) => c.name === item.selectedColor)
        if (!colorOption || !colorOption.available || colorOption.stock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for ${item.name} (Color: ${item.selectedColor})`,
          })
        }
      } else if (product.category !== "bangles" && (!product.colors || product.colors.length === 0)) {
        // Check regular stock for products without size/color variants
        if (product.stock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for ${item.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
          })
        }
      }
    }

    // Create the order with proper address structure
    const order = new Order({
      user: req.user._id,
      orderItems: orderItems.map((item) => {
        console.log("Creating order item:", {
          product: item.product,
          name: item.name,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
        })

        return {
          product: item.product,
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
          selectedSize: item.selectedSize || null,
          selectedColor: item.selectedColor || null,
        }
      }),
      shippingAddress: {
        fullName: shippingAddress.fullName,
        address: shippingAddress.address,
        city: shippingAddress.district || shippingAddress.city, // Handle both district and city
        postalCode: shippingAddress.thana || shippingAddress.postalCode, // Handle both thana and postalCode
        country: shippingAddress.country || "Bangladesh",
        phone: shippingAddress.phone,
      },
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    })

    const createdOrder = await order.save()
    console.log("Order created with items:", createdOrder.orderItems)

    // Update product stock after successful order creation
    for (const item of orderItems) {
      const product = await Product.findById(item.product)

      if (product.category === "bangles" && item.selectedSize) {
        // Update size-specific stock for bangles
        const sizeIndex = product.sizes.findIndex((s) => s.size === item.selectedSize)
        if (sizeIndex !== -1) {
          product.sizes[sizeIndex].stock -= item.quantity
          product.sizes[sizeIndex].available = product.sizes[sizeIndex].stock > 0
        }
      } else if (product.colors && product.colors.length > 0 && item.selectedColor) {
        // Update color-specific stock
        const colorIndex = product.colors.findIndex((c) => c.name === item.selectedColor)
        if (colorIndex !== -1) {
          product.colors[colorIndex].stock -= item.quantity
          product.colors[colorIndex].available = product.colors[colorIndex].stock > 0
        }
      } else {
        // Update regular stock
        product.stock -= item.quantity
      }

      await product.save()
    }

    // Clear user's cart after successful order
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] })

    // Send beautiful order confirmation email
    try {
      const emailResult = await sendOrderConfirmation(req.user.email, req.user.name, createdOrder)
      if (emailResult.success) {
        console.log("Order confirmation email sent successfully")
      } else {
        console.error("Failed to send order confirmation email:", emailResult.error)
      }
    } catch (emailError) {
      console.error("Error sending order confirmation email:", emailError)
      // Don't fail the order creation if email fails
    }

    console.log("Order created successfully:", createdOrder._id)
    res.status(201).json(createdOrder)
  } catch (error) {
    console.error("Create order error:", error)
    res.status(500).json({ message: "Server error creating order", error: error.message })
  }
}

// Get user orders
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.json(orders)
  } catch (error) {
    console.error("Get user orders error:", error)
    res.status(500).json({ message: "Server error fetching orders" })
  }
}

// Get order by ID
export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email")

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json(order)
  } catch (error) {
    console.error("Get order error:", error)
    res.status(500).json({ message: "Server error fetching order" })
  }
}

// Update order status (admin only)
export const updateOrderStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." })
    }

    const { status } = req.body
    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    order.status = status
    if (status === "delivered") {
      order.isDelivered = true
      order.deliveredAt = Date.now()
    }

    await order.save()
    res.json(order)
  } catch (error) {
    console.error("Update order status error:", error)
    res.status(500).json({ message: "Server error updating order status" })
  }
}

// Cancel order (user only, before shipped)
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Check if user owns the order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    // Check if order can be cancelled (only pending or processing orders)
    if (order.status === "shipped" || order.status === "delivered" || order.status === "cancelled") {
      return res.status(400).json({
        message: `Cannot cancel order. Order is already ${order.status}`,
      })
    }

    // Restore product stock for each item in the order
    for (const item of order.orderItems) {
      try {
        const product = await Product.findById(item.product)
        if (product) {
          if (product.category === "bangles" && item.selectedSize) {
            // Restore size-specific stock
            const sizeIndex = product.sizes.findIndex((s) => s.size === item.selectedSize)
            if (sizeIndex !== -1) {
              product.sizes[sizeIndex].stock += item.quantity
              product.sizes[sizeIndex].available = true
            }
          } else if (product.colors && product.colors.length > 0 && item.selectedColor) {
            // Restore color-specific stock
            const colorIndex = product.colors.findIndex((c) => c.name === item.selectedColor)
            if (colorIndex !== -1) {
              product.colors[colorIndex].stock += item.quantity
              product.colors[colorIndex].available = product.colors[colorIndex].stock > 0
            }
          } else {
            // Restore regular stock
            product.stock += item.quantity
          }
          await product.save()
        }
      } catch (productError) {
        console.error(`Error restoring stock for product ${item.product}:`, productError)
      }
    }

    order.status = "cancelled"
    await order.save()

    res.json({
      message: "Order cancelled successfully. Product stock has been restored.",
      order,
    })
  } catch (error) {
    console.error("Cancel order error:", error)
    res.status(500).json({ message: "Server error cancelling order" })
  }
}
