import { Link, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { addToCartAsync } from "../../lib/store/cartSlice"
import { formatPrice } from "../../lib/utils"
import { useState } from "react"

const ProductCard = ({ product }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector((state) => state.cart)
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const [isHovered, setIsHovered] = useState(false)

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      // Redirect to login with return path
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

  // Get the first image URL or use placeholder
  const getImageUrl = (index = 0) => {
    if (product.images && product.images.length > 0) {
      return product.images[index]?.url || product.images[0]?.url || "/placeholder.svg"
    }
    return product.image || "/placeholder.svg"
  }

  const hasMultipleImages = product.images && product.images.length > 1

  // Check if product is available
  const isAvailable = () => {
    if (product.category === "bangles" && product.sizes) {
      return product.sizes.some((size) => size.available && size.stock > 0)
    }
    if (product.colors && product.colors.length > 0) {
      return product.colors.some((color) => color.available && color.stock > 0)
    }
    return product.inStock && product.stock > 0
  }

  const getButtonText = () => {
    if (!isAvailable()) return "Not Available"
    if (product.category === "bangles") return "Select Size"
    if (product.colors && product.colors.length > 0) return "Select Options"
    return "Add to Cart"
  }

  return (
    <Link to={`/products/${product._id}`} className="group">
      <div className="card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div
          className="relative overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <img
            src={isHovered && hasMultipleImages ? getImageUrl(1) : getImageUrl(0)}
            alt={product.name}
            className="w-full h-64 object-cover group-hover:scale-105 transition-all duration-500 ease-in-out"
          />
          {hasMultipleImages && (
            <div className="absolute bottom-2 left-2">
              <div className="flex space-x-1">
                <div
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${!isHovered ? "bg-white" : "bg-white/50"}`}
                ></div>
                <div
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${isHovered ? "bg-white" : "bg-white/50"}`}
                ></div>
              </div>
            </div>
          )}
          <div className="absolute top-4 right-4">
            <button className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors">❤️</button>
          </div>
          {/* Availability Badge */}
          <div className="absolute top-4 left-4">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                isAvailable() ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {isAvailable() ? "Available" : "Not Available"}
            </span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center mb-2">
            <div className="flex items-center">{renderStars(product.rating || 0)}</div>
            <span className="text-sm text-gray-500 ml-2">({product.numReviews || 0})</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-pink-600">{formatPrice(product.price)}</span>
            <button
              onClick={handleAddToCart}
              disabled={loading || !isAvailable()}
              className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Adding..." : getButtonText()}
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ProductCard
