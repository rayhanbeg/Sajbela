import Product from "../models/Product.js"

// Get all products with filtering and pagination
export const getProducts = async (req, res) => {
  try {
    console.log("=== GET PRODUCTS API CALLED ===")
    console.log("Query parameters received:", req.query)

    const { category, search, page = 1, limit = 12, sort = "createdAt", color, price, minPrice, maxPrice } = req.query

    // Build the query object
    //
    // Retired products are hidden from the shop. `$ne: false` rather than
    // `true` so the documents written before the field existed still show.
    // createOrder already refuses to sell an inactive product ("… is no
    // longer available"), so without this the shop listed items that threw an
    // error at checkout. Admin listing is a separate handler below.
    const query = { isActive: { $ne: false } }

    console.log("Building query...")

    // Category filter - FIXED with case-insensitive matching
    if (category && category.trim() !== "" && category !== "all") {
      query.category = { $regex: new RegExp(`^${category.trim()}$`, "i") }
      console.log("✅ Category filter applied:", query.category)
    } else {
      console.log("❌ No category filter applied")
    }

    /*
     * Search and colour each need an $or. Assigning both to `query.$or`
     * meant the second one silently overwrote the first — searching "gold
     * bangle" and then filtering by colour dropped the search term entirely.
     * Collect them and combine under $and so both apply.
     */
    const orConditions = []

    // Search filter
    if (search && search.trim() !== "") {
      orConditions.push({
        $or: [
          { name: { $regex: search.trim(), $options: "i" } },
          { description: { $regex: search.trim(), $options: "i" } },
          { tags: { $in: [new RegExp(search.trim(), "i")] } },
        ],
      })
      console.log("✅ Search filter applied:", search.trim())
    }

    // Color filter
    if (color && color.trim() !== "") {
      orConditions.push({
        $or: [
          { "colors.name": { $regex: new RegExp(color.trim(), "i") } },
          { color: { $regex: new RegExp(color.trim(), "i") } },
        ],
      })
      console.log("✅ Color filter applied:", color.trim())
    }

    if (orConditions.length > 0) {
      query.$and = orConditions
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

/*
 * Admin catalogue listing.
 *
 * The admin product page used to dispatch the shopper's `fetchProducts` with
 * `limit: 1000`, then search, filter, sort and paginate the whole catalogue in
 * the browser. Two problems with that: it wrote 1000 products into the same
 * Redux slice the storefront reads, so opening the admin list and going back
 * to the shop showed an unpaginated wall of products; and it never saw retired
 * ones, because the shop query filters them out — leaving no way to un-retire
 * a product from the UI.
 *
 * This is the same filtering, done in Mongo, including inactive products.
 */
export const getAdminProducts = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." })
    }

    const { page = 1, limit = 20, search, category, sort = "newest", status } = req.query

    const query = {}

    if (category && category !== "all") {
      query.category = String(category).toLowerCase()
    }

    if (status === "active") query.isActive = { $ne: false }
    if (status === "retired") query.isActive = false

    if (search && search.trim()) {
      const term = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      query.$or = [
        { name: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
        { tags: { $in: [new RegExp(term, "i")] } },
      ]
    }

    const SORTS = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      "name-asc": { name: 1 },
      "name-desc": { name: -1 },
      "price-low": { price: 1 },
      "price-high": { price: -1 },
      "stock-low": { stock: 1 },
    }

    const pageNum = Math.max(Number.parseInt(page) || 1, 1)
    const limitNum = Math.max(Number.parseInt(limit) || 20, 1)

    const [products, total, categoryCounts] = await Promise.all([
      Product.find(query)
        .sort(SORTS[sort] || SORTS.newest)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query),
      // Counts for the category tabs, unaffected by the current category
      // filter — otherwise selecting "Earrings" showed "Earrings (12)" and
      // zero for everything else.
      Product.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
    ])

    res.json({
      products,
      categoryCounts: categoryCounts.reduce((acc, row) => ({ ...acc, [row._id]: row.count }), {}),
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        total,
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
    })
  } catch (error) {
    console.error("Get admin products error:", error)
    res.status(500).json({ message: "Server error fetching products" })
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
    const products = await Product.find({ featured: true, isActive: { $ne: false } }).sort({ rating: -1 }).limit(8)
    res.json(products)
  } catch (error) {
    console.error("Get featured products error:", error)
    res.status(500).json({ message: "Server error fetching featured products" })
  }
}

// Get new arrivals
export const getNewArrivals = async (req, res) => {
  try {
    const products = await Product.find({ isNewArrival: true, isActive: { $ne: false } })
      .sort({ createdAt: -1 })
      .limit(8)
    res.json(products)
  } catch (error) {
    console.error("Get new arrivals error:", error)
    res.status(500).json({ message: "Server error fetching new arrivals" })
  }
}

// Get combo products
export const getCombos = async (req, res) => {
  try {
    const products = await Product.find({ isCombo: true, isActive: { $ne: false } }).sort({ createdAt: -1 }).limit(6)
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
