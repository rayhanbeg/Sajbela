import { BadgeCheck, Headphones, Truck, Wallet } from "lucide-react"

import { SHIPPING, STORE } from "../../lib/navigation"
import { formatPrice } from "../../lib/utils"

/**
 * Trust strip under the hero — the reassurance shoppers look for before they
 * commit, pulled out of the hero's cramped side column into its own band.
 *
 * Palette note: these four cards previously used blue accents (text-blue-600 /
 * bg-blue-50) inside an otherwise pink-branded page. That blue wasn't part of
 * the brand palette, so they now use the existing pink accent. No new colours
 * were introduced.
 */

const ITEMS = [
  {
    icon: Truck,
    title: "Free delivery",
    description: `On orders over ${formatPrice(SHIPPING.freeThreshold)}`,
  },
  {
    icon: Wallet,
    title: "Cash on delivery",
    description: "Pay only when it arrives",
  },
  {
    icon: BadgeCheck,
    title: "Authentic pieces",
    description: "Handmade, quality checked",
  },
  {
    icon: Headphones,
    title: `${STORE.hours} support`,
    description: "We reply on WhatsApp",
  },
]

const TrustBadges = () => {
  return (
    <section aria-label="Why shop with Sajbela" className="hidden border-y border-gray-100 bg-white md:block">
      <div className="page-container py-6 md:py-8">
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {ITEMS.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex items-center gap-3 rounded-card border border-gray-100 bg-gray-50/60 p-3 transition-colors duration-200 hover:border-pink-100 hover:bg-pink-50/50 md:p-4"
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-pink-600 shadow-sm md:h-11 md:w-11"
              >
                <Icon className="h-5 w-5" />
              </span>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{title}</p>
                <p className="mt-0.5 text-xs leading-snug text-gray-500">{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default TrustBadges
