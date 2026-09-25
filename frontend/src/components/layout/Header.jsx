import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { ChevronDown, LayoutDashboard, LogOut, Menu, Package, Phone, Search, ShoppingBag, Truck, User } from "lucide-react"
import { cn } from "../../lib/cn"
import { logout } from "../../lib/store/authSlice"
import { useClickOutside } from "../../lib/hooks"
import { CATEGORIES, PRIMARY_NAV, SHIPPING, STORE, categoryPath } from "../../lib/navigation"
import { formatPrice } from "../../lib/utils"
import { Badge, CountBadge, IconButton } from "../ui"
import logo from "../../assets/logo.png"

/**
 * Storefront header.
 *
 * The brand's solid pink bar is retained deliberately — it's the store's
 * signature and the palette is locked. What changed is everything around it:
 * a proper three-zone desktop layout, an accessible category mega-menu, a
 * real search affordance, and a stripped-back mobile bar that hands primary
 * navigation to <BottomNav/>.
 */
const Header = ({ onSearchClick, onCartClick, onMenuClick }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const { totalItems } = useSelector((state) => state.cart)
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [inlineQuery, setInlineQuery] = useState("")

  const categoriesRef = useClickOutside(categoriesOpen, () => setCategoriesOpen(false))
  const accountRef = useClickOutside(accountOpen, () => setAccountOpen(false))
  const closeTimer = useRef(null)

  const isAdmin = isAuthenticated && user?.role === "admin"

  // Close menus on navigation.
  useEffect(() => {
    setCategoriesOpen(false)
    setAccountOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  const handleInlineSearch = (event) => {
    event.preventDefault()
    const trimmed = inlineQuery.trim()
    if (!trimmed) return
    navigate(`/products?search=${encodeURIComponent(trimmed)}`)
    setInlineQuery("")
  }

  const handleLogout = () => {
    dispatch(logout())
    setAccountOpen(false)
    navigate("/")
  }

  const isNavActive = (to) => (to === "/" ? location.pathname === "/" : location.pathname.startsWith(to))

  // Hover intent for the categories menu — a short close delay stops the panel
  // vanishing when the pointer crosses the gap between trigger and panel.
  const openCategories = () => {
    clearTimeout(closeTimer.current)
    setCategoriesOpen(true)
  }
  const scheduleCloseCategories = () => {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setCategoriesOpen(false), 160)
  }

  const desktopLinkClass = (active) =>
    cn(
      "relative rounded-md px-1 py-1.5 text-sm font-medium text-white/90 transition-colors duration-200",
      "hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-pink-600",
      "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-white",
      "after:transition-transform after:duration-300 after:ease-out-expo after:origin-left",
      active ? "text-white after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100",
    )

  return (
    <>
      {/* Skip link — first tab stop, lets keyboard users jump the nav. */}
      <a
        href="#main-content"
        className="sr-only-focusable fixed left-4 top-4 z-toast rounded-lg bg-white px-4 py-2 text-sm font-semibold text-pink-700 shadow-lg"
      >
        Skip to main content
      </a>

      {/* Announcement bar */}
      <div className="bg-pink-700 text-white">
        <div className="page-container flex h-9 items-center justify-center gap-x-6 gap-y-0.5 text-xs sm:text-[0.8125rem]">
          <p className="flex items-center gap-1.5">
            <Truck aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden xs:inline">Free delivery over</span>
            <span className="xs:hidden">Free over</span>
            <span className="font-semibold">{formatPrice(SHIPPING.freeThreshold)}</span>
          </p>

          <span aria-hidden="true" className="hidden h-3 w-px bg-white/30 sm:block" />

          <p className="hidden sm:block">Cash on Delivery available</p>

          <span aria-hidden="true" className="hidden h-3 w-px bg-white/30 md:block" />

          <a
            href={STORE.phoneHref}
            className="hidden items-center gap-1.5 font-medium transition-opacity hover:opacity-80 md:flex"
          >
            <Phone aria-hidden="true" className="h-3.5 w-3.5" />
            {STORE.phone}
          </a>
        </div>
      </div>

      <header className="sticky top-0 z-header bg-pink-600 shadow-md">
        <div className="page-container">
          <div className="flex h-16 items-center gap-3 lg:h-[4.5rem] lg:gap-6">
            {/* Mobile: menu button */}
            <IconButton
              label="Open menu"
              variant="ghost-light"
              onClick={onMenuClick}
              className="-ml-2 shrink-0 md:hidden"
            >
              <Menu />
            </IconButton>

            {/* Logo */}
            <Link
              to="/"
              className="shrink-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-pink-600"
            >
              <img src={logo} alt={`${STORE.name} — home`} className="h-8 w-auto lg:h-11" width="120" height="44" />
            </Link>

            {/* Desktop nav */}
            <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
              {PRIMARY_NAV.map((item) => (
                <Link key={item.to} to={item.to} className={desktopLinkClass(isNavActive(item.to))}>
                  {item.label}
                </Link>
              ))}

              {/* Categories mega-menu */}
              <div
                ref={categoriesRef}
                className="relative"
                onMouseEnter={openCategories}
                onMouseLeave={scheduleCloseCategories}
              >
                <button
                  type="button"
                  onClick={() => setCategoriesOpen((prev) => !prev)}
                  aria-expanded={categoriesOpen}
                  aria-haspopup="true"
                  className={cn(desktopLinkClass(location.pathname.startsWith("/category")), "flex items-center gap-1")}
                >
                  Categories
                  <ChevronDown
                    aria-hidden="true"
                    className={cn("h-4 w-4 transition-transform duration-200", categoriesOpen && "rotate-180")}
                  />
                </button>

                {categoriesOpen && (
                  <div
                    className={cn(
                      "absolute left-1/2 top-full z-overlay w-[34rem] -translate-x-1/2 pt-4",
                      "animate-fade-in-up",
                    )}
                  >
                    <div className="overflow-hidden rounded-sheet border border-gray-100 bg-white p-2 shadow-drawer">
                      <ul className="grid grid-cols-2 gap-1">
                        {CATEGORIES.map((category) => (
                          <li key={category.slug}>
                            <Link
                              to={categoryPath(category.slug)}
                              className="group flex items-center gap-3 rounded-lg p-2.5 transition-colors duration-200 hover:bg-pink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                            >
                              <span
                                aria-hidden="true"
                                className={cn(
                                  "h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br transition-transform duration-300 group-hover:scale-105",
                                  category.accent,
                                )}
                              />
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold text-gray-900 group-hover:text-pink-700">
                                  {category.label}
                                </span>
                                <span className="block truncate text-xs text-gray-500">{category.tagline}</span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>

                      <Link
                        to="/products"
                        className="mt-1 flex items-center justify-center gap-1.5 rounded-lg bg-gray-50 py-2.5 text-sm font-semibold text-pink-600 transition-colors hover:bg-pink-50 hover:text-pink-700"
                      >
                        View all products
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {isAdmin && (
                <Link to="/admin" className={cn(desktopLinkClass(isNavActive("/admin")), "text-yellow-200 hover:text-yellow-100")}>
                  Admin
                </Link>
              )}
            </nav>

            {/* Desktop search — takes the remaining space */}
            <form onSubmit={handleInlineSearch} role="search" className="ml-auto hidden max-w-md flex-1 lg:block">
              <label htmlFor="header-search" className="sr-only">
                Search products
              </label>
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="header-search"
                  type="search"
                  value={inlineQuery}
                  onChange={(event) => setInlineQuery(event.target.value)}
                  placeholder="Search for bangles, earrings…"
                  className={cn(
                    "h-10 w-full rounded-full border border-transparent bg-white/95 pl-10 pr-4 text-sm text-gray-900",
                    "placeholder:text-gray-400 transition-[background-color,box-shadow] duration-200",
                    "focus:bg-white focus:outline-none focus:ring-2 focus:ring-white/70",
                  )}
                />
              </div>
            </form>

            {/* Actions */}
            <div className={cn("flex items-center gap-0.5 sm:gap-1", "ml-auto lg:ml-0")}>
              {/* Search — icon opens the overlay below lg, where the inline field is hidden */}
              <IconButton label="Search" variant="ghost-light" onClick={onSearchClick} className="lg:hidden">
                <Search />
              </IconButton>

              {/* Account (desktop only — mobile uses the bottom nav) */}
              <div ref={accountRef} className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => (isAuthenticated ? setAccountOpen((prev) => !prev) : navigate("/auth/login"))}
                  aria-expanded={isAuthenticated ? accountOpen : undefined}
                  aria-haspopup={isAuthenticated ? "true" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-full px-2.5 text-white/90",
                    "transition-colors duration-200 hover:bg-white/15 hover:text-white",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-pink-600",
                  )}
                >
                  {isAuthenticated ? (
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold"
                    >
                      {user?.name?.charAt(0)?.toUpperCase() || "S"}
                    </span>
                  ) : (
                    <User aria-hidden="true" className="h-5 w-5" />
                  )}

                  <span className="hidden max-w-[7rem] truncate text-sm font-medium lg:inline">
                    {isAuthenticated ? user?.name : "Sign in"}
                  </span>

                  {isAuthenticated && (
                    <ChevronDown
                      aria-hidden="true"
                      className={cn("hidden h-4 w-4 transition-transform duration-200 lg:block", accountOpen && "rotate-180")}
                    />
                  )}
                </button>

                {isAuthenticated && accountOpen && (
                  <div className="absolute right-0 top-full z-overlay mt-2 w-56 animate-fade-in-up overflow-hidden rounded-card border border-gray-100 bg-white shadow-drawer">
                    <div className="border-b border-gray-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="truncate text-xs text-gray-500">{user?.email}</p>
                      {isAdmin && (
                        <Badge tone="admin" size="xs" className="mt-1.5">
                          Administrator
                        </Badge>
                      )}
                    </div>

                    <div className="p-1.5">
                      <Link
                        to="/account"
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-pink-600"
                      >
                        <User aria-hidden="true" className="h-4 w-4" />
                        My Account
                      </Link>
                      <Link
                        to="/account"
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-pink-600"
                      >
                        <Package aria-hidden="true" className="h-4 w-4" />
                        My Orders
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-yellow-700 transition-colors hover:bg-yellow-50"
                        >
                          <LayoutDashboard aria-hidden="true" className="h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-gray-100 p-1.5">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <LogOut aria-hidden="true" className="h-4 w-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart */}
              <button
                type="button"
                onClick={onCartClick}
                aria-label={totalItems > 0 ? `Open cart, ${totalItems} items` : "Open cart"}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-full text-white/90",
                  "transition-colors duration-200 hover:bg-white/15 hover:text-white active:scale-95",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-pink-600",
                )}
              >
                <ShoppingBag aria-hidden="true" className="h-5 w-5" />
                <CountBadge count={totalItems} className="right-1 top-1" label={null} />
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}

export default Header
