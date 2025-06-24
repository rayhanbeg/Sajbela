import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Link, useNavigate } from "react-router-dom"
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, Eye, Edit, Trash2, Tag } from "lucide-react"
import { fetchProducts, deleteProduct } from "../../lib/store/productSlice"
import { ordersAPI } from "../../lib/api"

const AdminDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const { products, loading: productsLoading } = useSelector((state) => state.products)

  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  })

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      navigate("/auth/login")
      return
    }

    dispatch(fetchProducts({}))
    fetchOrders()
  }, [dispatch, isAuthenticated, user, navigate])

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true)
      const response = await ordersAPI.getAll({ limit: 5 })
      setOrders(response.data.orders)
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setOrdersLoading(false)
    }
  }

  useEffect(() => {
    if (products.length > 0 || orders.length > 0) {
      const totalRevenue = orders
        .filter((order) => order.status !== "cancelled")
        .reduce((sum, order) => sum + order.totalPrice, 0)
      const pendingOrders = orders.filter((order) => order.status === "pending").length

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue,
        pendingOrders,
      })
    }
  }, [products, orders])

  const recentOrders = orders.slice(0, 5)
  const recentProducts = products.slice(0, 5)

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await dispatch(deleteProduct(productId)).unwrap()
        // Refresh products list
        dispatch(fetchProducts({}))
      } catch (error) {
        console.error("Error deleting product:", error)
        alert("Failed to delete product")
      }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">৳{stats.totalRevenue}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
              <Link to="/admin/orders" className="text-pink-600 hover:text-pink-700 text-sm font-medium">
                View All
              </Link>
            </div>

            {ordersLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-16 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No orders found</p>
                ) : (
                  recentOrders.map((order) => (
                    <div
                      key={order._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">#{order._id?.slice(-6)}</p>
                        <p className="text-sm text-gray-600">৳{order.totalPrice}</p>
                        {order.orderItems?.some((item) => item.selectedSize) && (
                          <p className="text-xs text-gray-500">
                            Size: {formatSizeDisplay(order.orderItems[0].selectedSize)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            order.status === "delivered"
                              ? "bg-green-100 text-green-800"
                              : order.status === "processing"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Recent Products */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Products</h2>
              <Link to="/admin/products" className="text-pink-600 hover:text-pink-700 text-sm font-medium">
                View All
              </Link>
            </div>

            {productsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg mr-3 animate-pulse"></div>
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {recentProducts.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No products found</p>
                ) : (
                  recentProducts.map((product) => (
                    <div
                      key={product._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center">
                        <img
                          src={product.images?.[0]?.url || "/placeholder.svg"}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg mr-3"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-600">৳{product.price}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          to={`/products/${product._id}`}
                          className="p-1 text-gray-600 hover:text-blue-600"
                          title="View Product"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/admin/products/${product._id}/edit`}
                          className="p-1 text-gray-600 hover:text-green-600"
                          title="Edit Product"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="p-1 text-gray-600 hover:text-red-600"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link
              to="/admin/products/new"
              className="bg-pink-600 text-white p-4 rounded-lg hover:bg-pink-700 transition-colors text-center"
            >
              <Package className="h-8 w-8 mx-auto mb-2" />
              <p className="font-medium">Add New Product</p>
            </Link>

            <Link
              to="/admin/orders"
              className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors text-center"
            >
              <ShoppingCart className="h-8 w-8 mx-auto mb-2" />
              <p className="font-medium">Manage Orders</p>
            </Link>

            <Link
              to="/admin/users"
              className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-center"
            >
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p className="font-medium">Manage Users</p>
            </Link>

            <Link
              to="/admin/categories"
              className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors text-center"
            >
              <Tag className="h-8 w-8 mx-auto mb-2" />
              <p className="font-medium">Manage Categories</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
