import { useCallback, useEffect, useState } from "react"
import { Link, NavLink, Outlet, useLocation } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import {
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Image,
  PanelLeft,
  PanelLeftClose,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react"
import { Drawer, IconButton } from "../ui"
import { cn } from "../../lib/cn"
import { logout } from "../../lib/store/authSlice"

/**
 * Admin shell.
 *
 * The admin pages used to render inside StorefrontLayout, which meant every
 * screen carried the shopper header, the category mega-menu, the newsletter
 * footer and — until it was special-cased — the mobile bottom nav. Roughly a
 * third of a phone viewport was shopper chrome that an admin can't use.
 *
 * This is its own shell: a persistent sidebar on desktop (collapsible to an
 * icon rail, remembered across sessions), a slide-in drawer below `lg`, and a
 * header bar carrying breadcrumbs, a link back to the shop and the logout.
 *
 * The admin check lives on the parent route rather than being repeated on each
 * page. The five pages each ran their own `if (!isAuthenticated || role !==
 * "admin") navigate("/auth/login")` inside a `useEffect`, which fired *after*
 * the first render — so a signed-out visitor briefly saw the empty dashboard
 * frame before being bounced.
 */

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/banners", label: "Banners", icon: Image },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/users", label: "Customers", icon: Users },
]

const COLLAPSE_KEY = "sajbela.admin.sidebarCollapsed"

const CRUMB_LABELS = {
  products: "Products",
  banners: "Banners",
  orders: "Orders",
  users: "Customers",
  new: "New product",
  edit: "Edit product",
}

const isObjectId = (segment) => /^[a-f\d]{24}$/i.test(segment)

/** ["Products", "Edit product"] for /admin/products/<id>/edit. */
function breadcrumbTrail(pathname) {
  return pathname
    .replace(/^\/admin\/?/, "")
    .split("/")
    .filter((segment) => segment && !isObjectId(segment))
    .map((segment) => ({ segment, label: CRUMB_LABELS[segment] || segment }))
}

const SidebarNav = ({ collapsed, onNavigate }) => (
  <nav aria-label="Admin sections" className="flex-1 space-y-1 overflow-y-auto p-3">
    {NAV_ITEMS.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        className={({ isActive }) =>
          cn(
            "group flex items-center rounded-lg text-sm font-medium transition-colors duration-200",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2",
            collapsed ? "h-11 w-11 justify-center" : "h-11 gap-3 px-3",
            isActive ? "bg-pink-50 text-pink-700" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
          )
        }
      >
        {({ isActive }) => (
          <>
            <item.icon
              aria-hidden="true"
              className={cn("h-5 w-5 shrink-0", isActive ? "text-pink-600" : "text-gray-400")}
            />
            {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
          </>
        )}
      </NavLink>
    ))}
  </nav>
)

const SidebarBrand = ({ collapsed }) => (
  <Link
    to="/admin"
    className={cn(
      "flex h-16 shrink-0 items-center border-b border-gray-100",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500",
      collapsed ? "justify-center px-2" : "gap-2.5 px-5",
    )}
  >
    <span
      aria-hidden="true"
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-pink-600 text-sm font-bold text-white"
    >
      SJ
    </span>
    {!collapsed && (
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold leading-tight text-gray-900">Sajbela</span>
        <span className="block truncate text-xs leading-tight text-gray-500">Admin panel</span>
      </span>
    )}
  </Link>
)

const AdminLayout = () => {
  const dispatch = useDispatch()
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1"
    } catch {
      return false
    }
  })

  // Navigating closes the mobile drawer — otherwise it stays open on top of
  // the page it just took you to.
  useEffect(() => setDrawerOpen(false), [location.pathname])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((previous) => {
      const next = !previous
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0")
      } catch {
        /* Private mode / quota — the rail just won't be remembered. */
      }
      return next
    })
  }, [])

  const trail = breadcrumbTrail(location.pathname)

  return (
    <div className="min-h-screen bg-gray-50">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-modal focus:rounded-lg focus:bg-pink-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden border-r border-gray-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-header lg:flex lg:flex-col",
          "transition-[width] duration-200 ease-in-out-smooth",
          collapsed ? "lg:w-[4.5rem]" : "lg:w-64",
        )}
      >
        <SidebarBrand collapsed={collapsed} />
        <SidebarNav collapsed={collapsed} />

        <div className={cn("shrink-0 border-t border-gray-100 p-3", collapsed && "flex justify-center")}>
          <Link
            to="/"
            title={collapsed ? "View shop" : undefined}
            className={cn(
              "flex items-center rounded-lg text-sm font-medium text-gray-600 transition-colors duration-200",
              "hover:bg-gray-100 hover:text-gray-900",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2",
              collapsed ? "h-11 w-11 justify-center" : "h-11 gap-3 px-3",
            )}
          >
            <Store aria-hidden="true" className="h-5 w-5 shrink-0 text-gray-400" />
            {collapsed ? <span className="sr-only">View shop</span> : "View shop"}
          </Link>
        </div>
      </aside>

      {/* Mobile / tablet drawer — the same nav, same active states. */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        side="left"
        panelClassName="max-w-[17rem]"
        title="Sajbela admin"
        description={user?.email}
        bodyClassName="flex flex-col"
      >
        <SidebarNav collapsed={false} onNavigate={() => setDrawerOpen(false)} />
        <div className="border-t border-gray-100 p-3">
          <Link
            to="/"
            className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            <Store aria-hidden="true" className="h-5 w-5 shrink-0 text-gray-400" />
            View shop
          </Link>
        </div>
      </Drawer>

      <div className={cn("flex min-h-screen flex-col", collapsed ? "lg:pl-[4.5rem]" : "lg:pl-64")}>
        <header className="sticky top-0 z-header border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="flex h-16 items-center gap-2 px-4 sm:px-6 lg:px-8">
            <IconButton
              label="Open admin menu"
              className="lg:hidden"
              size="md"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu />
            </IconButton>

            <IconButton
              label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden lg:inline-flex"
              size="md"
              onClick={toggleCollapsed}
            >
              {collapsed ? <PanelLeft /> : <PanelLeftClose />}
            </IconButton>

            <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
              <ol className="flex items-center gap-1 text-sm">
                <li className="flex shrink-0 items-center gap-1">
                  {trail.length === 0 ? (
                    <span className="font-semibold text-gray-900">Dashboard</span>
                  ) : (
                    <Link to="/admin" className="text-gray-500 hover:text-gray-900 hover:underline">
                      Dashboard
                    </Link>
                  )}
                </li>

                {trail.map((crumb, index) => {
                  const isLast = index === trail.length - 1
                  return (
                    <li key={`${crumb.segment}-${index}`} className="flex min-w-0 items-center gap-1">
                      <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-300" />
                      {isLast ? (
                        <span aria-current="page" className="truncate font-semibold text-gray-900">
                          {crumb.label}
                        </span>
                      ) : (
                        <Link
                          to={`/admin/${crumb.segment}`}
                          className="truncate text-gray-500 hover:text-gray-900 hover:underline"
                        >
                          {crumb.label}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ol>
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden min-w-0 text-right sm:block">
                <p className="truncate text-sm font-medium leading-tight text-gray-900">{user?.name || "Admin"}</p>
                <p className="truncate text-xs leading-tight text-gray-500">{user?.email}</p>
              </div>

              <span
                aria-hidden="true"
                className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-pink-100 text-sm font-semibold text-pink-700"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  (user?.name?.trim()?.[0] || "A").toUpperCase()
                )}
              </span>

              <IconButton
                label="Sign out"
                size="md"
                className="text-gray-500 hover:bg-red-50 hover:text-red-600"
                onClick={() => dispatch(logout())}
              >
                <LogOut />
              </IconButton>
            </div>
          </div>
        </header>

        <main id="admin-content" className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
