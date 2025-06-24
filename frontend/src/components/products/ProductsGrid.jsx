import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { fetchProducts } from "../../lib/store/productSlice"
import { addToCartAsync } from "../../lib/store/cartSlice"
import { formatPrice } from "../../lib/utils"
import Pagination from "./Pagination"

const ProductsGrid = ({ searchParams }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { products, loading, pagination } = useSelector((state) => state.products)
  const { loading: cartLoading } = useSelector((state) => state.cart)
  const { user, isAuthenticated } = useSelector((state) => state.auth)

  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState("newest")

  useEffect(() => {
    const params = {
      ...searchParams,
      page: currentPage,
      sort: sortBy,
      limit: 12,
    }

    // Remove empty params
    Object.keys(params).forEach((key) => {
      if (params[key] === "" || params[key] === null) {
        delete params[key]
      }
    })

    dispatch(fetchProducts(params))
  }, [dispatch, searchParams, currentPage, sortBy])

  const handleAddToCart = async (product, e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      const currentPath = window.location.pathname
      navigate(`/auth/login?returnTo=${encodeURIComponent(currentPath)}`)
      return
    }

    // For bangles or products with colors/sizes, redirect to product detail page
    if (
      product.category === "bangles" ||
      (product.colors && product.colors.length > 0) ||
      (product.sizes && product.sizes.length > 0)
    ) {
      navigate(`/products/${product._id}`)
      return
    }

    // For simple products, add directly to cart
    try {
      await dispatch(
        addToCartAsync({
          productId: product._id,
          quantity: 1,
        }),
      ).unwrap()
    } catch (error) {
      console.error("Failed to add to cart:", error)
    }
  }

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

  const getButtonText = (product) => {
    if (!isAvailable(product)) return "Not Available"
    if (product.category === "bangles") return "Select Size"
    if (product.colors && product.colors.length > 0) return "Select Options"
    return "Add to Cart"
  }

  if (loading) {
    return (
      <div>
        {/* Sort and Filter Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
        </div>

        {/* Products Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="aspect-square bg-gray-200 animate-pulse"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                <div className="flex items-center justify-between">
                  <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Sort and Filter Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">
          {pagination?.total || 0} products found
          {searchParams.search && ` for "${searchParams.search}"`}
        </p>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
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

      {/* Products Grid - New Arrivals Style */}
      {products.length === 0 ? (
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
          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <div
              key={product._id}
              className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              onClick={() => navigate(`/products/${product._id}`)}
            >
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={getImageUrl(product) || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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

                {/* Wishlist Button */}
                <div className="absolute top-2 right-2">
                  <button className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors">❤️</button>
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

              {/* Product Info */}
              <div className="p-3 md:p-4">
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors line-clamp-2">
                  {product.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center mb-2">
                  <div className="flex items-center text-sm">{renderStars(product.rating || 0)}</div>
                  <span className="text-xs text-gray-500 ml-2">({product.numReviews || 0})</span>
                </div>

                {/* Price and Add to Cart */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-pink-600">{formatPrice(product.price)}</span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-sm text-gray-500 line-through">{formatPrice(product.originalPrice)}</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={cartLoading || !isAvailable(product)}
                    className="bg-pink-600 text-white px-3 py-2 rounded-lg hover:bg-pink-700 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cartLoading ? "Adding..." : getButtonText(product)}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8">
          <Pagination currentPage={currentPage} totalPages={pagination.totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  )
}

export default ProductsGrid
