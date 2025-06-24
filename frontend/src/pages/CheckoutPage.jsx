import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { Truck, CreditCard, MapPin, Package, ArrowLeft } from "lucide-react"
import { addressesAPI, ordersAPI } from "../lib/api"
import { clearCartAsync } from "../lib/store/cartSlice"
import { formatPrice } from "../lib/utils"

const CheckoutPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { items, totalAmount, loading: cartLoading } = useSelector((state) => state.cart)
  const { isAuthenticated } = useSelector((state) => state.auth)

  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/login")
      return
    }

    if (!items || items.length === 0) {
      navigate("/cart")
      return
    }

    fetchAddresses()
  }, [isAuthenticated, items, navigate])

  const fetchAddresses = async () => {
    try {
      const response = await addressesAPI.getAll()
      setAddresses(response.data)
      // Auto-select default address
      const defaultAddress = response.data.find((addr) => addr.isDefault)
      if (defaultAddress) {
        setSelectedAddress(defaultAddress)
      }
    } catch (error) {
      console.error("Error fetching addresses:", error)
    }
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const product = item.product || item
      const price = product.price || item.price || 0
      const quantity = item.quantity || 1
      return sum + price * quantity
    }, 0)
  }

  const calculateShippingCost = (subtotal, address) => {
    if (subtotal >= 2000) return 0 // Free shipping for orders above 2000 taka

    if (address && address.district) {
      const district = address.district.toLowerCase()
      const isDhaka = district === "dhaka"
      return isDhaka ? 60 : 100 // 60 for Dhaka, 100 for outside Dhaka
    }

    return 100 // Default to outside Dhaka
  }

  const subtotal = calculateSubtotal()
  const shippingCost = calculateShippingCost(subtotal, selectedAddress)
  const total = subtotal + shippingCost

  const formatSizeDisplay = (size, product) => {
    if (!size) return null

    // If product has sizes array, find the matching size with measurement
    if (product?.sizes && Array.isArray(product.sizes)) {
      const sizeObj = product.sizes.find((s) => s.size === size)
      if (sizeObj && sizeObj.measurement) {
        return `${size} – ${sizeObj.measurement}`
      }
    }

    // Fallback to default measurements
    const defaultMeasurements = {
      S: "2.4/24",
      M: "2.6/26",
      L: "2.8/28",
      XL: "2.10/30",
    }

    return `${size} – ${defaultMeasurements[size] || size}`
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setError("Please select a delivery address")
      return
    }

    if (!paymentMethod) {
      setError("Please select a payment method")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("Cart items before order:", items)

      const orderItems = items.map((item) => {
        const product = item.product || item
        console.log("Processing cart item:", item)
        console.log("Item selectedColor:", item.selectedColor)
        console.log("Item selectedSize:", item.selectedSize)

        // Extract all possible color and size values
        const selectedColor = item.selectedColor || item.color || null
        const selectedSize = item.selectedSize || item.size || null

        console.log("Final selectedColor:", selectedColor)
        console.log("Final selectedSize:", selectedSize)

        return {
          product: product._id || item.productId,
          name: product.name || item.name,
          image: product.images?.[0]?.url || product.image || item.image,
          price: product.price || item.price,
          quantity: item.quantity,
          selectedSize: selectedSize,
          selectedColor: selectedColor,
        }
      })

      console.log("Order items to send:", orderItems)

      // Fix address structure to match backend expectations
      const shippingAddress = {
        fullName: selectedAddress.fullName,
        address: selectedAddress.address,
        district: selectedAddress.district, // Use district instead of city
        thana: selectedAddress.thana, // Use thana instead of postalCode
        country: selectedAddress.country || "Bangladesh",
        phone: selectedAddress.phone,
      }

      const orderData = {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice: subtotal,
        taxPrice: 0,
        shippingPrice: shippingCost,
        totalPrice: total,
      }

      console.log("Complete order data:", orderData)

      const response = await ordersAPI.create(orderData)
      console.log("Order created successfully:", response.data)

      // Clear cart after successful order
      await dispatch(clearCartAsync())

      // Generate order number for display
      const orderNumber = `SJ${Date.now().toString().slice(-6)}`

      // Redirect to success page with order data
      navigate("/order-success", {
        state: {
          orderId: response.data._id,
          orderNumber: orderNumber,
          orderData: {
            ...orderData,
            totalPrice: total,
            paymentMethod: paymentMethod,
          },
        },
      })
    } catch (error) {
      console.error("Order creation error:", error)
      setError(error.response?.data?.message || "Failed to place order. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getShippingLocation = (address) => {
    if (address && address.district) {
      const district = address.district.toLowerCase()
      return district === "dhaka" ? "Inside Dhaka" : "Outside Dhaka"
    }
    return "Outside Dhaka"
  }

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left side skeleton */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-3">
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
            {/* Right side skeleton */}
            <div className="bg-white p-6 rounded-lg shadow-md h-fit">
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-4">Add some products to your cart to proceed with checkout.</p>
            <button
              onClick={() => navigate("/products")}
              className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate("/cart")}
            className="flex items-center text-pink-600 hover:text-pink-700 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <MapPin className="h-5 w-5 text-pink-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Delivery Address</h2>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">No saved addresses found.</p>
                  <button
                    onClick={() => navigate("/account?tab=addresses")}
                    className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    Add Address
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <div
                      key={address._id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedAddress?._id === address._id
                          ? "border-pink-600 bg-pink-50 ring-2 ring-pink-200"
                          : "border-gray-300 hover:border-pink-300"
                      }`}
                      onClick={() => setSelectedAddress(address)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <h3 className="font-semibold text-gray-900">{address.fullName}</h3>
                            {address.isDefault && (
                              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm">{address.address}</p>
                          <p className="text-gray-600 text-sm">
                            {address.thana}, {address.district}
                          </p>
                          <p className="text-gray-600 text-sm">{address.phone}</p>
                        </div>
                        <input
                          type="radio"
                          checked={selectedAddress?._id === address._id}
                          onChange={() => setSelectedAddress(address)}
                          className="mt-1 text-pink-600 focus:ring-pink-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <CreditCard className="h-5 w-5 text-pink-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Payment Method</h2>
              </div>

              <div className="space-y-3">
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    paymentMethod === "cash_on_delivery"
                      ? "border-pink-600 bg-pink-50 ring-2 ring-pink-200"
                      : "border-gray-300 hover:border-pink-300"
                  }`}
                  onClick={() => setPaymentMethod("cash_on_delivery")}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Cash on Delivery</h3>
                      <p className="text-sm text-gray-600">Pay when you receive your order</p>
                    </div>
                    <input
                      type="radio"
                      checked={paymentMethod === "cash_on_delivery"}
                      onChange={() => setPaymentMethod("cash_on_delivery")}
                      className="text-pink-600 focus:ring-pink-500"
                    />
                  </div>
                </div>

                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-colors opacity-50 ${
                    paymentMethod === "bkash"
                      ? "border-pink-600 bg-pink-50 ring-2 ring-pink-200"
                      : "border-gray-300 hover:border-pink-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">bKash</h3>
                      <p className="text-sm text-gray-600">Coming Soon</p>
                    </div>
                    <input type="radio" disabled className="text-pink-600 focus:ring-pink-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white p-6 rounded-lg shadow-md h-fit">
            <div className="flex items-center mb-4">
              <Package className="h-5 w-5 text-pink-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
            </div>

            <div className="space-y-4 mb-6">
              {items.map((item, index) => {
                const product = item.product || item
                const selectedSize = item.selectedSize || item.size
                const selectedColor = item.selectedColor || item.color

                return (
                  <div key={index} className="flex items-center space-x-3">
                    <img
                      src={product.images?.[0]?.url || product.image || item.image || "/placeholder.svg"}
                      alt={product.name || item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{product.name || item.name}</h3>
                      <div className="text-xs text-gray-600 space-y-1">
                        {selectedSize && (
                          <p>
                            Size: <span className="font-medium">{formatSizeDisplay(selectedSize, product)}</span>
                          </p>
                        )}
                        {selectedColor && (
                          <p>
                            Color: <span className="font-medium">{selectedColor}</span>
                          </p>
                        )}
                        <p>Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatPrice((product.price || item.price) * item.quantity)}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping ({getShippingLocation(selectedAddress)})</span>
                <span className="font-medium">{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</span>
              </div>
              {shippingCost === 0 && <p className="text-xs text-green-600">🎉 Free shipping on orders above ৳2000!</p>}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading || !selectedAddress}
              className="w-full mt-6 bg-pink-600 text-white py-3 px-4 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Placing Order...
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4 mr-2" />
                  Place Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
