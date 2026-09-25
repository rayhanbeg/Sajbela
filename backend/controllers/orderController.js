import mongoose from "mongoose"
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
        { "guestInfo.email": { $regex: term, $options: "i" } },
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

/**
 * Place an order — with or without an account.
 *
 * Mounted on `optionalAuth`, so `req.user` may be undefined. Everything the
 * order needs about the buyer other than their email was already coming from
 * the checkout form rather than the profile, so the guest path is genuinely
 * just "no account to attach and no server cart to empty".
 */
export const createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, itemsPrice, taxPrice, shippingPrice, totalPrice, guestInfo } =
      req.body

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "No order items" })
    }

    if (!shippingAddress?.fullName || !shippingAddress?.address || !shippingAddress?.phone) {
      return res.status(400).json({ message: "Shipping name, address and phone are required" })
    }

    // Guests must leave an email — it's the only way to send the confirmation
    // and the only handle they have on the order afterwards.
    const guest = !req.user
    if (guest && !guestInfo?.email) {
      return res.status(400).json({ message: "An email address is required to place an order as a guest" })
    }

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
      user: req.user?._id || null,
      guestInfo: guest
        ? {
            name: guestInfo.name || shippingAddress.fullName,
            email: guestInfo.email,
            phone: guestInfo.phone || shippingAddress.phone,
          }
        : undefined,
      orderItems: orderItems.map((item) => ({
        product: item.product,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        selectedSize: item.selectedSize || null,
        selectedColor: item.selectedColor || null,
      })),
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

    // Only account holders have a server-side cart to empty; a guest's lives in
    // their browser and is cleared by the checkout page.
    if (!guest) {
      await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] })
    }

    // Confirmation email — to the account, or to the address the guest gave us.
    try {
      const recipient = guest ? createdOrder.guestInfo.email : req.user.email
      const recipientName = guest ? createdOrder.guestInfo.name : req.user.name

      const emailResult = await sendOrderConfirmation(recipient, recipientName, createdOrder)
      if (!emailResult.success) {
        console.error("Failed to send order confirmation email:", emailResult.error)
      }
    } catch (emailError) {
      console.error("Error sending order confirmation email:", emailError)
      // Don't fail the order creation if email fails
    }

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

    // `order.user` is null on a guest order, so this can't dereference it
    // unconditionally the way it used to — that threw a 500 instead of a 403.
    const isOwner = order.user && order.user._id.toString() === req.user._id.toString()
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json(order)
  } catch (error) {
    console.error("Get order error:", error)
    res.status(500).json({ message: "Server error fetching order" })
  }
}

/**
 * Guest order lookup.
 *
 * A guest has no session to prove the order is theirs, so the phone number on
 * the shipping address stands in as the shared secret — they have the order id
 * from the confirmation page and email, and knowing both is good enough for an
 * order that's already been placed. Deliberately not exposed for account orders:
 * those go through `GET /:id` behind `auth`.
 */
export const lookupGuestOrder = async (req, res) => {
  try {
    const { orderId, phone } = req.body

    if (!orderId || !phone) {
      return res.status(400).json({ message: "Order number and phone number are required" })
    }

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(404).json({ message: "No order found with those details" })
    }

    const order = await Order.findOne({ _id: orderId, user: null })

    // Compare on digits only — people type +880, leading zeros and spaces
    // inconsistently, and a mismatch here reads as "your order doesn't exist".
    const digits = (value) => String(value || "").replace(/\D/g, "")
    const given = digits(phone)

    if (!order || !given || !digits(order.shippingAddress?.phone).endsWith(given.slice(-9))) {
      // Same response either way, so this can't be used to test whether an
      // order id exists.
      return res.status(404).json({ message: "No order found with those details" })
    }

    res.json(order)
  } catch (error) {
    console.error("Guest order lookup error:", error)
    res.status(500).json({ message: "Server error looking up order" })
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

    // Check if user owns the order. Guest orders (`user: null`) can only be
    // cancelled by an admin — there's no session to prove ownership.
    const isOwner = order.user && order.user.toString() === req.user._id.toString()
    if (!isOwner && req.user.role !== "admin") {
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
