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

    const { page = 1, limit = 10, status, search, startDate, endDate } = req.query

    const query = {}
    if (status) query.status = status

    /*
     * The admin table has had "From" and "End" date inputs since the first
     * commit and this handler ignored them, so the filters were decorative —
     * picking a range re-fetched the same unfiltered page.
     *
     * `endDate` is pushed to the end of its day: a range of 1–7 June that
     * stopped at 00:00 on the 7th silently dropped every order placed on the
     * last day the admin asked for.
     */
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        query.createdAt.$lte = end
      }
    }

    /*
     * Search matches the recipient name or phone on the shipping address, not
     * the account — most orders here are COD and the shopper phones about
     * them, so the number they're calling from is the practical lookup key.
     */
    if (search && search.trim()) {
      const term = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      query.$or = [
        { "shippingAddress.fullName": { $regex: term, $options: "i" } },
        { "shippingAddress.phone": { $regex: term, $options: "i" } },
      ]
    }

    const pageNum = Math.max(Number.parseInt(page) || 1, 1)
    const limitNum = Math.max(Number.parseInt(limit) || 10, 1)

    const orders = await Order.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)

    const total = await Order.countDocuments(query)

    res.json({
      orders,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        total,
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
    })
  } catch (error) {
    console.error("Get all orders error:", error)
    res.status(500).json({ message: "Server error fetching orders" })
  }
}

/*
 * Dashboard figures (admin only).
 *
 * The old dashboard fetched the 100 most recent orders and added up their
 * totals in the browser, labelling the result "Total Revenue" — so revenue
 * stopped growing at order 101 and quietly counted cancelled orders as
 * income. Three aggregations here instead, over the whole collection.
 */
export const getOrderStats = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." })
    }

    const days = Math.min(Math.max(Number.parseInt(req.query.days) || 14, 1), 90)

    const since = new Date()
    since.setHours(0, 0, 0, 0)
    since.setDate(since.getDate() - (days - 1))

    const [totals, byStatus, series] = await Promise.all([
      Order.aggregate([
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 0, "$totalPrice"] } },
          },
        },
      ]),
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Order.aggregate([
        // Cancelled orders are excluded from revenue but still counted as orders.
        { $match: { status: { $ne: "cancelled" }, createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$totalPrice" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ])

    res.json({
      totalOrders: totals[0]?.orders || 0,
      totalRevenue: totals[0]?.revenue || 0,
      statusCounts: byStatus.reduce((acc, row) => ({ ...acc, [row._id]: row.count }), {}),
      series: series.map((row) => ({ date: row._id, revenue: row.revenue, orders: row.orders })),
      days,
    })
  } catch (error) {
    console.error("Get order stats error:", error)
    res.status(500).json({ message: "Server error fetching order stats" })
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
