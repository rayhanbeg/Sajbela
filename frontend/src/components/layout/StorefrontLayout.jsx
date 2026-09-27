import { useCallback, useEffect, useMemo, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import BottomNav from "./BottomNav"
import SearchOverlay from "./SearchOverlay"
import CartDrawer from "../cart/CartDrawer"
import WhatsAppButton from "../WhatsAppButton"
import { StorefrontUIContext, useStorefrontUI } from "../../lib/storefrontUI"

/**
 * Storefront shell: header, footer, mobile bottom nav and the search/cart
 * overlays, plus the context that lets any page open them.
 *
 * The context itself lives in lib/storefrontUI so leaf components can consume
 * it without importing this module. Re-exported here for convenience.
 */

export { useStorefrontUI }

/*
 * The product detail page swaps the bottom nav for its own Add-to-cart / Buy-now
 * bar. Two fixed bars stacked on a phone is a third of the screen gone, and on
 * the one page whose entire job is buying, the buy actions win.
 *
 * Nothing becomes unreachable: the header is sticky and carries the wordmark,
 * search and cart, and the page opens with breadcrumbs up to its category.
 *
 * Matched on the route rather than signalled from the page, because a flag the
 * page raised on mount would leave the nav rendered for the first paint and
 * then yank it out from under the content. `/products` — the shop grid — keeps
 * its nav; only `/products/:id` is matched.
 */
const PRODUCT_DETAIL_ROUTE = /^\/products\/[^/]+\/?$/

const StorefrontLayout = () => {
  const location = useLocation()

  const [cartOpen, setCartOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // Any navigation dismisses every overlay — otherwise the cart drawer stays
  // open on top of the page you just navigated to.
  useEffect(() => {
    setCartOpen(false)
    setSearchOpen(false)
  }, [location.pathname, location.search])

  const api = useMemo(
    () => ({
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      openSearch: () => setSearchOpen(true),
    }),
    [],
  )

  const handleSearchClick = useCallback(() => setSearchOpen(true), [])
  const handleCartClick = useCallback(() => setCartOpen(true), [])

  const hideBottomNav = PRODUCT_DETAIL_ROUTE.test(location.pathname)

  return (
    <StorefrontUIContext.Provider value={api}>
      <div className="flex min-h-screen flex-col bg-white">
        <Header onSearchClick={handleSearchClick} onCartClick={handleCartClick} />

        {/*
          `pb-bottom-nav` clears the fixed mobile bottom nav (4rem + iOS safe
          area). Removed from md up where the bottom nav is hidden.

          It stays unconditional below md even on the product page, because the
          buy bar that replaces the nav there is built to the same 4rem + safe
          height — so one clearance rule covers whichever bar is showing.
        */}
        <main id="main-content" className="flex-1 pb-bottom-nav md:pb-0">
          <Outlet />
        </main>

        <Footer />

        {!hideBottomNav && <BottomNav onSearchClick={handleSearchClick} onCartClick={handleCartClick} />}
        <WhatsAppButton />

        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      </div>
    </StorefrontUIContext.Provider>
  )
}

export default StorefrontLayout
