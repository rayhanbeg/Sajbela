

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { Search, X, Menu, ChevronDown, ChevronRight, Home, ShoppingBag, User, ShoppingCart } from "lucide-react"
import { logout, fetchUserProfile } from "../../lib/store/authSlice"
import { fetchCartItems } from "../../lib/store/cartSlice"
import logo from "../../assets/logo.png"

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { totalItems } = useSelector((state) => state.cart)
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  // Auto-refresh user profile every 30 seconds to check for role updates
  useEffect(() => {
    if (isAuthenticated && user) {
      const interval = setInterval(() => {
        dispatch(fetchUserProfile())
      }, 30000) // 30 seconds

      return () => clearInterval(interval)
    }
  }, [isAuthenticated, user, dispatch])

  // Fetch cart items when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCartItems())
    }
  }, [isAuthenticated, dispatch])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest(".mobile-menu") && !event.target.closest(".menu-button")) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMenuOpen])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isMenuOpen])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery("")
      setIsSearchOpen(false)
      setIsMenuOpen(false)
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate("/")
    setIsMenuOpen(false)
  }

  const handleLogoClick = () => {
    navigate("/")
    setIsMenuOpen(false)
    // Scroll to top when clicking logo
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      })
    }, 100)
  }

  const handleHomeClick = () => {
    navigate("/")
    setIsMenuOpen(false)
    // Scroll to top when clicking home
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      })
    }, 100)
  }

  const handleNavClick = (path) => {
    navigate(path)
    setIsMenuOpen(false)
    setIsCategoriesOpen(false)
  }

  const categories = [
    { name: "Bangles", path: "/products?category=bangles" },
    { name: "Earrings", path: "/products?category=earrings" },
    { name: "Cosmetics", path: "/products?category=cosmetics" },
    { name: "Necklaces", path: "/products?category=necklaces" },
    { name: "Rings", path: "/products?category=rings" },
    { name: "Alna", path: "/products?category=alna" },
    { name: "Combo", path: "/products?category=combo" },
  ]

  return (
    <>
      {/* Top Banner */}
      <div className="bg-pink-600 text-white text-center py-2 text-sm">
        <p>Free Delivery on Orders Above ৳2000</p>
        <p>Cash on Delivery Available | Call: +8801782-723804</p>
      </div>

      {/* Main Header */}
      <header className="bg-pink-600 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <button onClick={handleLogoClick} className="text-2xl font-bold text-white">
              <img src={logo || "/placeholder.svg"} alt="Logo" className="h-8 lg:h-12" />
            </button>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center space-x-8">
              <button onClick={handleHomeClick} className="text-white hover:text-pink-200 transition-colors">
                Home
              </button>

              {/* Categories Dropdown - Desktop */}
              <div className="relative group">
                <button className="text-white hover:text-pink-200 transition-colors flex items-center">
                  Categories
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  {categories.map((category) => (
                    <Link
                      key={category.name}
                      to={category.path}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>

              <Link to="/products" className="text-white hover:text-pink-200 transition-colors">
                Shop
              </Link>
              {/* Admin Link - Only show for admin users */}
              {isAuthenticated && user?.role === "admin" && (
                <Link to="/admin" className="text-yellow-200 hover:text-yellow-100 transition-colors font-medium">
                  Admin Panel
                </Link>
              )}
            </nav>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 px-4 py-2.5 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-pink-500 h-10"
                />
                <button
                  type="submit"
                  className="bg-pink-700 text-white px-4 py-2.5 rounded-r-lg hover:bg-pink-800 transition-colors h-10 flex items-center justify-center"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </form>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {/* Mobile Search Button */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden text-white hover:text-pink-200 transition-colors p-2"
              >
                {isSearchOpen ? <X className="h-6 w-6" /> : <Search className="h-6 w-6" />}
              </button>

              {isAuthenticated ? (
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-white hover:text-pink-200">
                    <User className="h-5 w-5" />
                    <span className="hidden md:inline">{user?.name}</span>
                    {user?.role === "admin" && (
                      <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded-full">Admin</span>
                    )}
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link to="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      My Account
                    </Link>
                    {user?.role === "admin" && (
                      <Link to="/admin" className="block px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50">
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link to="/auth/login" className="text-white hover:text-pink-200 transition-colors p-2">
                  <User className="h-5 w-5" />
                </Link>
              )}

              <Link to="/cart" className="relative text-white hover:text-pink-200 transition-colors p-2">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-white hover:text-pink-200 transition-colors p-2 menu-button"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {isSearchOpen && (
            <div className="md:hidden pb-4">
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-base"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-pink-700 text-white px-6 py-3 rounded-r-lg hover:bg-pink-800 transition-colors flex items-center justify-center"
                >
                  <Search className="h-5 w-5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

          {/* Menu Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-pink-600 shadow-xl mobile-menu">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-pink-500">
                <img src={logo || "/placeholder.svg"} alt="Logo" className="h-8" />
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="text-white hover:text-pink-200 transition-colors p-2"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Menu Content */}
              <div className="flex-1 overflow-y-auto py-4">
                <nav className="px-4 space-y-2">
                  {/* Home */}
                  <button
                    onClick={handleHomeClick}
                    className="flex items-center w-full text-left px-4 py-3 text-white hover:bg-pink-700 rounded-lg transition-colors"
                  >
                    <Home className="h-5 w-5 mr-3" />
                    Home
                  </button>

                  {/* Categories */}
                  <div className="space-y-1">
                    <button
                      onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                      className="flex items-center justify-between w-full text-left px-4 py-3 text-white hover:bg-pink-700 rounded-lg transition-colors"
                    >
                      <div className="flex items-center">
                        <ShoppingBag className="h-5 w-5 mr-3" />
                        Categories
                      </div>
                      {isCategoriesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>

                    {isCategoriesOpen && (
                      <div className="ml-4 space-y-1">
                        {categories.map((category) => (
                          <button
                            key={category.name}
                            onClick={() => handleNavClick(category.path)}
                            className="block w-full text-left px-4 py-2 text-pink-100 hover:bg-pink-700 hover:text-white rounded-lg transition-colors text-sm"
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Shop */}
                  <button
                    onClick={() => handleNavClick("/products")}
                    className="flex items-center w-full text-left px-4 py-3 text-white hover:bg-pink-700 rounded-lg transition-colors"
                  >
                    <ShoppingBag className="h-5 w-5 mr-3" />
                    Shop
                  </button>

                  {/* Admin Link - Mobile */}
                  {isAuthenticated && user?.role === "admin" && (
                    <button
                      onClick={() => handleNavClick("/admin")}
                      className="flex items-center w-full text-left px-4 py-3 text-yellow-200 hover:bg-pink-700 rounded-lg transition-colors font-medium"
                    >
                      <User className="h-5 w-5 mr-3" />
                      Admin Panel
                    </button>
                  )}
                </nav>

                {/* Search Section */}
                <div className="px-4 mt-6">
                  <h3 className="text-pink-200 text-sm font-medium mb-3">Search Products</h3>
                  <form onSubmit={handleSearch} className="flex">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 px-4 py-3 border border-pink-500 bg-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-pink-300 text-base"
                    />
                    <button
                      type="submit"
                      className="bg-pink-700 text-white px-4 py-3 rounded-r-lg hover:bg-pink-800 transition-colors"
                    >
                      <Search className="h-5 w-5" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-pink-500 p-4">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="flex items-center px-4 py-2 text-white">
                      <User className="h-5 w-5 mr-3" />
                      <div>
                        <p className="font-medium">{user?.name}</p>
                        {user?.role === "admin" && (
                          <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded-full">Admin</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleNavClick("/account")}
                      className="w-full text-left px-4 py-2 text-pink-100 hover:bg-pink-700 hover:text-white rounded-lg transition-colors"
                    >
                      My Account
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-pink-100 hover:bg-pink-700 hover:text-white rounded-lg transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleNavClick("/auth/login")}
                    className="flex items-center w-full text-left px-4 py-3 text-white hover:bg-pink-700 rounded-lg transition-colors"
                  >
                    <User className="h-5 w-5 mr-3" />
                    Login / Register
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Header
