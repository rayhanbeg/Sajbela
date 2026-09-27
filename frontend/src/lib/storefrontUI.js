import { createContext, useContext } from "react"

/**
 * Context for the storefront's three overlays (mobile menu, search, cart
 * drawer), so any component can open them without prop-drilling:
 *
 *   const { openCart } = useStorefrontUI()
 *   await addToCart(...); openCart()
 *
 * It lives here rather than in StorefrontLayout so that components rendered
 * deep inside the tree can consume it without importing the entire layout
 * module. The product detail page is the current consumer: it sits *inside* the
 * layout that owns the cart drawer, and reaching for the layout from a page it
 * renders is how you get a circular import.
 */

export const StorefrontUIContext = createContext(null)

/** No-op fallback outside the provider (e.g. the admin shell), so a shared
 *  component calling openCart() can't crash a page that has no cart drawer. */
const NOOP_API = {
  openCart: () => {},
  closeCart: () => {},
  openSearch: () => {},
  openMenu: () => {},
}

export function useStorefrontUI() {
  return useContext(StorefrontUIContext) || NOOP_API
}
