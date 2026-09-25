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
    <section className="bg-gray-50 py-10 md:py-14">
      <div className="page-container">
        <SectionHeader
          eyebrow="Browse"
          title="Shop by category"
          actionLabel="View all products"
          actionTo="/products"
        />

        {/*
          Mobile is a snap rail rather than a grid: seven items in a 3- or
          4-column grid always leaves an orphan row, and tiles small enough to
          avoid that stop being comfortable 44px touch targets.
        */}
        <ul
          className={cn(
            "-mx-4 flex snap-x-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide",
            "sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 sm:pb-0",
            "lg:grid-cols-7 lg:gap-4",
          )}
        >
          {CATEGORIES.map((category) => {
            const Icon = ICONS[category.slug] || Circle

            return (
              <li key={category.slug} className="w-[5.75rem] shrink-0 snap-start-always sm:w-auto">
                <Link
                  to={categoryPath(category.slug)}
                  className={cn(
                    "group flex h-full flex-col items-center gap-2 rounded-card border border-transparent bg-white p-3 text-center",
                    "shadow-card transition-all duration-300 ease-out-expo",
                    "hover:-translate-y-1 hover:border-pink-100 hover:shadow-card-hover",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2",
                    "md:p-4",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-white",
                      "transition-transform duration-300 ease-out-expo group-hover:scale-110",
                      "md:h-14 md:w-14",
                      category.accent,
                    )}
                  >
                    <Icon className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2} />
                  </span>

                  <span className="text-xs font-semibold leading-tight text-gray-900 transition-colors group-hover:text-pink-600 md:text-sm">
                    {category.label}
                  </span>

                  {/* Taglines are extra context, not essential — hidden where space is tight. */}
                  <span className="hidden text-[0.6875rem] leading-tight text-gray-500 lg:block">
                    {category.tagline}
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
