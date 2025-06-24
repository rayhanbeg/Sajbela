import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Link } from "react-router-dom"
import { User, MapPin, Package, LogOut, Plus, Edit, Trash2, Star, Eye } from "lucide-react"
import { logout, updateUserProfile } from "../lib/store/authSlice"
import { fetchMyOrders, cancelOrder } from "../lib/store/orderSlice"
import { addressesAPI, reviewsAPI } from "../lib/api"
import AddressForm from "../components/AddressForm"
import ReviewForm from "../components/ReviewForm"
import { formatPrice, formatDate } from "../lib/utils"

const AccountPage = () => {
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const { orders, loading: ordersLoading } = useSelector((state) => state.orders)

  const [activeTab, setActiveTab] = useState("profile")
  const [addresses, setAddresses] = useState([])
  const [reviewableProducts, setReviewableProducts] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewingProduct, setReviewingProduct] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [addressesLoading, setAddressesLoading] = useState(false)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [phoneError, setPhoneError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      })
    }
  }, [user])

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses()
      fetchReviewableProducts()
      // Fetch user orders
      dispatch(fetchMyOrders())
    }
  }, [isAuthenticated, dispatch])

  const fetchAddresses = async () => {
    try {
      setAddressesLoading(true)
      const response = await addressesAPI.getAll()
      setAddresses(response.data)
    } catch (error) {
      console.error("Error fetching addresses:", error)
    } finally {
      setAddressesLoading(false)
    }
  }

  const fetchReviewableProducts = async () => {
    try {
      setReviewsLoading(true)
      const response = await reviewsAPI.getReviewableProducts()
      setReviewableProducts(response.data)
    } catch (error) {
      console.error("Error fetching reviewable products:", error)
    } finally {
      setReviewsLoading(false)
    }
  }

  const handleLogout = () => {
    dispatch(logout())
  }

  // Validate Bangladeshi phone number
  const validateBangladeshiPhone = (phone) => {
    const cleanPhone = phone.replace(/[\s-]/g, "")
    const phoneRegex = /^01[3-9]\d{8}$/
    return phoneRegex.test(cleanPhone)
  }

  // Handle phone input - only allow numbers, no auto-formatting
  const handlePhoneChange = (e) => {
    let value = e.target.value

    // Remove all non-numeric characters
    value = value.replace(/\D/g, "")

    // Limit to 11 digits
    if (value.length > 11) {
      value = value.slice(0, 11)
    }

    setFormData({
      ...formData,
      phone: value,
    })

    // Real-time validation - show error if invalid
    if (value.length > 0) {
      if (!validateBangladeshiPhone(value)) {
        setPhoneError("Number is not valid")
      } else {
        setPhoneError("")
      }
    } else {
      setPhoneError("")
    }
  }

  const handleUpdateProfile = (e) => {
    e.preventDefault()

    // Validate phone number before updating
    if (formData.phone && !validateBangladeshiPhone(formData.phone)) {
      setPhoneError("Number is not valid")
      return
    }

    dispatch(updateUserProfile(formData))
    setIsEditing(false)
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleAddAddress = () => {
    setEditingAddress(null)
    setShowAddressForm(true)
  }

  const handleEditAddress = (address) => {
    setEditingAddress(address)
    setShowAddressForm(true)
  }

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      try {
        await addressesAPI.delete(addressId)
        fetchAddresses()
      } catch (error) {
        console.error("Error deleting address:", error)
        alert("Failed to delete address")
      }
    }
  }

  const handleSetDefaultAddress = async (addressId) => {
    try {
      await addressesAPI.setDefault(addressId)
      fetchAddresses()
    } catch (error) {
      console.error("Error setting default address:", error)
      alert("Failed to set default address")
    }
  }

  const handleAddressSaved = () => {
    fetchAddresses()
  }

  const handleCancelOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      try {
        await dispatch(cancelOrder(orderId)).unwrap()
        alert("Order cancelled successfully!")
        // Refresh orders
        dispatch(fetchMyOrders())
      } catch (error) {
        alert(error || "Failed to cancel order")
      }
    }
  }

  const handleWriteReview = (product) => {
    setReviewingProduct(product)
    setShowReviewForm(true)
  }

  const handleReviewSubmitted = () => {
    fetchReviewableProducts()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100"
      case "processing":
        return "text-blue-600 bg-blue-100"
      case "shipped":
        return "text-purple-600 bg-purple-100"
      case "delivered":
        return "text-green-600 bg-green-100"
      case "cancelled":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const formatSizeDisplay = (size) => {
    if (!size) return null

    const sizeFormats = {
      S: "S  – 2.4/24",
      M: "M – 2.6/26",
      L: "L  – 2.8/28",
      XL: "XL– 2.10/30",
    }

    return sizeFormats[size] || size
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h1>
            <p className="text-gray-600 mb-8">You need to be logged in to access your account.</p>
            <Link
              to="/auth/login"
              className="inline-flex items-center px-6 py-3 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "addresses", label: "Addresses", icon: MapPin },
    { id: "orders", label: "Orders", icon: Package },
    { id: "reviews", label: "Reviews", icon: Star },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="h-10 w-10 text-pink-600" />
                </div>
                <h3 className="font-semibold text-gray-900">{user?.name}</h3>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>

              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${
                      activeTab === tab.id ? "bg-pink-50 text-pink-600" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <tab.icon className="h-5 w-5 mr-3" />
                    {tab.label}
                    {tab.id === "reviews" && reviewableProducts.length > 0 && (
                      <span className="ml-auto bg-pink-600 text-white text-xs rounded-full px-2 py-1">
                        {reviewableProducts.length}
                      </span>
                    )}
                  </button>
                ))}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-left rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center px-4 py-2 text-pink-600 border border-pink-600 rounded-lg hover:bg-pink-50 transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {isEditing ? "Cancel" : "Edit"}
                    </button>
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                          <span className="text-xs text-gray-500 ml-1">(Must start with 01)</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                            phoneError ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-pink-500"
                          }`}
                          placeholder="01XXXXXXXXX"
                          maxLength="11"
                          inputMode="numeric"
                        />
                        {phoneError && <p className="text-sm text-red-600 mt-1">{phoneError}</p>}
                      </div>

                      <button
                        type="submit"
                        className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors"
                      >
                        Save Changes
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <p className="text-gray-900">{user?.name}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <p className="text-gray-900">{user?.email}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                        <p className="text-gray-900">{user?.phone || "Not provided"}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Addresses Tab */}
              {activeTab === "addresses" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Saved Addresses</h2>
                    <button
                      onClick={handleAddAddress}
                      className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Address
                    </button>
                  </div>

                  {addressesLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="border border-gray-200 rounded-lg p-4">
                          <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {addresses.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No addresses saved yet.</p>
                          <button onClick={handleAddAddress} className="mt-2 text-pink-600 hover:text-pink-700">
                            Add your first address
                          </button>
                        </div>
                      ) : (
                        addresses.map((address) => (
                          <div key={address._id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center mb-2">
                                  <h3 className="font-semibold text-gray-900">{address.fullName}</h3>
                                  {address.isDefault && (
                                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 mb-1">{address.address}</p>
                                <p className="text-gray-600 mb-1">
                                  {address.city}, {address.state} {address.postalCode}
                                </p>
                                <p className="text-gray-600">{address.phone}</p>
                                {!address.isDefault && (
                                  <button
                                    onClick={() => handleSetDefaultAddress(address._id)}
                                    className="mt-2 text-sm text-pink-600 hover:text-pink-700"
                                  >
                                    Set as default
                                  </button>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditAddress(address)}
                                  className="p-2 text-gray-600 hover:text-pink-600"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAddress(address._id)}
                                  className="p-2 text-gray-600 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === "orders" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Order History</h2>

                  {ordersLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="border border-gray-200 rounded-lg p-6">
                          <div className="animate-pulse">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-24"></div>
                              </div>
                              <div className="h-6 bg-gray-200 rounded w-20"></div>
                            </div>
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-12 h-12 bg-gray-200 rounded"></div>
                                <div className="flex-1">
                                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
                                <div className="h-4 bg-gray-200 rounded w-24"></div>
                              </div>
                              <div className="h-3 bg-gray-200 rounded w-20"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {!orders || orders.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No orders found.</p>
                          <Link to="/products" className="mt-2 inline-block text-pink-600 hover:text-pink-700">
                            Start shopping
                          </Link>
                        </div>
                      ) : (
                        orders.map((order) => (
                          <div key={order._id} className="border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-gray-900">Order #{order._id?.slice(-6)}</h3>
                                <p className="text-sm text-gray-600">Placed on {formatDate(order.createdAt)}</p>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span
                                  className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(order.status)}`}
                                >
                                  {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                                </span>
                                <button
                                  onClick={() => {
                                    setSelectedOrder(order)
                                    setShowOrderModal(true)
                                  }}
                                  className="text-pink-600 hover:text-pink-900 transition-colors"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2 mb-4">
                              {order.orderItems?.map((item, index) => {
                                // Check if this product can be reviewed
                                const canReview = order.status === "delivered"
                                const reviewableItem = reviewableProducts.find(
                                  (rp) => rp.orderId === order._id && rp.product._id === item.product,
                                )

                                return (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <img
                                        src={item.image || "/placeholder.svg"}
                                        alt={item.name}
                                        className="w-12 h-12 object-cover rounded"
                                      />
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                        <div className="text-xs text-gray-600 space-y-1">
                                          {item.selectedSize && (
                                            <p>
                                              Size:{" "}
                                              <span className="font-medium">
                                                {formatSizeDisplay(item.selectedSize)}
                                              </span>
                                            </p>
                                          )}
                                          {item.selectedColor && (
                                            <p>
                                              Color: <span className="font-medium">{item.selectedColor}</span>
                                            </p>
                                          )}
                                          <p>
                                            Qty: {item.quantity} × {formatPrice(item.price)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Review Button */}
                                    {canReview && reviewableItem && (
                                      <button
                                        onClick={() =>
                                          handleWriteReview({
                                            orderId: order._id,
                                            product: {
                                              _id: item.product,
                                              name: item.name,
                                              image: item.image,
                                              images: [{ url: item.image }],
                                            },
                                          })
                                        }
                                        className="flex items-center px-3 py-1 text-sm bg-pink-600 text-white rounded hover:bg-pink-700 transition-colors"
                                      >
                                        <Star className="h-3 w-3 mr-1" />
                                        Review
                                      </button>
                                    )}

                                    {canReview && !reviewableItem && (
                                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                        ✓ Reviewed
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600">{order.orderItems?.length} items</p>
                                <p className="font-semibold text-gray-900">Total: {formatPrice(order.totalPrice)}</p>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="text-sm text-gray-600">
                                  <p>
                                    Payment: {order.paymentMethod === "cash_on_delivery" ? "COD" : order.paymentMethod}
                                  </p>
                                </div>
                                {(order.status === "pending" || order.status === "processing") && (
                                  <button
                                    onClick={() => handleCancelOrder(order._id)}
                                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                  >
                                    Cancel Order
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === "reviews" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Write Reviews</h2>

                  {reviewsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gray-200 rounded animate-pulse"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2 mb-1 animate-pulse"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                            </div>
                            <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : reviewableProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">No products to review</p>
                      <p className="text-sm text-gray-400">Products will appear here after your orders are delivered</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-gray-600 mb-4">
                        Share your experience with products you've purchased. Your reviews help other customers make
                        informed decisions.
                      </p>

                      {reviewableProducts.map((item) => (
                        <div
                          key={`${item.orderId}-${item.product._id}`}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center space-x-4">
                            <img
                              src={item.product.images?.[0]?.url || item.product.image || "/placeholder.svg"}
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                              <p className="text-sm text-gray-600">Ordered on {formatDate(item.orderDate)}</p>
                              <p className="text-sm text-gray-600">
                                Qty: {item.quantity} × {formatPrice(item.price)}
                              </p>
                            </div>
                            <button
                              onClick={() => handleWriteReview(item)}
                              className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                            >
                              <Star className="h-4 w-4 mr-2" />
                              Write Review
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Address Form Modal */}
        {showAddressForm && (
          <AddressForm address={editingAddress} onClose={() => setShowAddressForm(false)} onSave={handleAddressSaved} />
        )}

        {/* Review Form Modal */}
        {showReviewForm && reviewingProduct && (
          <ReviewForm
            product={reviewingProduct.product}
            orderId={reviewingProduct.orderId}
            onClose={() => setShowReviewForm(false)}
            onReviewSubmitted={handleReviewSubmitted}
          />
        )}

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                  <button onClick={() => setShowOrderModal(false)} className="text-gray-400 hover:text-gray-600">
                    <Package className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Information</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Order ID:</span> #{selectedOrder._id.slice(-8)}
                      </p>
                      <p>
                        <span className="font-medium">Date:</span> {formatDate(selectedOrder.createdAt)}
                      </p>
                      <p>
                        <span className="font-medium">Status:</span>
                        <span
                          className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedOrder.status)}`}
                        >
                          {selectedOrder.status?.charAt(0).toUpperCase() + selectedOrder.status?.slice(1)}
                        </span>
                      </p>
                      <p>
                        <span className="font-medium">Payment Method:</span>{" "}
                        {selectedOrder.paymentMethod === "cash_on_delivery"
                          ? "Cash on Delivery"
                          : selectedOrder.paymentMethod}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Shipping Address</h3>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <p className="font-medium">{selectedOrder.shippingAddress?.fullName}</p>
                      <p>{selectedOrder.shippingAddress?.address}</p>
                      <p>
                        {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.postalCode}
                      </p>
                      <p>Phone: {selectedOrder.shippingAddress?.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.orderItems?.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="h-16 w-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <div className="space-y-1">
                            {item.selectedSize && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Size:</span> {formatSizeDisplay(item.selectedSize)}
                              </p>
                            )}
                            {item.selectedColor && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Color:</span> {item.selectedColor}
                              </p>
                            )}
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Quantity:</span> {item.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatPrice(item.price)}</p>
                          <p className="text-sm text-gray-600">Total: {formatPrice(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatPrice(selectedOrder.itemsPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-medium">{formatPrice(selectedOrder.shippingPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatPrice(selectedOrder.totalPrice)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AccountPage
