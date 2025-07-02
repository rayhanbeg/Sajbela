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

  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Address form state - always visible, no buttons
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    address: "",
    district: "",
    thana: "",
    phone: "",
  })
  const [addressErrors, setAddressErrors] = useState({})
  const [addressLoaded, setAddressLoaded] = useState(false)

  // Bangladesh districts for dropdown
  const bangladeshDistricts = [
    "Bagerhat",
    "Bandarban",
    "Barguna",
    "Barishal",
    "Bhola",
    "Bogura",
    "Brahmanbaria",
    "Chandpur",
    "Chattogram",
    "Chuadanga",
    "Cox's Bazar",
    "Cumilla",
    "Dhaka",
    "Dinajpur",
    "Faridpur",
    "Feni",
    "Gaibandha",
    "Gazipur",
    "Gopalganj",
    "Habiganj",
    "Jamalpur",
    "Jashore",
    "Jhalokati",
    "Jhenaidah",
    "Joypurhat",
    "Khagrachhari",
    "Khulna",
    "Kishoreganj",
    "Kurigram",
    "Kushtia",
    "Lakshmipur",
    "Lalmonirhat",
    "Madaripur",
    "Magura",
    "Manikganj",
    "Meherpur",
    "Moulvibazar",
    "Munshiganj",
    "Mymensingh",
    "Naogaon",
    "Narail",
    "Narayanganj",
    "Narsingdi",
    "Natore",
    "Netrokona",
    "Nilphamari",
    "Noakhali",
    "Pabna",
    "Panchagarh",
    "Patuakhali",
    "Pirojpur",
    "Rajbari",
    "Rajshahi",
    "Rangamati",
    "Rangpur",
    "Satkhira",
    "Shariatpur",
    "Sherpur",
    "Sirajganj",
    "Sunamganj",
    "Sylhet",
    "Tangail",
    "Thakurgaon",
  ].sort()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/login")
      return
    }

    if (!items || items.length === 0) {
      navigate("/products")
      return
    }

    // Load default address if available
    loadDefaultAddress()
  }, [isAuthenticated, items, navigate])

  const loadDefaultAddress = async () => {
    try {
      const response = await addressesAPI.getAll()
      const addresses = response.data || []
      const defaultAddress = addresses.find((addr) => addr.isDefault) || addresses[0]

      if (defaultAddress) {
        setAddressForm({
          fullName: defaultAddress.fullName || "",
          address: defaultAddress.address || "",
          district: defaultAddress.district || "",
          thana: defaultAddress.thana || "",
          phone: defaultAddress.phone || "",
        })
      }
      setAddressLoaded(true)
    } catch (error) {
      console.error("Error loading default address:", error)
      setAddressLoaded(true)
    }
  }

  const validateAddressForm = () => {
    const errors = {}

    if (!addressForm.fullName.trim()) {
      errors.fullName = "Full name is required"
    }

    if (!addressForm.phone.trim()) {
      errors.phone = "Phone number is required"
    } else if (!/^01[3-9]\d{8}$/.test(addressForm.phone.replace(/\s+/g, ""))) {
      errors.phone = "Please enter a valid Bangladeshi phone number"
    }

    if (!addressForm.address.trim()) {
      errors.address = "Address is required"
    }

    if (!addressForm.district.trim()) {
      errors.district = "District is required"
    }

    if (!addressForm.thana.trim()) {
      errors.thana = "Thana/Upazila is required"
    }

    setAddressErrors(errors)
    return Object.keys(errors).length === 0
  }

  const saveAddressAsDefault = async () => {
    try {
      // Save the address to user's account as default
      const addressData = {
        fullName: addressForm.fullName,
        address: addressForm.address,
        district: addressForm.district,
        thana: addressForm.thana,
        phone: addressForm.phone,
        country: "Bangladesh",
        isDefault: true,
      }

      await addressesAPI.create(addressData)
    } catch (error) {
      console.error("Error saving address:", error)
      // Don't block order if address saving fails
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

  const calculateShippingCost = (subtotal, district) => {
    if (subtotal >= 2000) return 0 // Free shipping for orders above 2000 taka

    if (district) {
      const districtLower = district.toLowerCase()
      const isDhaka = districtLower === "dhaka"
      return isDhaka ? 60 : 120 // 60 for Dhaka, 100 for outside Dhaka
    }

    return 120 // Default to outside Dhaka
  }

  const subtotal = calculateSubtotal()
  const shippingCost = calculateShippingCost(subtotal, addressForm.district)
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
    if (!validateAddressForm()) {
      setError("Please fill in all required address fields correctly")
      return
    }

    if (!paymentMethod) {
      setError("Please select a payment method")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Save address as default for future orders
      await saveAddressAsDefault()

      const orderItems = items.map((item) => {
        const product = item.product || item
        const selectedColor = item.selectedColor || item.color || null
        const selectedSize = item.selectedSize || item.size || null

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

      const shippingAddress = {
        fullName: addressForm.fullName,
        address: addressForm.address,
        district: addressForm.district,
        thana: addressForm.thana,
        country: "Bangladesh",
        phone: addressForm.phone,
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

      const response = await ordersAPI.create(orderData)

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

  const getShippingLocation = () => {
    if (addressForm.district) {
      const district = addressForm.district.toLowerCase()
      return district === "dhaka" ? "Inside Dhaka" : "Outside Dhaka"
    }
    return "Outside Dhaka"
  }

  const handleBackToCart = () => {
    // Use replace to avoid redirect loops
    navigate("/cart", { replace: true })
  }

  if (cartLoading || !addressLoaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md h-fit">
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
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
            onClick={handleBackToCart}
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
            {/* Delivery Address - Direct Input Fields Only */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-6">
                <MapPin className="h-5 w-5 text-pink-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Delivery Address</h2>
              </div>

              {/* Address Form - Always Visible, No Buttons */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.fullName}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, fullName: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-pink-500 focus:border-pink-500 ${
                        addressErrors.fullName ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter your full name"
                    />
                    {addressErrors.fullName && <p className="text-red-500 text-xs mt-1">{addressErrors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-pink-500 focus:border-pink-500 ${
                        addressErrors.phone ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="01XXXXXXXXX"
                    />
                    {addressErrors.phone && <p className="text-red-500 text-xs mt-1">{addressErrors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={addressForm.address}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, address: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-pink-500 focus:border-pink-500 ${
                      addressErrors.address ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="House/Flat no, Road no, Area name..."
                  />
                  {addressErrors.address && <p className="text-red-500 text-xs mt-1">{addressErrors.address}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      District <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={addressForm.district}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, district: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-pink-500 focus:border-pink-500 ${
                        addressErrors.district ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select District</option>
                      {bangladeshDistricts.map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                    {addressErrors.district && <p className="text-red-500 text-xs mt-1">{addressErrors.district}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thana/Upazila <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.thana}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, thana: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-pink-500 focus:border-pink-500 ${
                        addressErrors.thana ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter thana/upazila"
                    />
                    {addressErrors.thana && <p className="text-red-500 text-xs mt-1">{addressErrors.thana}</p>}
                  </div>
                </div>
              </div>
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

                <div className="border rounded-lg p-4 opacity-50 cursor-not-allowed">
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
                      src={
                        product.images?.[0]?.url || product.image || item.image || "/placeholder.svg?height=48&width=48"
                      }
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
                <span className="text-gray-600">Shipping ({getShippingLocation()})</span>
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
              disabled={loading}
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