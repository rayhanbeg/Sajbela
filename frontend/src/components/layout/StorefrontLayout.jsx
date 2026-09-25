import { useCallback, useEffect, useMemo, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import BottomNav from "./BottomNav"
import MobileMenu from "./MobileMenu"
import SearchOverlay from "./SearchOverlay"
import CartDrawer from "../cart/CartDrawer"
import WhatsAppButton from "../WhatsAppButton"
import { StorefrontUIContext, useStorefrontUI } from "../../lib/storefrontUI"

/**
 * Storefront shell: header, footer, mobile bottom nav and the three overlays
 * (menu / search / cart), plus the context that lets any page open them.
 *
 * The context itself lives in lib/storefrontUI so leaf components can consume
 * it without importing this module. Re-exported here for convenience.
 */

export { useStorefrontUI }

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

  return (
    <StorefrontUIContext.Provider value={api}>
      <div className="flex min-h-screen flex-col bg-white">
        <Header onSearchClick={handleSearchClick} onCartClick={handleCartClick} onMenuClick={handleMenuClick} />

        {/*
          `pb-bottom-nav` clears the fixed mobile bottom nav (4rem + iOS safe
          area). Removed from md up where the bottom nav is hidden.
        */}
        <main id="main-content" className="flex-1 pb-bottom-nav md:pb-0">
          <Outlet />
        </main>

        <Footer />

        <BottomNav onSearchClick={handleSearchClick} onCartClick={handleCartClick} />
        <WhatsAppButton />

        <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      </div>
    </StorefrontUIContext.Provider>
  )
}

export default StorefrontLayout
