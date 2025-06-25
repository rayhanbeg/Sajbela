
import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { fetchProducts } from "../lib/store/productSlice"
import { formatPrice } from "../lib/utils"
import ProductFilters from "../components/products/ProductFilters"

const ProductsPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { products, loading, pagination } = useSelector((state) => state.products)

  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState("newest")
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    search: "",
    color: "",
    price: "",
  })
  const [isInitialized, setIsInitialized] = useState(false)

  // Parse URL parameters and set filters - This runs first
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const newFilters = {
      category: searchParams.get("category") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      search: searchParams.get("search") || "",
      color: searchParams.get("color") || "",
      price: searchParams.get("price") || "",
    }

    setFilters(newFilters)
    setCurrentPage(Number.parseInt(searchParams.get("page")) || 1)
    setSortBy(searchParams.get("sort") || "newest")
    setIsInitialized(true)
  }, [location.search])

  // Fetch products when filters change - This runs after filters are set
  useEffect(() => {
    // Don't fetch until filters are initialized from URL
    if (!isInitialized) return

    const params = {
      page: currentPage,
      sort: sortBy,
      limit: 12,
    }

    // Add all filters to params
    if (filters.category && filters.category.trim() !== "") {
      params.category = filters.category.trim()
    }

    if (filters.search && filters.search.trim() !== "") {
      params.search = filters.search.trim()
    }

    if (filters.color && filters.color.trim() !== "") {
      params.color = filters.color.trim()
    }

    if (filters.minPrice && filters.minPrice.trim() !== "") {
      params.minPrice = filters.minPrice.trim()
    }

    if (filters.maxPrice && filters.maxPrice.trim() !== "") {
      params.maxPrice = filters.maxPrice.trim()
    }

    // Handle price range filter
    if (filters.price && filters.price.trim() !== "") {
      const [min, max] = filters.price.split("-")
      if (min) params.minPrice = min
      if (max && max !== "999999") params.maxPrice = max
    }

    dispatch(fetchProducts(params))
  }, [dispatch, filters, currentPage, sortBy, isInitialized])

  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="text-yellow-400">
          ★
        </span>,
      )
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="text-yellow-400">
          ☆
        </span>,
      )
    }

    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-300">
          ★
        </span>,
      )
    }

    return stars
  }

  const getImageUrl = (product, index = 0) => {
    if (product.images && product.images.length > 0) {
      return product.images[index]?.url || product.images[0]?.url || "/placeholder.svg"
    }
    return product.image || "/placeholder.svg"
  }

  const isAvailable = (product) => {
    if (product.category === "bangles" && product.sizes) {
      return product.sizes.some((size) => size.available && size.stock > 0)
    }
    if (product.colors && product.colors.length > 0) {
      return product.colors.some((color) => color.available && color.stock > 0)
    }
    return product.inStock && product.stock > 0
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSortChange = (sort) => {
    setSortBy(sort)
    setCurrentPage(1)
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const getCategoryDisplayName = (category) => {
    const categoryMap = {
      bangles: "Bangles",
      earrings: "Earrings",
      cosmetics: "Cosmetics",
      necklaces: "Necklaces",
      rings: "Rings",
      alna: "Alna",
      combo: "Combo",
    }
    return categoryMap[category?.toLowerCase()] || category
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <ProductFilters filters={filters} onFilterChange={handleFilterChange} />
          </div>

          {/* Products Section */}
          <div className="lg:w-3/4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {filters.category ? `${getCategoryDisplayName(filters.category)} Collection` : "All Products"}
                </h1>
                <p className="text-gray-600">
                  {pagination?.total || 0} products found
                  {filters.search && ` for "${filters.search}"`}
                  {filters.category && ` in ${getCategoryDisplayName(filters.category)}`}
                </p>
              </div>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="aspect-square bg-gray-200 animate-pulse"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                      <div className="flex items-center justify-between">
                        <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Products */}
            {!loading && products.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4.5"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">
                  {filters.category
                    ? `No products found in ${getCategoryDisplayName(filters.category)} category.`
                    : "Try adjusting your search or filter criteria."}
                </p>
              </div>
            )}

            {/* Products Grid - Uniform Card Size with Reduced Spacing */}
            {!loading && products.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                  <div
                    key={product._id}
                    className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                    onClick={() => navigate(`/products/${product._id}`)}
                  >
                    {/* Product Image - Fixed aspect ratio */}
                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={getImageUrl(product) || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = "/placeholder.svg"
                        }}
                      />

                      {/* Availability Badge */}
                      <div className="absolute top-2 left-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            isAvailable(product) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {isAvailable(product) ? "Available" : "Not Available"}
                        </span>
                      </div>

                      {/* Discount Badge */}
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="absolute bottom-2 left-2">
                          <span className="bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">
                            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Info - Reduced spacing */}
                    <div className="p-3 md:p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-pink-600 transition-colors text-sm md:text-base line-clamp-2 leading-tight">
                        {product.name}
                      </h3>

                      {/* Rating - Reduced margin */}
                      <div className="flex items-center mb-1">
                        <div className="flex items-center text-sm">{renderStars(product.rating || 0)}</div>
                        <span className="text-xs text-gray-500 ml-2">({product.numReviews || 0})</span>
                      </div>

                      {/* Price - Reduced margin */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm md:text-base font-bold text-pink-600">
                            {formatPrice(product.price)}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-xs text-gray-500 line-through">
                              {formatPrice(product.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {[...Array(pagination.totalPages)].map((_, index) => {
                    const page = index + 1
                    if (
                      page === 1 ||
                      page === pagination.totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            currentPage === page
                              ? "bg-pink-600 text-white"
                              : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    } else if (page === currentPage - 3 || page === currentPage + 3) {
                      return (
                        <span key={page} className="px-2 py-2 text-sm text-gray-500">
                          ...
                        </span>
                      )
                    }
                    return null
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductsPage
