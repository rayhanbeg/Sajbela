import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Star, ShoppingCart, Heart, ChevronDown } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { addToCartAsync } from "../lib/store/cartSlice"
import { fetchProductById, clearCurrentProduct } from "../lib/store/productSlice"
import { formatPrice } from "../lib/utils"
import ReviewsList from "../components/ReviewsList"

const ProductDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { currentProduct: product, loading, error } = useSelector((state) => state.products)
  const { loading: cartLoading } = useSelector((state) => state.cart)
  const { isAuthenticated } = useSelector((state) => state.auth)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [activeTab, setActiveTab] = useState("reviews")
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false)
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false)

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id))
    }

    return () => {
      dispatch(clearCurrentProduct())
    }
  }, [dispatch, id])

  useEffect(() => {
    // Reset states when product changes
    if (product) {
      setSelectedSize(null)
      setSelectedColor(null)
      setQuantity(1)
      setSelectedImage(0)
    }
  }, [product])

  useEffect(() => {
    // Check if user just logged in and has pending selections
    if (isAuthenticated && product) {
      const pendingSelection = localStorage.getItem("pendingProductSelection")
      if (pendingSelection) {
        try {
          const selections = JSON.parse(pendingSelection)

          // Only restore if it's for the current product
          if (selections.productId === product._id) {
            // Restore selections
            if (selections.selectedSize) {
              setSelectedSize(selections.selectedSize)
            }
            if (selections.selectedColor) {
              setSelectedColor(selections.selectedColor)
            }
            if (selections.quantity) {
              setQuantity(selections.quantity)
            }

            // Execute the pending action after a short delay to ensure state is updated
            setTimeout(async () => {
              try {
                if (selections.action === "addToCart") {
                  await dispatch(
                    addToCartAsync({
                      productId: product._id,
                      quantity: selections.quantity,
                      selectedSize: product.category === "bangles" ? selections.selectedSize?.size : undefined,
                      selectedColor: selections.selectedColor ? selections.selectedColor.name : undefined,
                    }),
                  ).unwrap()
                  alert("Product added to cart successfully!")
                } else if (selections.action === "buyNow") {
                  await dispatch(
                    addToCartAsync({
                      productId: product._id,
                      quantity: selections.quantity,
                      selectedSize: product.category === "bangles" ? selections.selectedSize?.size : undefined,
                      selectedColor: selections.selectedColor ? selections.selectedColor.name : undefined,
                    }),
                  ).unwrap()
                  navigate("/checkout")
                }
              } catch (error) {
                console.error("Failed to execute pending action:", error)
                alert(error || "Failed to process your selection")
              }
            }, 500)
          }

          // Clear the pending selection
          localStorage.removeItem("pendingProductSelection")
        } catch (error) {
          console.error("Error restoring pending selection:", error)
          localStorage.removeItem("pendingProductSelection")
        }
      }
    }
  }, [isAuthenticated, product, dispatch, navigate])

  const handleSizeSelect = (sizeOption) => {
    setSelectedSize(sizeOption)
    setQuantity(1) // Reset quantity when size changes
    setIsSizeDropdownOpen(false)
  }

  const handleColorSelect = (colorOption) => {
    setSelectedColor(colorOption)
    setQuantity(1) // Reset quantity when color changes
    setIsColorDropdownOpen(false)
  }

  const handleAddToCart = async () => {
    if (!product) return

    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store current selections before redirecting to login/register
      const selections = {
        productId: product._id,
        selectedSize: selectedSize,
        selectedColor: selectedColor,
        quantity: quantity,
        action: "addToCart",
      }
      localStorage.setItem("pendingProductSelection", JSON.stringify(selections))

      // Redirect to register page (which has login option) with return path
      const currentPath = window.location.pathname
      navigate(`/auth/register?returnTo=${encodeURIComponent(currentPath)}`)
      return
    }

    // For bangles, ensure a size is selected
    if (product.category === "bangles" && !selectedSize) {
      alert("Please select a size before adding to cart")
      return
    }

    // If product has colors, ensure a color is selected
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert("Please select a color before adding to cart")
      return
    }

    try {
      await dispatch(
        addToCartAsync({
          productId: product._id,
          quantity: quantity,
          selectedSize: product.category === "bangles" ? selectedSize.size : undefined,
          selectedColor: selectedColor ? selectedColor.name : undefined,
        }),
      ).unwrap()

      alert("Product added to cart successfully!")
    } catch (error) {
      console.error("Failed to add to cart:", error)
      alert(error || "Failed to add product to cart")
    }
  }

  const handleBuyNow = async () => {
    if (!product) return

    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store current selections before redirecting to login/register
      const selections = {
        productId: product._id,
        selectedSize: selectedSize,
        selectedColor: selectedColor,
        quantity: quantity,
        action: "buyNow",
      }
      localStorage.setItem("pendingProductSelection", JSON.stringify(selections))

      // Redirect to register page (which has login option) with return path
      const currentPath = window.location.pathname
      navigate(`/auth/register?returnTo=${encodeURIComponent(currentPath)}`)
      return
    }

    // For bangles, ensure a size is selected
    if (product.category === "bangles" && !selectedSize) {
      alert("Please select a size before proceeding")
      return
    }

    // If product has colors, ensure a color is selected
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert("Please select a color before proceeding")
      return
    }

    try {
      await dispatch(
        addToCartAsync({
          productId: product._id,
          quantity: quantity,
          selectedSize: product.category === "bangles" ? selectedSize.size : undefined,
          selectedColor: selectedColor ? selectedColor.name : undefined,
        }),
      ).unwrap()

      navigate("/checkout")
    } catch (error) {
      console.error("Failed to add to cart:", error)
      alert(error || "Failed to add product to cart")
    }
  }

  const handleQuantityChange = (change) => {
    const maxStock = getMaxStock()
    const newQuantity = quantity + change
    if (newQuantity >= 1 && newQuantity <= maxStock) {
      setQuantity(newQuantity)
    }
  }

  const getMaxStock = () => {
    if (product?.category === "bangles" && selectedSize) {
      return selectedSize.stock || 0
    }
    if (selectedColor) {
      return selectedColor.stock || 0
    }
    return product?.stock || 0
  }

  const getImageUrl = (index = 0) => {
    if (product?.images && product.images.length > 0) {
      return product.images[index]?.url || "/placeholder.svg"
    }
    return "/placeholder.svg"
  }

  const isInStock = () => {
    if (product?.category === "bangles" && selectedSize) {
      return selectedSize.available && selectedSize.stock > 0
    }
    if (selectedColor) {
      return selectedColor.available && selectedColor.stock > 0
    }
    return product?.inStock && product?.stock > 0
  }

  const getAvailabilityText = () => {
    // Don't show stock status before selection
    if (product?.category === "bangles" && !selectedSize) {
      return null // Don't show any status
    }
    if (product?.colors && product.colors.length > 0 && !selectedColor) {
      return null // Don't show any status
    }
    return isInStock() ? "Available" : "Out of Stock"
  }

  const getButtonText = (buttonType) => {
    if (cartLoading) {
      return buttonType === "add" ? "Adding..." : "Processing..."
    }

    if (!isAuthenticated) {
      return buttonType === "add" ? "Login to Add" : "Login to Buy"
    }

    // Check if selections are required
    if (product.category === "bangles" && !selectedSize) {
      return "Select Size"
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      return "Select Color"
    }

    // Check stock only after selections are made
    if (!isInStock()) {
      return "Out of Stock"
    }

    return buttonType === "add" ? "Add to Cart" : "Buy Now"
  }

  const isButtonDisabled = () => {
    if (cartLoading) return true

    // If selections are required but not made, disable
    if (product?.category === "bangles" && !selectedSize) return true
    if (product?.colors && product.colors.length > 0 && !selectedColor) return true

    // If selections are made, check stock
    if (selectedSize || selectedColor) {
      return !isInStock()
    }

    // For products without variants, check general stock
    return !product?.inStock || product?.stock <= 0
  }

  // Helper function to get color hex code or generate one from name
  const getColorHex = (colorOption) => {
    if (colorOption.hexCode && colorOption.hexCode.match(/^#[0-9A-F]{6}$/i)) {
      return colorOption.hexCode
    }

    // Generate a color based on the color name
    const colorMap = {
      "multi color": "#FF6B6B", // Add this line for multi color
      red: "#FF0000",
      blue: "#0000FF",
      green: "#008000",
      yellow: "#FFFF00",
      orange: "#FFA500",
      purple: "#800080",
      pink: "#FFC0CB",
      black: "#000000",
      white: "#FFFFFF",
      gray: "#808080",
      grey: "#808080",
      brown: "#A52A2A",
      navy: "#000080",
      maroon: "#800000",
      olive: "#808000",
      lime: "#00FF00",
      aqua: "#00FFFF",
      teal: "#008080",
      silver: "#C0C0C0",
      gold: "#FFD700",
    }

    const colorName = colorOption.name.toLowerCase()
    return colorMap[colorName] || "#CCCCCC" // Default to light gray
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="grid grid-cols-3 gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Product</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => dispatch(fetchProductById(id))}
              className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600">The product you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    )
  }

  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const tabs = [
    { id: "reviews", label: `Reviews (${product?.numReviews || 0})` },
    { id: "description", label: "Description" },
    { id: "specifications", label: "Specifications" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
              <img
                src={getImageUrl(selectedImage) || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-contain"
                style={{
                  maxWidth: "100%",
                  maxHeight: "500px",
                  width: "auto",
                  height: "auto",
                  display: "block",
                  margin: "0 auto",
                }}
                onError={(e) => {
                  e.target.src = "/placeholder.svg"
                }}
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square overflow-hidden rounded border-2 transition-colors bg-gray-100 ${
                      selectedImage === index ? "border-pink-600" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={image.url || "/placeholder.svg"}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-contain"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100px",
                        width: "auto",
                        height: "auto",
                        display: "block",
                        margin: "0 auto",
                      }}
                      onError={(e) => {
                        e.target.src = "/placeholder.svg"
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(product.rating || 0) ? "text-yellow-400 fill-current" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 ml-2">({product?.numReviews || 0} reviews)</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl md:text-3xl font-bold text-gray-900">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <>
                  <span className="text-lg md:text-xl text-gray-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                    -{discountPercentage}% OFF
                  </span>
                </>
              )}
            </div>

            <p className="text-gray-600">{product.description}</p>

            {/* Availability Status - Only show after selection */}
            {getAvailabilityText() && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <span
                  className={`text-sm font-medium ${
                    getAvailabilityText() === "Available" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {getAvailabilityText()}
                </span>
              </div>
            )}

            {/* Color Selection Dropdown */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Select Color</h3>
                <div className="relative">
                  <button
                    onClick={() => setIsColorDropdownOpen(!isColorDropdownOpen)}
                    className={`w-full p-3 md:p-4 border rounded-lg text-left flex items-center justify-between transition-colors ${
                      selectedColor ? "border-pink-600 bg-pink-50" : "border-gray-300 hover:border-gray-400 bg-white"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {selectedColor ? (
                        <>
                          <div
                            className="w-6 h-6 rounded-full border-2 border-gray-300 shadow-sm"
                            style={{
                              background:
                                selectedColor.name.toLowerCase() === "multi color"
                                  ? "linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7)"
                                  : getColorHex(selectedColor),
                              borderColor: getColorHex(selectedColor) === "#FFFFFF" ? "#E5E7EB" : "transparent",
                            }}
                          />
                          <span className="font-medium text-gray-900">{selectedColor.name}</span>
                          <span className="text-sm text-green-600">
                            {selectedColor.stock > 0 ? "Available" : "Out of Stock"}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-500">Choose a color</span>
                      )}
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-400 transition-transform ${
                        isColorDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isColorDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {product.colors
                        .filter((colorOption) => colorOption.available)
                        .map((colorOption, index) => (
                          <button
                            key={`${colorOption.name}-${index}`}
                            onClick={() => handleColorSelect(colorOption)}
                            disabled={colorOption.stock <= 0}
                            className={`w-full p-2 md:p-3 text-left hover:bg-gray-50 flex items-center justify-between transition-colors ${
                              colorOption.stock <= 0 ? "opacity-50 cursor-not-allowed" : ""
                            } ${selectedColor && selectedColor.name === colorOption.name ? "bg-pink-50" : ""}`}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-6 h-6 rounded-full border-2 border-gray-300 shadow-sm"
                                style={{
                                  background:
                                    colorOption.name.toLowerCase() === "multi color"
                                      ? "linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7)"
                                      : getColorHex(colorOption),
                                  borderColor: getColorHex(colorOption) === "#FFFFFF" ? "#E5E7EB" : "transparent",
                                }}
                              />
                              <span className="font-medium text-gray-900">{colorOption.name}</span>
                            </div>
                            <span
                              className={`text-sm font-medium ${
                                colorOption.stock > 0 ? "text-green-600" : "text-red-500"
                              }`}
                            >
                              {colorOption.stock > 0 ? "Available" : "Out of Stock"}
                            </span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                {!selectedColor && (
                  <p className="text-sm text-orange-600 bg-orange-50 p-2 md:p-3 rounded-lg border border-orange-200">
                    ⚠️ Please select a color to continue
                  </p>
                )}
              </div>
            )}

            {/* Size Selection Dropdown for Bangles */}
            {product.category === "bangles" && product.sizes && product.sizes.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Select Size</h3>
                <div className="relative">
                  <button
                    onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
                    className={`w-full p-3 md:p-4 border rounded-lg text-left flex items-center justify-between transition-colors ${
                      selectedSize ? "border-pink-600 bg-pink-50" : "border-gray-300 hover:border-gray-400 bg-white"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {selectedSize ? (
                        <>
                          <span className="font-semibold text-gray-900">{selectedSize.size}</span>
                          {selectedSize.measurement && (
                            <span className="text-sm text-gray-600">– {selectedSize.measurement}</span>
                          )}
                          <span className="text-sm text-green-600">
                            {selectedSize.stock > 0 ? "Available" : "Out of Stock"}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-500">Choose a size</span>
                      )}
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-400 transition-transform ${isSizeDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isSizeDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {product.sizes
                        .filter((sizeOption) => sizeOption.size && sizeOption.size.trim() !== "")
                        .map((sizeOption, index) => (
                          <button
                            key={`${sizeOption.size}-${index}`}
                            onClick={() => handleSizeSelect(sizeOption)}
                            disabled={!sizeOption.available || sizeOption.stock <= 0}
                            className={`w-full p-2 md:p-3 text-left hover:bg-gray-50 flex items-center justify-between transition-colors ${
                              !sizeOption.available || sizeOption.stock <= 0 ? "opacity-50 cursor-not-allowed" : ""
                            } ${selectedSize && selectedSize.size === sizeOption.size ? "bg-pink-50" : ""}`}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="font-semibold text-gray-900">{sizeOption.size}</span>
                              {sizeOption.measurement && (
                                <span className="text-sm text-gray-600">– {sizeOption.measurement}</span>
                              )}
                            </div>
                            <span
                              className={`text-sm font-medium ${
                                sizeOption.available && sizeOption.stock > 0 ? "text-green-600" : "text-red-500"
                              }`}
                            >
                              {sizeOption.available && sizeOption.stock > 0 ? "Available" : "Out of Stock"}
                            </span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                {product.sizes.filter((s) => s.size && s.size.trim() !== "").length === 0 && (
                  <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded">No sizes available for this product.</p>
                )}
                {!selectedSize && product.sizes.filter((s) => s.size && s.size.trim() !== "").length > 0 && (
                  <p className="text-sm text-orange-600 bg-orange-50 p-2 md:p-3 rounded-lg border border-orange-200">
                    ⚠️ Please select a size to continue
                  </p>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            {(selectedColor || selectedSize || (!product.colors?.length && product.category !== "bangles")) && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Quantity</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <span className="text-lg md:text-xl font-semibold min-w-[2rem] md:min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= getMaxStock()}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-500 ml-2 md:ml-4">Available</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isButtonDisabled()}
                className="flex-1 bg-pink-600 text-white py-2 md:py-3 px-4 md:px-6 rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {getButtonText("add")}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isButtonDisabled()}
                className="flex-1 bg-gray-900 text-white py-2 md:py-3 px-4 md:px-6 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {getButtonText("buy")}
              </button>

              <button className="p-2 md:p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Heart className="h-5 w-5" />
              </button>
            </div>

            {/* Combo Items Display */}
            {product.isCombo && product.comboItems && product.comboItems.length > 0 && (
              <div className="bg-pink-50 p-3 md:p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">This Combo Includes:</h3>
                <ul className="space-y-1">
                  {product.comboItems.map((item, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      • <span className="font-medium">{item.name}</span>
                      {item.description && <span className="text-gray-600"> - {item.description}</span>}
                    </li>
                  ))}
                </ul>
                {product.comboDiscount > 0 && (
                  <p className="text-sm text-pink-600 font-medium mt-2">
                    Save {product.comboDiscount}% when you buy this combo!
                  </p>
                )}
              </div>
            )}

            {/* Delivery Information */}
            <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Delivery Information</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Free delivery on orders above ৳2000</li>
                <li>• Cash on Delivery available</li>
                <li>• Delivery within 2-3 business days</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="border-t border-gray-200 pt-6 md:pt-8">
          <div className="flex flex-wrap gap-4 md:gap-8 mb-6 md:mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-pink-600 text-pink-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-[200px]">
            {activeTab === "reviews" && <ReviewsList productId={product._id} />}

            {activeTab === "description" && (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {activeTab === "specifications" && (
              <div>
                {product.specifications ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(product.specifications).map(
                      ([key, value]) =>
                        value && (
                          <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-600 capitalize">{key}:</span>
                            <span className="text-gray-900 font-medium">{value}</span>
                          </div>
                        ),
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No specifications available for this product.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailPage
