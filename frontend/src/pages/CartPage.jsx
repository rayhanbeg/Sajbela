"use client"

import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate, Link } from "react-router-dom"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import { addressesAPI } from "../lib/api"
import { formatPrice } from "../lib/utils"
import {
  updateQuantity,
  removeFromCart,
  clearCart,
  fetchCart,
  updateCartItemAsync,
  removeFromCartAsync,
  clearCartAsync,
} from "../lib/store/cartSlice"

const CartPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { items, totalAmount, loading: cartLoading } = useSelector((state) => state.cart)
  const { isAuthenticated } = useSelector((state) => state.auth)
  const [userAddress, setUserAddress] = useState(null)
  const [addressLoading, setAddressLoading] = useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  // Initialize cart data
  useEffect(() => {
    const loadCartData = async () => {
      if (isAuthenticated) {
        try {
          await dispatch(fetchCart()).unwrap()
          await fetchUserAddress()
        } catch (error) {
          console.error("Failed to load cart data:", error)
        }
      }
      setInitialLoadComplete(true)
    }

    if (!initialLoadComplete) {
      loadCartData()
    }
  }, [isAuthenticated, initialLoadComplete, dispatch])

  // Redirect if cart is empty after load
  useEffect(() => {
    if (initialLoadComplete && (!items || items.length === 0)) {
      navigate("/cart-empty")
    }
  }, [items, initialLoadComplete, navigate])

  const fetchUserAddress = async () => {
    try {
      setAddressLoading(true)
      const res = await addressesAPI.getAll()
      const addresses = res.data || []
      const primaryAddress = addresses.find((addr) => addr.isPrimary) || addresses[0]
      setUserAddress(primaryAddress)
    } catch (error) {
      console.error("Error fetching address:", error)
    } finally {
      setAddressLoading(false)
    }
  }

  const calculateSubtotal = () => {
    if (!items) return 0
    return items.reduce((sum, item) => {
      const product = item.product || item
      const price = product.price || item.price || 0
      const quantity = item.quantity || 1
      return sum + price * quantity
    }, 0)
  }

  const calculateShippingCost = (subtotal, address) => {
    if (subtotal >= 2000) return 0
    if (address?.district?.toLowerCase() === "dhaka") return 60
    return 100
  }

  const getShippingLocation = (address) => {
    if (address?.district?.toLowerCase() === "dhaka") return "Inside Dhaka"
    return "Outside Dhaka"
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

  const getImageUrl = (item) => {
    if (item.product) {
      if (item.product.images && item.product.images.length > 0) {
        return item.product.images[0].url || "/placeholder.svg"
      }
      return item.product.image || "/placeholder.svg"
    }

    if (item.images && item.images.length > 0) {
      return item.images[0].url || "/placeholder.svg"
    }
    return item.image || "/placeholder.svg"
  }

  const getProductName = (item) => {
    return item.product?.name || item.name || "Unknown Product"
  }

  const getProductPrice = (item) => {
    return item.price || item.product?.price || 0
  }

  const subtotal = calculateSubtotal()
  const shippingCost = calculateShippingCost(subtotal, userAddress)
  const finalTotal = subtotal + shippingCost

  if (cartLoading && !initialLoadComplete) {
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
            disabled={cartLoading}
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
                    src={getImageUrl(item)}
                    alt={getProductName(item)}
                    className="w-20 h-20 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = "/placeholder.svg"
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{getProductName(item)}</h3>
                    <p className="text-gray-600">{formatPrice(getProductPrice(item))}</p>
                    {item.selectedSize && <p className="text-sm text-gray-500">Size: {item.selectedSize}</p>}
                    {item.selectedColor && <p className="text-sm text-gray-500">Color: {item.selectedColor}</p>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleQuantityChange(item, item.quantity - 1)}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                      disabled={cartLoading}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item, item.quantity + 1)}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                      disabled={cartLoading}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatPrice(getProductPrice(item) * item.quantity)}
                    </p>
                    <button
                      onClick={() => handleRemoveItem(item)}
                      className="text-red-600 hover:text-red-700 mt-1 disabled:opacity-50"
                      disabled={cartLoading}
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
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping ({getShippingLocation(userAddress)})</span>
                  <span className="font-medium">{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</span>
                </div>
                {shippingCost === 0 ? (
                  <p className="text-xs text-green-600 mt-1">🎉 Free shipping on orders above ৳2000!</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    {userAddress?.district?.toLowerCase() === "dhaka"
                      ? "Shipping (Inside Dhaka): ৳60"
                      : "Shipping (Outside Dhaka): ৳100"}
                  </p>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-lg font-semibold">{formatPrice(finalTotal)}</span>
                  </div>
                </div>
              </div>

              {subtotal >= 2000 && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">🎉 You qualify for free shipping!</p>
                </div>
              )}

              {subtotal < 2000 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 Add {formatPrice(2000 - subtotal)} more to get free shipping!
                  </p>
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