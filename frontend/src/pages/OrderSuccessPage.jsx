import { useEffect } from "react"
import { useLocation, Link, useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { CheckCircle, Package, Clock, Home, User } from "lucide-react"
import { clearCart } from "../lib/store/cartSlice"

const OrderSuccessPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Get order data from navigation state or create fallback
  const orderState = location.state || {}
  const { orderId, orderNumber, orderData } = orderState

  // Generate fallback order number if not provided
  const displayOrderNumber = orderNumber || `SJ${Date.now().toString().slice(-6)}`

  // Clear cart when component mounts (after successful order)
  useEffect(() => {
    dispatch(clearCart())

    // If no order data is available, redirect to home after a delay
    if (!orderId && !orderData) {
      console.log("No order data found, redirecting to home...")
      const timer = setTimeout(() => {
        navigate("/")
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [dispatch, orderId, orderData, navigate])

  // If no order data, show a generic success message
  if (!orderId && !orderData) {
    return (
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-16">
        <div className="max-w-md mx-auto text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your order. You will be redirected to the homepage shortly.
          </p>

          <div className="space-y-3">
            <Link
              to="/"
              className="w-full bg-pink-600 text-white py-3 px-4 rounded-lg hover:bg-pink-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-16">
      <div className="max-w-md mx-auto text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
        <p className="text-gray-600 mb-6">Thank you for your order. We'll send you a confirmation email shortly.</p>

        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h2 className="font-semibold text-gray-900 mb-2">Order Details</h2>
          <p className="text-sm text-gray-600">
            Order Number: <span className="font-medium text-pink-600">{displayOrderNumber}</span>
          </p>
          {orderId && (
            <p className="text-sm text-gray-600">
              Order ID: <span className="font-medium">{orderId.slice(-8)}</span>
            </p>
          )}
          {orderData?.paymentMethod && (
            <p className="text-sm text-gray-600">
              Payment Method:{" "}
              <span className="font-medium">
                {orderData.paymentMethod === "cash_on_delivery" ? "Cash on Delivery" : "bKash"}
              </span>
            </p>
          )}
          {orderData?.totalPrice && (
            <p className="text-sm text-gray-600">
              Total Amount: <span className="font-medium text-green-600">৳{orderData.totalPrice}</span>
            </p>
          )}
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <Package className="h-4 w-4 text-pink-600" />
            <span>Your order is being prepared</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 text-pink-600" />
            <span>Estimated delivery: 2-3 business days</span>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            to="/products"
            className="w-full bg-pink-600 text-white py-3 px-4 rounded-lg hover:bg-pink-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Package className="h-4 w-4" />
            Continue Shopping
          </Link>
          <Link
            to="/account"
            className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <User className="h-4 w-4" />
            View My Orders
          </Link>
          <Link
            to="/"
            className="w-full border border-pink-300 text-pink-600 py-3 px-4 rounded-lg hover:bg-pink-50 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}

export default OrderSuccessPage
