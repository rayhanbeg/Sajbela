import { useMemo } from "react"
import { Link, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"
import { Home, LayoutGrid, Search, ShoppingBag, User } from "lucide-react"
import { cn } from "../../lib/cn"
import { CountBadge } from "../ui"

/**
 * Persistent mobile bottom navigation — the primary way to move around the
 * store on phones, replacing the old hamburger-only top nav.
 *
 * Behaviour notes:
 *  - Fixed to the viewport bottom, below the drawer/modal layers so overlays
 *    always cover it.
 *  - `pb-safe` adds env(safe-area-inset-bottom) so the row sits above the iOS
 *    home indicator instead of under it.
 *  - The bar is 4rem tall + the safe-area inset; <main> carries a matching
 *    `pb-bottom-nav` (see App.jsx) so content is never hidden behind it.
 *  - Hidden from md up, where the top navbar takes over.
 *  - The active tab is marked by colour and label weight only. There used to be
 *    a pink pill along the top edge of the cell plus an icon scale-up; between
 *    the two, the tint, the badge and the safe-area inset there was too much
 *    happening in a 64px bar.
 */

const BottomNav = ({ onSearchClick, onCartClick }) => {
  const location = useLocation()
  const { totalItems } = useSelector((state) => state.cart)
  const { isAuthenticated } = useSelector((state) => state.auth)

  const { pathname } = location

  const items = useMemo(
    () => [
      {
        key: "home",
        label: "Home",
        icon: Home,
        to: "/",
        isActive: pathname === "/",
      },
      {
        key: "shop",
        label: "Shop",
        icon: LayoutGrid,
        to: "/products",
        isActive: pathname.startsWith("/products") || pathname.startsWith("/category"),
      },
      {
        key: "search",
        label: "Search",
        icon: Search,
        onClick: onSearchClick,
        isActive: false,
      },
      {
        key: "cart",
        label: "Cart",
        icon: ShoppingBag,
        // Tapping opens the drawer when a handler is supplied; the href keeps
        // it a real link so long-press / open-in-new-tab still work.
        to: "/cart",
        onClick: onCartClick,
        badge: totalItems,
        isActive: pathname === "/cart",
      },
      {
        key: "account",
        label: "Account",
        icon: User,
        to: isAuthenticated ? "/account" : "/auth/login",
        isActive: pathname.startsWith("/account") || pathname.startsWith("/auth"),
      },
    ],
    [pathname, totalItems, isAuthenticated, onSearchClick, onCartClick],
  )

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-bottom-nav md:hidden",
        "border-t border-gray-200 bg-white/95 backdrop-blur-lg shadow-nav",
        "pb-safe",
      )}
    >
      <ul className="flex h-16 items-stretch">
        {items.map((item) => {
          const Icon = item.icon
          const active = item.isActive

          const content = (
            <>
              <span className="relative flex items-center justify-center">
                <Icon aria-hidden="true" className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 1.8} />
                {item.badge > 0 && <CountBadge count={item.badge} className="-right-2.5 -top-1.5" label={null} />}
              </span>

              <span
                className={cn("text-[0.6875rem] leading-none", active ? "font-semibold" : "font-medium")}
              >
                {item.label}
              </span>
            </>
          )

          const cellClass = cn(
            "flex h-full w-full flex-col items-center justify-center gap-1",
            "transition-colors duration-200",
            "focus:outline-none focus-visible:bg-pink-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500",
            active ? "text-pink-600" : "text-gray-500 hover:text-gray-700",
          )

          return (
            <li key={item.key} className="flex-1">
              {item.to ? (
                <Link
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.badge > 0 ? `${item.label}, ${item.badge} items` : item.label}
                  onClick={
                    item.onClick
                      ? (event) => {
                          // Let modifier-clicks fall through to real navigation.
                          if (event.metaKey || event.ctrlKey || event.shiftKey) return
                          event.preventDefault()
                          item.onClick()
                        }
                      : undefined
                  }
                  className={cellClass}
                >
                  {content}
                </Link>
              ) : (
                <button type="button" onClick={item.onClick} aria-label={item.label} className={cellClass}>
                  {content}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default BottomNav
