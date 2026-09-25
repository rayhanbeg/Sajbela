import { Link } from "react-router-dom"
import { Circle, Gem, Gift, Heart, Palette, Shirt, Sparkles } from "lucide-react"

import { CATEGORIES, categoryPath } from "../../lib/navigation"
import { cn } from "../../lib/cn"
import { SectionHeader } from "../ui"

/**
 * Shop-by-category tiles.
 *
 * Reads CATEGORIES from lib/navigation instead of keeping its own copy of the
 * list (this file, Header, ProductFilters and Footer all had separate copies),
 * and links to the canonical /category/:slug route rather than a query string.
 *
 * The emoji icons were swapped for lucide glyphs — emoji render at different
 * sizes and weights on Android, iOS and Windows, so the tiles never lined up.
 *
 * Design note: each tile used to be a raised white card with a shadow, a hover
 * lift and a saturated gradient disc, seven of them in a row in seven different
 * hues. That's a lot of chrome for what is really just a list of seven links.
 * They're flat now — one hairline border, the icon inked rather than filled,
 * and the label doing the identifying. Type scale runs 13px → 14px against the
 * section heading, so the tiles read as one step down from it rather than three.
 */

const ICONS = {
  bangles: Circle,
  earrings: Sparkles,
  cosmetics: Palette,
  necklaces: Heart,
  rings: Gem,
  alna: Shirt,
  combo: Gift,
}

const CategorySection = () => {
  return (
    <section className="bg-gray-50 py-8 md:py-12">
      <div className="page-container">
        <SectionHeader title="Categories" align="left" actionLabel="View all" actionTo="/products" />

        {/*
          Mobile is a snap rail rather than a grid: seven items in a 3- or
          4-column grid always leaves an orphan row, and tiles small enough to
          avoid that stop being comfortable 44px touch targets.
        */}
        <ul
          className={cn(
            "-mx-4 flex snap-x-mandatory gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-hide",
            "sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0",
            "lg:grid-cols-7",
          )}
        >
          {CATEGORIES.map((category) => {
            const Icon = ICONS[category.slug] || Circle

            return (
              <li key={category.slug} className="w-[5.25rem] shrink-0 snap-start-always sm:w-auto">
                <Link
                  to={categoryPath(category.slug)}
                  className={cn(
                    "group flex h-full flex-col items-center gap-2 rounded-card border border-gray-200 bg-white px-2 py-3.5",
                    "text-center transition-colors duration-200",
                    "hover:border-pink-300 hover:bg-pink-50/40",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className="h-6 w-6 text-gray-400 transition-colors group-hover:text-pink-600"
                    strokeWidth={1.75}
                  />

                  <span className="text-[0.8125rem] font-medium leading-tight text-gray-800 transition-colors group-hover:text-pink-600 sm:text-sm">
                    {category.label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export default CategorySection
