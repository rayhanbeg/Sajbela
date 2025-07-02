import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Link, useNavigate } from "react-router-dom"
import { Search, Plus, Eye, Edit, Trash2, Filter, Package, Star, Sparkles, Gift } from "lucide-react"
import { fetchProducts, deleteProduct } from "../../lib/store/productSlice"

const AdminProducts = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const { products, loading: productsLoading } = useSelector((state) => state.products)

  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("createdAt")
  const [currentPage, setCurrentPage] = useState(1)
  const [filteredProducts, setFilteredProducts] = useState([])
  const itemsPerPage = 20

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      navigate("/auth/login")
      return
    }

    // Fetch all products for admin - set a high limit to get all products
    dispatch(fetchProducts({ limit: 1000, page: 1 }))
  }, [dispatch, isAuthenticated, user, navigate])

  useEffect(() => {
    let filtered = [...products]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((product) => product.category.toLowerCase() === categoryFilter.toLowerCase())
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "price":
          return a.price - b.price
        case "createdAt":
        default:
          return new Date(b.createdAt) - new Date(a.createdAt)
      }
    })

    setFilteredProducts(filtered)
    setCurrentPage(1)
  }, [products, searchTerm, categoryFilter, sortBy])

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await dispatch(deleteProduct(productId)).unwrap()
        // Refresh products after deletion
        dispatch(fetchProducts({ limit: 1000, page: 1 }))
      } catch (error) {
        console.error("Error deleting product:", error)
        alert("Failed to delete product")
      }
    }
  }

  const getStockStatus = (product) => {
    let totalStock = 0

    // Check if product is bangles and has sizes
    if (product.category?.toLowerCase() === "bangles" && product.sizes) {
      // If sizes is an object with size keys
      if (typeof product.sizes === "object" && !Array.isArray(product.sizes)) {
        Object.values(product.sizes).forEach((sizeData) => {
          if (sizeData && typeof sizeData === "object" && sizeData.stock) {
            totalStock += Number.parseInt(sizeData.stock) || 0
          }
        })
      }
      // If sizes is an array
      else if (Array.isArray(product.sizes)) {
        product.sizes.forEach((sizeData) => {
          if (sizeData && sizeData.stock) {
            totalStock += Number.parseInt(sizeData.stock) || 0
          }
        })
      }
    } else {
      // For regular products, use the stock field
      totalStock = Number.parseInt(product.stock) || 0
    }

    if (totalStock === 0) return { status: "Out of Stock", color: "bg-red-100 text-red-800", stock: totalStock }
    if (totalStock <= 5) return { status: "Low Stock", color: "bg-yellow-100 text-yellow-800", stock: totalStock }
    return { status: "In Stock", color: "bg-green-100 text-green-800", stock: totalStock }
  }

  const formatSizeDisplay = (product) => {
    if (product.category?.toLowerCase() !== "bangles" || !product.sizes) return "N/A"

    let availableSizes = 0

    if (typeof product.sizes === "object" && !Array.isArray(product.sizes)) {
      availableSizes = Object.keys(product.sizes).filter(
        (size) => product.sizes[size] && product.sizes[size].stock > 0,
      ).length
    } else if (Array.isArray(product.sizes)) {
      availableSizes = product.sizes.filter((sizeData) => sizeData && sizeData.stock > 0).length
    }

    return availableSizes > 0 ? `${availableSizes} sizes` : "No sizes"
  }

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProducts = filteredProducts.slice(startIndex, endIndex)

  // Get category counts for display
  const getCategoryCounts = () => {
    const counts = {
      all: products.length,
      bangles: products.filter((p) => p.category?.toLowerCase() === "bangles").length,
      earrings: products.filter((p) => p.category?.toLowerCase() === "earrings").length,
      cosmetics: products.filter((p) => p.category?.toLowerCase() === "cosmetics").length,
    }
    return counts
  }

  const categoryCounts = getCategoryCounts()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="mt-2 text-gray-600">Manage your product inventory and listings</p>
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
              <span>
                Total Products: <span className="font-semibold text-gray-900">{products.length}</span>
              </span>
              <span>•</span>
              <span>
                Showing: <span className="font-semibold text-gray-900">{filteredProducts.length}</span>
              </span>
            </div>
          </div>
          <Link
            to="/admin/products/new"
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Product
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{categoryCounts.all}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Package className="h-6 w-6 text-pink-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Bangles</p>
                <p className="text-2xl font-bold text-gray-900">{categoryCounts.bangles}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Earrings</p>
                <p className="text-2xl font-bold text-gray-900">{categoryCounts.earrings}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Cosmetics</p>
                <p className="text-2xl font-bold text-gray-900">{categoryCounts.cosmetics}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 text-gray-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Filters & Search</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Products</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="all">All Categories ({categoryCounts.all})</option>
                <option value="bangles">Bangles ({categoryCounts.bangles})</option>
                <option value="earrings">Earrings ({categoryCounts.earrings})</option>
                <option value="cosmetics">Cosmetics ({categoryCounts.cosmetics})</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="createdAt">Newest First</option>
                <option value="name">Name A-Z</option>
                <option value="price">Price Low to High</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("")
                  setCategoryFilter("all")
                  setSortBy("createdAt")
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productsLoading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mb-4"></div>
                        <p className="text-gray-500">Loading products...</p>
                      </div>
                    </td>
                  </tr>
                ) : currentProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center py-8">
                        <Package className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg">No products found</p>
                        <p className="text-gray-400 text-sm">
                          {searchTerm || categoryFilter !== "all"
                            ? "Try adjusting your search or filters"
                            : "Start by adding your first product"}
                        </p>
                        {!searchTerm && categoryFilter === "all" && (
                          <Link
                            to="/admin/products/new"
                            className="mt-4 inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Product
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentProducts.map((product) => {
                    const stockInfo = getStockStatus(product)
                    return (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="relative">
                              <img
                                src={product.images?.[0]?.url || "/placeholder.svg"}
                                alt={product.name}
                                className="h-16 w-16 object-cover rounded-lg"
                              />
                              {product.isFeatured && (
                                <div className="absolute -top-1 -right-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                                {product.isNew && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    New
                                  </span>
                                )}
                                {product.isCombo && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                    <Gift className="h-3 w-3 mr-1" />
                                    Combo
                                  </span>
                                )}
                                {product.isFeatured && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                    <Star className="h-3 w-3 mr-1" />
                                    Featured
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-1 max-w-xs truncate">{product.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">৳{product.price}</span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="ml-2 text-gray-500 line-through">৳{product.originalPrice}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.category?.toLowerCase() === "bangles" ? (
                            <div>
                              <div className="font-medium">{stockInfo.stock} total</div>
                              <div className="text-xs text-gray-500">{formatSizeDisplay(product)}</div>
                            </div>
                          ) : (
                            <div className="font-medium">{stockInfo.stock}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockInfo.color}`}
                          >
                            {stockInfo.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(product.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/products/${product._id}`}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="View Product"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Link
                              to={`/admin/products/${product._id}/edit`}
                              className="text-green-600 hover:text-green-900 transition-colors"
                              title="Edit Product"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDeleteProduct(product._id)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                    <span className="font-medium">{Math.min(endIndex, filteredProducts.length)}</span> of{" "}
                    <span className="font-medium">{filteredProducts.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {[...Array(Math.min(totalPages, 10))].map((_, index) => {
                      let page
                      if (totalPages <= 10) {
                        page = index + 1
                      } else {
                        const start = Math.max(1, currentPage - 5)
                        const end = Math.min(totalPages, start + 9)
                        page = start + index
                        if (page > end) return null
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? "z-10 bg-pink-50 border-pink-500 text-pink-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminProducts
