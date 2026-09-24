import { createContext, useContext } from "react"

/**
 * Context for the storefront's three overlays (mobile menu, search, cart
 * drawer), so any component can open them without prop-drilling:
 *
 *   const { openCart } = useStorefrontUI()
 *   await addToCart(...); openCart()
 *
 * It lives here rather than in StorefrontLayout so that leaf components like
 * ProductCard can consume it without importing the entire layout module —
 * ProductCard is rendered *inside* the cart drawer's sibling tree, and pulling
 * the layout in from a card is how you get a circular import.
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
