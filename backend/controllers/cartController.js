import Cart from "../models/Cart.js"
import Product from "../models/Product.js"

// Get user cart
export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: "items.product",
      select: "name price images category sizes colors stock",
    })

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] })
      await cart.save()
    }

    // Calculate totals
    const totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0)

    res.json({
      success: true,
      data: {
        _id: cart._id,
        items: cart.items,
        totalAmount,
        totalItems,
      },
    })
  } catch (error) {
    console.error("Get cart error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, selectedSize, selectedColor } = req.body

    console.log("Add to cart request:", { productId, quantity, selectedSize, selectedColor })

    // Validate product exists
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      })
    }

    // Check stock availability
    let availableStock = product.stock
    if (product.category === "bangles" && selectedSize) {
      const sizeData = product.sizes.find((s) => s.size === selectedSize)
      if (!sizeData || !sizeData.available) {
        return res.status(400).json({
          success: false,
          message: "Selected size is not available",
        })
      }
      availableStock = sizeData.stock
    } else if (product.colors && product.colors.length > 0 && selectedColor) {
      const colorData = product.colors.find((c) => c.name === selectedColor)
      if (!colorData || !colorData.available) {
        return res.status(400).json({
          success: false,
          message: "Selected color is not available",
        })
      }
      availableStock = colorData.stock
    }

    if (availableStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} items available in stock`,
      })
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user._id })
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] })
    }

    // Check if item already exists in cart (exact match including size and color)
    const existingItemIndex = cart.items.findIndex((item) => {
      const productMatch = item.product.toString() === productId
      const sizeMatch = item.selectedSize === selectedSize
      const colorMatch = item.selectedColor === selectedColor
      return productMatch && sizeMatch && colorMatch
    })

    if (existingItemIndex > -1) {
      // Update existing item
      const newQuantity = cart.items[existingItemIndex].quantity + quantity
      if (newQuantity > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more items. Only ${availableStock} available in stock`,
        })
      }
      cart.items[existingItemIndex].quantity = newQuantity
    } else {
      // Add new item - always save selectedColor and selectedSize
      const newItem = {
        product: productId,
        quantity,
        selectedSize: selectedSize || null,
        selectedColor: selectedColor || null,
        price: product.price,
      }

      console.log("Adding new cart item:", newItem)
      cart.items.push(newItem)
    }

    await cart.save()
    console.log("Cart saved successfully")

    // Populate and return updated cart
    await cart.populate({
      path: "items.product",
      select: "name price images category sizes colors stock",
    })

    console.log(
      "Cart items after save:",
      cart.items.map((item) => ({
        product: item.product.name,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
      })),
    )

    // Calculate totals
    const totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0)

    res.json({
      success: true,
      message: "Item added to cart",
      data: {
        _id: cart._id,
        items: cart.items,
        totalAmount,
        totalItems,
      },
    })
  } catch (error) {
    console.error("Add to cart error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// Update item quantity
export const updateCartItem = async (req, res) => {
  try {
    const { itemId, quantity } = req.body

    const cart = await Cart.findOne({ user: req.user._id })
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      })
    }

    const itemIndex = cart.items.findIndex((item) => item._id.toString() === itemId)
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      })
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.items.splice(itemIndex, 1)
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity
    }

    await cart.save()

    // Populate and return updated cart
    await cart.populate({
      path: "items.product",
      select: "name price images category sizes colors stock",
    })

    // Calculate totals
    const totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0)

    res.json({
      success: true,
      message: "Cart updated",
      data: {
        _id: cart._id,
        items: cart.items,
        totalAmount,
        totalItems,
      },
    })
  } catch (error) {
    console.error("Update cart error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params

    const cart = await Cart.findOne({ user: req.user._id })
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      })
    }

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId)
    await cart.save()

    // Populate and return updated cart
    await cart.populate({
      path: "items.product",
      select: "name price images category sizes colors stock",
    })

    // Calculate totals
    const totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0)

    res.json({
      success: true,
      message: "Item removed from cart",
      data: {
        _id: cart._id,
        items: cart.items,
        totalAmount,
        totalItems,
      },
    })
  } catch (error) {
    console.error("Remove from cart error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
    if (cart) {
      cart.items = []
      await cart.save()
    }

    res.json({
      success: true,
      message: "Cart cleared",
      data: {
        _id: cart?._id,
        items: [],
        totalAmount: 0,
        totalItems: 0,
      },
    })
  } catch (error) {
    console.error("Clear cart error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}
