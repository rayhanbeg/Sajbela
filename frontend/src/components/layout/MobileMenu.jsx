import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Package,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  User,
} from "lucide-react"
import { cn } from "../../lib/cn"
import { logout } from "../../lib/store/authSlice"
import { CATEGORIES, SECONDARY_NAV, STORE, categoryPath } from "../../lib/navigation"
import { Badge, Button, Drawer } from "../ui"
import logo from "../../assets/logo.png"

/**
 * Off-canvas menu for secondary destinations on mobile.
 *
 * Deliberately does NOT duplicate the bottom nav's five primary destinations —
 * it holds what doesn't fit there: the full category list, informational
 * pages, contact details and account/admin actions.
 */
const MobileMenu = ({ open, onClose }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const [categoriesOpen, setCategoriesOpen] = useState(true)

  const isAdmin = isAuthenticated && user?.role === "admin"

  const go = (path) => {
    navigate(path)
    onClose?.()
  }

  const handleLogout = () => {
    dispatch(logout())
    onClose?.()
    navigate("/")
  }

  const linkClass =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 " +
    "transition-colors duration-200 hover:bg-pink-50 hover:text-pink-700 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="left"
      header={
        <Link to="/" onClick={onClose} className="flex items-center gap-2.5">
          <img src={logo} alt="" className="h-8 w-auto" />
          <span className="sr-only">{STORE.name} home</span>
        </Link>
      }
      bodyClassName="px-3 py-4"
      footer={
        <a
          href={STORE.phoneHref}
          className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-pink-600"
        >
          <Phone aria-hidden="true" className="h-4 w-4" />
          {STORE.phone}
        </a>
      }
    >
      {/* Account summary / sign-in prompt */}
      <div className="mb-4 rounded-card border border-pink-100 bg-pink-50 p-4">
        {isAuthenticated ? (
          <>
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-600 text-sm font-semibold text-white"
              >
                {user?.name?.charAt(0)?.toUpperCase() || "S"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="truncate text-xs text-gray-600">{user?.email}</p>
              </div>
              {isAdmin && (
                <Badge tone="admin" size="xs" className="ml-auto shrink-0">
                  Admin
                </Badge>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary" onClick={() => go("/account")}>
                My Account
              </Button>
              <Button size="sm" variant="outline" onClick={handleLogout} leftIcon={<LogOut className="h-4 w-4" />}>
                Log out
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-gray-900">Welcome to {STORE.name}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" onClick={() => go("/auth/login")}>
                Sign in
              </Button>
              <Button size="sm" variant="secondary" onClick={() => go("/auth/register")}>
                Register
              </Button>
            </div>
          </>
        )}
      </div>

      {isAdmin && (
        <button type="button" onClick={() => go("/admin")} className={cn(linkClass, "mb-2 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 hover:text-yellow-900")}>
          <LayoutDashboard aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
          Admin Dashboard
        </button>
      )}

      {/* Categories */}
      <div className="mb-2">
        <button
          type="button"
          onClick={() => setCategoriesOpen((prev) => !prev)}
          aria-expanded={categoriesOpen}
          className={cn(linkClass, "justify-between")}
        >
          <span className="flex items-center gap-3">
            <ShoppingBag aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
            Categories
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn("h-4 w-4 text-gray-400 transition-transform duration-300", categoriesOpen && "rotate-180")}
          />
        </button>

        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-out-expo",
            categoriesOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <ul className="overflow-hidden">
            {CATEGORIES.map((category) => (
              <li key={category.slug}>
                <button
                  type="button"
                  onClick={() => go(categoryPath(category.slug))}
                  className={cn(linkClass, "py-2 pl-12 text-gray-600")}
                >
                  {category.label}
                </button>
              </li>
            ))}
            <li>
              <button type="button" onClick={() => go("/products")} className={cn(linkClass, "py-2 pl-12 text-pink-600")}>
                View all products
              </button>
            </li>
          </ul>
        </div>
      </div>

      <button type="button" onClick={() => go("/products?section=new-arrivals")} className={linkClass}>
        <Sparkles aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
        New Arrivals
      </button>

      {isAuthenticated && (
        <button type="button" onClick={() => go("/account")} className={linkClass}>
          <Package aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
          My Orders
        </button>
      )}

      <hr className="my-3 border-gray-100" />

      <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Help &amp; info</p>

      <ul>
        {SECONDARY_NAV.map((item) => (
          <li key={item.to}>
            <button type="button" onClick={() => go(item.to)} className={linkClass}>
              {item.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-600">
        <ShieldCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-green-600" />
        Cash on delivery nationwide
      </div>
    </Drawer>
  )
}

export default MobileMenu
