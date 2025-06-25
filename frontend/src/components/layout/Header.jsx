import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { Search, X } from "lucide-react"
import { logout, fetchUserProfile } from "../../lib/store/authSlice"
import { fetchCartItems } from "../../lib/store/cartSlice"
import logo from "../../assets/logo.png"

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
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

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery("")
      setIsSearchOpen(false)
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate("/")
  }

  const handleLogoClick = () => {
    navigate("/")
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
    // Scroll to top when clicking home
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      })
    }, 100)
  }

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

              {/* Categories Dropdown - FIXED WITH ALL 7 CATEGORIES */}
              <div className="relative group">
                <button className="text-white hover:text-pink-200 transition-colors flex items-center">
                  Categories
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <Link
                    to="/products?category=bangles"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                  >
                    Bangles
                  </Link>
                  <Link
                    to="/products?category=earrings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                  >
                    Earrings
                  </Link>
                  <Link
                    to="/products?category=cosmetics"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                  >
                    Cosmetics
                  </Link>
                  <Link
                    to="/products?category=necklaces"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                  >
                    Necklaces
                  </Link>
                  <Link
                    to="/products?category=rings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                  >
                    Rings
                  </Link>
                  <Link
                    to="/products?category=alna"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                  >
                    Alna
                  </Link>
                  <Link
                    to="/products?category=combo"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                  >
                    Combo
                  </Link>
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
                className="md:hidden text-white hover:text-pink-200 transition-colors"
              >
                {isSearchOpen ? <X className="h-6 w-6" /> : <Search className="h-6 w-6" />}
              </button>

              {isAuthenticated ? (
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-white hover:text-pink-200">
                    <span>👤</span>
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
                <Link to="/auth/login" className="text-white hover:text-pink-200 transition-colors">
                  <span>👤</span>
                </Link>
              )}

              <Link to="/cart" className="relative text-white hover:text-pink-200 transition-colors">
                <span>🛒</span>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Button */}
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-white hover:text-pink-200">
                ☰
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
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-pink-500 h-10"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-pink-700 text-white px-4 py-2.5 rounded-r-lg hover:bg-pink-800 transition-colors h-10 flex items-center justify-center"
                >
                  <Search className="h-5 w-5" />
                </button>
              </form>
            </div>
          )}

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-pink-500 py-4">
              <nav className="flex flex-col space-y-4">
                <button
                  onClick={handleHomeClick}
                  className="text-white hover:text-pink-200 transition-colors text-left"
                >
                  Home
                </button>

                {/* Mobile Categories - FIXED WITH ALL 7 CATEGORIES */}
                <div className="space-y-2">
                  <span className="text-white font-medium">Categories:</span>
                  <Link
                    to="/products?category=bangles"
                    className="block text-white hover:text-pink-200 transition-colors pl-4"
                  >
                    Bangles
                  </Link>
                  <Link
                    to="/products?category=earrings"
                    className="block text-white hover:text-pink-200 transition-colors pl-4"
                  >
                    Earrings
                  </Link>
                  <Link
                    to="/products?category=cosmetics"
                    className="block text-white hover:text-pink-200 transition-colors pl-4"
                  >
                    Cosmetics
                  </Link>
                  <Link
                    to="/products?category=necklaces"
                    className="block text-white hover:text-pink-200 transition-colors pl-4"
                  >
                    Necklaces
                  </Link>
                  <Link
                    to="/products?category=rings"
                    className="block text-white hover:text-pink-200 transition-colors pl-4"
                  >
                    Rings
                  </Link>
                  <Link
                    to="/products?category=alna"
                    className="block text-white hover:text-pink-200 transition-colors pl-4"
                  >
                    Alna
                  </Link>
                  <Link
                    to="/products?category=combo"
                    className="block text-white hover:text-pink-200 transition-colors pl-4"
                  >
                    Combo
                  </Link>
                </div>

                <Link to="/products" className="text-white hover:text-pink-200 transition-colors">
                  Shop
                </Link>
                {/* Admin Link - Mobile */}
                {isAuthenticated && user?.role === "admin" && (
                  <Link to="/admin" className="text-yellow-200 hover:text-yellow-100 transition-colors font-medium">
                    Admin Panel
                  </Link>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>
    </>
  )
}

export default Header
