import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import BottomNav from "./BottomNav"
import MobileMenu from "./MobileMenu"
import SearchOverlay from "./SearchOverlay"
import CartDrawer from "../cart/CartDrawer"
import WhatsAppButton from "../WhatsAppButton"

/**
 * Storefront shell: header, footer, mobile bottom nav and the three overlays
 * (menu / search / cart), plus the context that lets any page open them.
 *
 *   const { openCart } = useStorefrontUI()
 *   await addToCart(...); openCart()
 */

const StorefrontUIContext = createContext(null)

export function useStorefrontUI() {
  const context = useContext(StorefrontUIContext)

  // No-ops outside the storefront (e.g. inside the admin shell) so a shared
  // component calling openCart() can't crash the admin panel.
  if (!context) {
    return {
      openCart: () => {},
      closeCart: () => {},
      openSearch: () => {},
      openMenu: () => {},
    }
  }

  return context
}

const StorefrontLayout = () => {
  const location = useLocation()

  const [cartOpen, setCartOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Any navigation dismisses every overlay — otherwise the cart drawer stays
  // open on top of the page you just navigated to.
  useEffect(() => {
    setCartOpen(false)
    setSearchOpen(false)
    setMenuOpen(false)
  }, [location.pathname, location.search])

  const api = useMemo(
    () => ({
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      openSearch: () => setSearchOpen(true),
      openMenu: () => setMenuOpen(true),
    }),
    [],
  )

  const handleSearchClick = useCallback(() => setSearchOpen(true), [])
  const handleCartClick = useCallback(() => setCartOpen(true), [])
  const handleMenuClick = useCallback(() => setMenuOpen(true), [])

  // Admin pages share this shell for now but shouldn't get shopper chrome —
  // the bottom nav and the WhatsApp bubble are storefront-only affordances.
  // (The admin redesign moves these routes out to their own layout.)
  const isAdminRoute = location.pathname.startsWith("/admin")

  return (
    <StorefrontUIContext.Provider value={api}>
      <div className="flex min-h-screen flex-col bg-white">
        <Header onSearchClick={handleSearchClick} onCartClick={handleCartClick} onMenuClick={handleMenuClick} />

        {/*
          `pb-bottom-nav` clears the fixed mobile bottom nav (4rem + iOS safe
          area). Removed from md up where the bottom nav is hidden.
        */}
        <main id="main-content" className={cn("flex-1", !isAdminRoute && "pb-bottom-nav md:pb-0")}>
          <Outlet />
        </main>

        <Footer />

        {!isAdminRoute && (
          <>
            <BottomNav onSearchClick={handleSearchClick} onCartClick={handleCartClick} />
            <WhatsAppButton />
          </>
        )}

        <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      </div>
    </StorefrontUIContext.Provider>
  )
}

export default StorefrontLayout
