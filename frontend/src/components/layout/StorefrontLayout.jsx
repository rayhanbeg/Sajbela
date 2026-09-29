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
 * Routes that swap the bottom nav for a bar of their own. Two fixed bars stacked
 * on a phone is 136px — a fifth of the viewport — gone before any content, and
 * on both of these pages the page's own action beats the navigation:
 *
 *  - /products/:id — Add to cart / Buy now
 *  - /checkout     — the running total and Place order
 *
 * Checkout is also the one page where inviting someone to wander off is actively
 * against its purpose, which is why every store strips its nav here.
 *
 * Nothing becomes unreachable: the header is sticky and carries the wordmark,
 * search and cart, and both pages open with breadcrumbs back up the funnel.
 *
 * Matched on the route rather than signalled from the page, because a flag the
 * page raised on mount would leave the nav rendered for the first paint and then
 * yank it out from under the content. `/products` — the shop grid — keeps its
 * nav; only `/products/:id` is matched.
 */
const PRODUCT_DETAIL_ROUTE = /^\/products\/[^/]+\/?$/
const CHECKOUT_ROUTE = /^\/checkout\/?$/

const OWN_BOTTOM_BAR = [PRODUCT_DETAIL_ROUTE, CHECKOUT_ROUTE]

/*
 * The WhatsApp button also goes, on checkout only.
 *
 * Practically: it's `z-header`, and checkout's submit bar runs to `lg` while the
 * bottom nav it's positioned around stops at `md` — so between those two widths
 * the FAB lands on top of the Place order button. Editorially: a floating "chat
 * with us" over the pay button is a way out of the funnel at the one moment
 * there shouldn't be one. Support is a tap away again the moment the order lands.
 *
 * The product page keeps it — its bar is `md:hidden`, so the two never share a
 * viewport, and "ask about this product" is worth the corner it sits in.
 */

/*
 * The product page also hides the header, but only below md.
 *
 * On a phone that page is now a full-bleed photo starting at y=0 with its own
 * floating back / share / cart controls — a pink bar above it would be a second
 * navigation layer over a screen that already has one, and it would push the
 * image the whole point of the layout is to lead with down by 64px.
 *
 * Only below md, and via a class rather than by not rendering it: from md up
 * the page is a two-column desktop layout where stripping the site nav would be
 * hostile, and `hidden md:block` on the <header> itself keeps `position: sticky`
 * working — a wrapper div would become the sticky element's containing block and
 * unstick it the moment the header scrolled past its own height.
 */
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

  const hideBottomNav = OWN_BOTTOM_BAR.some((route) => route.test(location.pathname))
  const hideWhatsApp = CHECKOUT_ROUTE.test(location.pathname)
  const headerOnDesktopOnly = PRODUCT_DETAIL_ROUTE.test(location.pathname)

  return (
    <StorefrontUIContext.Provider value={api}>
      <div className="flex min-h-screen flex-col bg-white">
        <Header
          className={headerOnDesktopOnly ? "hidden md:block" : undefined}
          onSearchClick={handleSearchClick}
          onCartClick={handleCartClick}
        />

        {/*
          `pb-bottom-nav` clears the fixed mobile bottom nav (4rem + iOS safe
          area). Removed from md up where the bottom nav is hidden.

          It stays unconditional below md even on the pages listed in
          OWN_BOTTOM_BAR, because the bars that replace the nav there are built
          to the same 4rem + safe height — so one clearance rule covers
          whichever bar is showing. Checkout's bar is taller and carries an
          error line, so that page tops this up with its own bottom padding.
        */}
        <main id="main-content" className="flex-1 pb-bottom-nav md:pb-0">
          <Outlet />
        </main>

        <Footer />

        {!hideBottomNav && <BottomNav onSearchClick={handleSearchClick} onCartClick={handleCartClick} />}
        {!hideWhatsApp && <WhatsAppButton />}

        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      </div>
    </StorefrontUIContext.Provider>
  )
}

export default StorefrontLayout
