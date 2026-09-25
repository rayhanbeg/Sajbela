import { BadgeCheck, Headphones, Truck, Wallet } from "lucide-react"

import { SHIPPING, STORE } from "../../lib/navigation"
import { formatPrice } from "../../lib/utils"

/**
 * Reassurance strip under the hero.
 *
 * Two things were wrong with the old version. It was `hidden md:block`, so the
 * phone — where most of the traffic is, and where "cash on delivery" is the
 * single biggest reason a Bangladeshi shopper commits — never saw it at all.
 * And each of the four items carried a bold title plus a grey subtitle, eight
 * strings of chrome for four facts. Each fact is now one line, and it shows at
 * every width.
 *
 * Palette note: these cards previously used blue accents (text-blue-600 /
 * bg-blue-50) inside an otherwise pink-branded page. That blue wasn't part of
 * the brand palette, so they use the existing pink accent. No new colours.
 */

const ITEMS = [
  { icon: Truck, label: `Free delivery over ${formatPrice(SHIPPING.freeThreshold)}` },
  { icon: Wallet, label: "Cash on delivery" },
  { icon: BadgeCheck, label: "Quality checked" },
  { icon: Headphones, label: `${STORE.hours} on WhatsApp` },
]

const TrustBadges = () => (
  <section aria-label="Why shop with Sajbela" className="border-y border-gray-100 bg-white">
    <div className="page-container py-3 md:py-4">
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-4 sm:gap-x-6">
        {ITEMS.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-2 text-gray-700">
            <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-pink-600" />
            <span className="truncate text-xs md:text-sm">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  </section>
)

export default TrustBadges
