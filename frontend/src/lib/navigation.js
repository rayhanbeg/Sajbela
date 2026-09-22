/**
 * Single source of truth for categories and navigation links.
 *
 * These lists were previously duplicated across Header, CategorySection,
 * ProductFilters and Footer, which is how they drifted out of sync. Anything
 * that renders a category must read it from here.
 *
 * `slug` values MUST match the `category` enum on the Product model:
 *   bangles | earrings | cosmetics | necklaces | rings | alna | combo
 */

export const CATEGORIES = [
  {
    slug: "bangles",
    label: "Bangles",
    tagline: "Handmade & glass",
    // Gradients are decorative accents for the category tiles, not brand colour.
    accent: "from-pink-500 to-rose-500",
  },
  {
    slug: "earrings",
    label: "Earrings",
    tagline: "Studs & drops",
    accent: "from-purple-500 to-indigo-500",
  },
  {
    slug: "cosmetics",
    label: "Cosmetics",
    tagline: "Everyday beauty",
    accent: "from-blue-500 to-cyan-500",
  },
  {
    slug: "necklaces",
    label: "Necklaces",
    tagline: "Chains & sets",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    slug: "rings",
    label: "Rings",
    tagline: "Statement picks",
    accent: "from-orange-500 to-red-500",
  },
  {
    slug: "alna",
    label: "Alna",
    tagline: "Traditional wear",
    accent: "from-yellow-500 to-amber-500",
  },
  {
    slug: "combo",
    label: "Combo",
    tagline: "Better together",
    accent: "from-violet-500 to-purple-500",
  },
]

/** Canonical category page URL. */
export const categoryPath = (slug) => `/category/${slug}`

/** Look up a category by slug, case-insensitively. */
export function getCategory(slug) {
  if (!slug) return null
  const normalised = String(slug).trim().toLowerCase()
  return CATEGORIES.find((c) => c.slug === normalised) || null
}

/** Display label for a slug, falling back to the raw value. */
export function categoryLabel(slug) {
  return getCategory(slug)?.label || slug || ""
}

/** Primary nav — the links that appear in the desktop top bar. */
export const PRIMARY_NAV = [
  { label: "Home", to: "/" },
  { label: "Shop All", to: "/products" },
]

/** Secondary nav — footer + mobile off-canvas menu. */
export const SECONDARY_NAV = [
  { label: "About Us", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "Shipping Info", to: "/shipping" },
  { label: "Returns", to: "/returns" },
  { label: "FAQ", to: "/faq" },
]

export const LEGAL_NAV = [
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms of Service", to: "/terms" },
]

/** Store contact details, referenced by the header bar, footer and contact page. */
export const STORE = {
  name: "Sajbela",
  nameBn: "সাজবেলা",
  tagline: "Your Beauty, Our Priority",
  phone: "+8801782-723804",
  phoneHref: "tel:+8801782723804",
  whatsapp: "8801782723804",
  location: "Dhaka, Bangladesh",
  hours: "24/7",
}

/** Shipping rules — mirrored in CheckoutPage and the shipping info page. */
export const SHIPPING = {
  freeThreshold: 2000,
  insideDhaka: 60,
  outsideDhaka: 120,
}
