import Product from "../models/Product.js"

// Get all products with filtering and pagination
export const getProducts = async (req, res) => {
  try {
    console.log("=== GET PRODUCTS API CALLED ===")
    console.log("Query parameters received:", req.query)

    const { category, search, page = 1, limit = 12, sort = "createdAt", color, price, minPrice, maxPrice } = req.query

    // Build the query object
    const query = {}

    console.log("Building query...")

    // Category filter - FIXED with case-insensitive matching
    if (category && category.trim() !== "" && category !== "all") {
      query.category = { $regex: new RegExp(`^${category.trim()}$`, "i") }
      console.log("✅ Category filter applied:", query.category)
    } else {
      console.log("❌ No category filter applied")
    }

    // Search filter
    if (search && search.trim() !== "") {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
        { tags: { $in: [new RegExp(search.trim(), "i")] } },
      ]
      console.log("✅ Search filter applied:", query.$or)
    }

    // Color filter
    if (color && color.trim() !== "") {
      query.$or = [
        { "colors.name": { $regex: new RegExp(color.trim(), "i") } },
        { color: { $regex: new RegExp(color.trim(), "i") } },
      ]
      console.log("✅ Color filter applied:", query.$or)
    }

    // Price range filter
    if (minPrice || maxPrice || price) {
      query.price = {}

      if (price && price.includes("-")) {
        const [min, max] = price.split("-").map(Number)
        if (min) query.price.$gte = min
        if (max && max !== 999999) query.price.$lte = max
        console.log("✅ Price range filter (from price param):", query.price)
      } else {
        if (minPrice) query.price.$gte = Number(minPrice)
        if (maxPrice) query.price.$lte = Number(maxPrice)
        console.log("✅ Price range filter (from min/max params):", query.price)
      }
    }

    console.log("Final query object:", JSON.stringify(query, null, 2))

    // Build sort options
    const sortOptions = {}
    switch (sort) {
      case "price-low":
        sortOptions.price = 1
        break
      case "price-high":
        sortOptions.price = -1
        break
      case "rating":
        sortOptions.rating = -1
        break
      case "newest":
        sortOptions.createdAt = -1
        break
      case "oldest":
        sortOptions.createdAt = 1
        break
      case "name-asc":
        sortOptions.name = 1
        break
      case "name-desc":
        sortOptions.name = -1
        break
      default:
        sortOptions.createdAt = -1
    }

    console.log("Sort options:", sortOptions)

    // Calculate pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)
    const limitNum = Number.parseInt(limit)

    console.log("Pagination:", { page, skip, limit: limitNum })

    // Execute the query
    console.log("Executing database query...")
    const products = await Product.find(query).sort(sortOptions).skip(skip).limit(limitNum).lean()

    console.log(`✅ Found ${products.length} products`)

    // Log sample products for debugging
    if (products.length > 0) {
      console.log("Sample products:")
      products.slice(0, 3).forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} (Category: ${product.category})`)
      })
    }

    // Get total count
    const total = await Product.countDocuments(query)
    console.log(`✅ Total products matching query: ${total}`)

    const totalPages = Math.ceil(total / limitNum)

    const response = {
      success: true,
      products,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages,
        total,
        hasNext: skip + limitNum < total,
        hasPrev: Number.parseInt(page) > 1,
      },
    }

    console.log("=== RESPONSE SENT ===")
    console.log("Response summary:", {
      productsCount: products.length,
      total,
      currentPage: response.pagination.currentPage,
      totalPages: response.pagination.totalPages,
    })

    res.json(response)
  } catch (error) {
    console.error("❌ Get products error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching products",
      error: error.message,
    })
  }
}

// Get single product
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("createdBy", "name")

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json(product)
  } catch (error) {
    console.error("Get product error:", error)
    res.status(500).json({ message: "Server error fetching product" })
  }
}

// Get featured products
export const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ featured: true }).sort({ rating: -1 }).limit(8)
    res.json(products)
  } catch (error) {
    console.error("Get featured products error:", error)
    res.status(500).json({ message: "Server error fetching featured products" })
  }
}

// Get new arrivals
export const getNewArrivals = async (req, res) => {
  try {
    const products = await Product.find({ isNewArrival: true }).sort({ createdAt: -1 }).limit(8)
    res.json(products)
  } catch (error) {
    console.error("Get new arrivals error:", error)
    res.status(500).json({ message: "Server error fetching new arrivals" })
  }
}

// Get combo products
export const getCombos = async (req, res) => {
  try {
    const products = await Product.find({ isCombo: true }).sort({ createdAt: -1 }).limit(6)
    res.json(products)
  } catch (error) {
    console.error("Get combos error:", error)
    res.status(500).json({ message: "Server error fetching combos" })
  }
}

// Create product (admin only)
export const createProduct = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." })
    }

    const productData = {
      ...req.body,
      createdBy: req.userId,
    }

    const product = new Product(productData)
    await product.save()

    res.status(201).json({
      message: "Product created successfully",
      product,
    })
  } catch (error) {
    console.error("Create product error:", error)
    res.status(500).json({ message: "Server error creating product" })
  }
}

// Update product (admin only)
export const updateProduct = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." })
    }

    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    Object.assign(product, req.body)
    await product.save()

    res.json({
      message: "Product updated successfully",
      product,
    })
  } catch (error) {
    console.error("Update product error:", error)
    res.status(500).json({ message: "Server error updating product" })
  }
}

// Delete product (admin only)
export const deleteProduct = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." })
    }

    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    await Product.findByIdAndDelete(req.params.id)

    res.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Delete product error:", error)
    res.status(500).json({ message: "Server error deleting product" })
  }
}
