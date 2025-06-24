"use client"

import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Link } from "react-router-dom"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import {
  updateQuantity,
  removeFromCart,
  clearCart,
  fetchCart,
  updateCartItemAsync,
  removeFromCartAsync,
  clearCartAsync,
} from "../lib/store/cartSlice"
import api from "../lib/api"

const CartPage = () => {
  const dispatch = useDispatch()
  const { items, total, totalAmount, loading } = useSelector((state) => state.cart)
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  // State for user's primary address
  const [userAddress, setUserAddress] = useState(null)
  const [addressLoading, setAddressLoading] = useState(false)

  // Load cart and user address on component mount
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart())
      fetchUserAddress()
    }
  }, [dispatch, isAuthenticated])

  // Fetch user's primary address
  const fetchUserAddress = async () => {
    try {
      setAddressLoading(true)
      const response = await api.get("/addresses")

      // Check if response has data and it's an array
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        const addresses = response.data.data
        // Get the first address or primary address
        const primaryAddress = addresses.find((addr) => addr.isPrimary) || addresses[0]
        setUserAddress(primaryAddress)
      } else {
        console.log("No addresses found or invalid response format")
        setUserAddress(null)
      }
    } catch (error) {
      console.error("Failed to fetch user address:", error)
      setUserAddress(null)
    } finally {
      setAddressLoading(false)
    }
  }

  const handleQuantityChange = async (item, newQuantity) => {
    try {
      if (isAuthenticated) {
        if (newQuantity <= 0) {
          await dispatch(removeFromCartAsync(item._id)).unwrap()
        } else {
          await dispatch(updateCartItemAsync({ itemId: item._id, quantity: newQuantity })).unwrap()
        }
      } else {
        if (newQuantity <= 0) {
          dispatch(removeFromCart(item._id))
        } else {
          dispatch(updateQuantity({ id: item._id, quantity: newQuantity }))
        }
      }
    } catch (error) {
      console.error("Failed to update quantity:", error)
      alert("Failed to update quantity. Please try again.")
    }
  }

  const handleRemoveItem = async (item) => {
    try {
      if (isAuthenticated) {
        await dispatch(removeFromCartAsync(item._id)).unwrap()
      } else {
        dispatch(removeFromCart(item._id))
      }
    } catch (error) {
      console.error("Failed to remove item:", error)
      alert("Failed to remove item. Please try again.")
    }
  }

  const handleClearCart = async () => {
    try {
      if (window.confirm("Are you sure you want to clear your cart?")) {
        if (isAuthenticated) {
          await dispatch(clearCartAsync()).unwrap()
        } else {
          dispatch(clearCart())
        }
      }
    } catch (error) {
      console.error("Failed to clear cart:", error)
      alert("Failed to clear cart. Please try again.")
    }
  }

  // Enhanced image URL function to handle both database and localStorage cart items
  const getImageUrl = (item) => {
    // For database cart items (item has product field)
    if (item.product) {
      if (item.product.images && item.product.images.length > 0) {
        return item.product.images[0].url || "/placeholder.svg"
      }
      return item.product.image || "/placeholder.svg"
    }

    // For localStorage cart items (item is the product itself)
    if (item.images && item.images.length > 0) {
      return item.images[0].url || "/placeholder.svg"
    }
    return item.image || "/placeholder.svg"
  }

  // Enhanced function to get product name
  const getProductName = (item) => {
    return item.product?.name || item.name || "Unknown Product"
  }

  // Enhanced function to get product price
  const getProductPrice = (item) => {
    return item.price || item.product?.price || 0
  }

  const calculateShippingCost = () => {
    const currentTotal = totalAmount || total || 0
    if (currentTotal >= 2000) return 0 // Free shipping for orders above 2000 taka

    // If user has address, use their district
    if (userAddress && userAddress.district) {
      const district = userAddress.district.toLowerCase().trim()
      console.log("User district:", district) // Debug log

      // Check if district is Dhaka (exact match or contains dhaka)
      const isDhaka =
        district === "dhaka" || district === "dhaka district" || district.includes("dhaka") || district === "ঢাকা"

      console.log("Is Dhaka:", isDhaka) // Debug log
      return isDhaka ? 60 : 100
    }

    // Default to outside Dhaka if no address
    return 100
  }

  const getShippingLocation = () => {
    if (userAddress && userAddress.district) {
      const district = userAddress.district.toLowerCase().trim()

      // Check if district is Dhaka (exact match or contains dhaka)
      const isDhaka =
        district === "dhaka" || district === "dhaka district" || district.includes("dhaka") || district === "ঢাকা"

      return isDhaka ? "Inside Dhaka" : "Outside Dhaka"
    }
    return "Outside Dhaka"
  }

  // Add this useEffect after the existing useEffects for debugging
  useEffect(() => {
    if (userAddress) {
      console.log("Current user address:", userAddress)
      console.log("District:", userAddress.district)
      console.log("Calculated shipping cost:", calculateShippingCost())
    }
  }, [userAddress])

  const shippingCost = calculateShippingCost()
  const currentTotal = totalAmount || total || 0
  const finalTotal = currentTotal + shippingCost

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items Skeleton */}
            <div className="lg:col-span-2 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-8 h-6 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                      <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary Skeleton */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-3 mb-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-12 bg-gray-200 rounded animate-pulse mb-3"></div>
                <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Add some products to get started!</p>
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <button
            onClick={handleClearCart}
            className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
            disabled={loading}
          >
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item._id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center space-x-4">
                  <img
                    src={getImageUrl(item) || "/placeholder.svg"}
                    alt={getProductName(item)}
                    className="w-20 h-20 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = "/placeholder.svg"
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{getProductName(item)}</h3>
                    <p className="text-gray-600">৳{getProductPrice(item)}</p>
                    {item.selectedSize && <p className="text-sm text-gray-500">Size: {item.selectedSize}</p>}
                    {item.selectedColor && <p className="text-sm text-gray-500">Color: {item.selectedColor}</p>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleQuantityChange(item, item.quantity - 1)}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                      disabled={loading}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item, item.quantity + 1)}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                      disabled={loading}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">৳{getProductPrice(item) * item.quantity}</p>
                    <button
                      onClick={() => handleRemoveItem(item)}
                      className="text-red-600 hover:text-red-700 mt-1 disabled:opacity-50"
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-md sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>

              {/* Shipping Information */}
              {isAuthenticated && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Shipping to:</span>
                    {addressLoading ? (
                      <div className="animate-pulse h-4 w-20 bg-gray-300 rounded"></div>
                    ) : userAddress ? (
                      <span className="text-sm text-gray-600">
                        {userAddress.district}, {userAddress.thana}
                      </span>
                    ) : (
                      <Link to="/account" className="text-sm text-pink-600 hover:text-pink-700">
                        Add Address
                      </Link>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Dhaka: ৳60 | Outside Dhaka: ৳100 | Free shipping on orders ৳2000+
                  </p>
                </div>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">৳{currentTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping ({getShippingLocation()})</span>
                  <span className="font-medium">{shippingCost === 0 ? "Free" : `৳${shippingCost}`}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-lg font-semibold">৳{finalTotal}</span>
                  </div>
                </div>
              </div>

              {currentTotal >= 2000 && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">🎉 You qualify for free shipping!</p>
                </div>
              )}

              {currentTotal < 2000 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">💡 Add ৳{2000 - currentTotal} more to get free shipping!</p>
                </div>
              )}

              {!isAuthenticated && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    💡{" "}
                    <Link to="/login" className="underline">
                      Login
                    </Link>{" "}
                    to see accurate shipping costs based on your address
                  </p>
                </div>
              )}

              <Link
                to="/checkout"
                className="w-full bg-pink-600 text-white py-3 px-4 rounded-lg hover:bg-pink-700 transition-colors text-center block font-medium"
              >
                Proceed to Checkout
              </Link>

              <Link
                to="/products"
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors text-center block font-medium mt-3"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage
