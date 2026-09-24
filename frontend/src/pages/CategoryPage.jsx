import { useParams } from "react-router-dom"
import { Circle, Gem, Gift, Heart, Palette, Shirt, Sparkles } from "lucide-react"

import ProductCatalog from "../components/products/ProductCatalog"
import { Breadcrumbs, Button } from "../components/ui"
import { CATEGORIES, categoryPath, getCategory } from "../lib/navigation"
import { cn } from "../lib/cn"
import NotFoundPage from "./NotFoundPage"

/**
 * /category/:slug — a real category landing page.
 *
 * This route used to be a redirect to /products?category=<slug>, which meant
 * every category link threw away its own URL. Now it renders the shared
 * catalogue with the category locked, so the route stays canonical and the
 * filter panel shows the filters that are still yours to change.
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

const COPY = {
  bangles: "Glass, metal and handmade bangles — sized to fit, made to be worn every day.",
  earrings: "Studs, hoops and drops for everything from the school run to a wedding.",
  cosmetics: "Everyday beauty picks, chosen for Bangladeshi skin and Bangladeshi weather.",
  necklaces: "Chains, pendants and matched sets that layer as well as they stand alone.",
  rings: "Statement pieces and quiet ones, in sizes that actually stay on.",
  alna: "Traditional pieces for the occasions that deserve them.",
  combo: "Matched sets priced below the cost of buying each piece on its own.",
}

const CategoryPage = () => {
  const { slug } = useParams()
  const category = getCategory(slug)

  // An unknown slug is a 404, not an empty product grid.
  if (!category) return <NotFoundPage />

  const Icon = ICONS[category.slug] || Circle

  return (
    <div className="bg-gray-50">
      {/* ── Category banner ──────────────────────────────────── */}
      <div className="border-b border-gray-100 bg-gradient-to-b from-pink-50 to-white">
        <div className="page-container py-6 md:py-9">
          <Breadcrumbs items={[{ label: "Shop", to: "/products" }, { label: category.label }]} className="mb-4" />

          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm",
                "md:h-16 md:w-16",
                category.accent,
              )}
            >
              <Icon className="h-6 w-6 md:h-7 md:w-7" />
            </span>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-pink-600">{category.tagline}</p>
              <h1 className="mt-1 text-display-sm font-bold text-gray-900">{category.label}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 md:text-base">
                {COPY[category.slug] || `Browse our ${category.label.toLowerCase()} collection.`}
              </p>
            </div>
          </div>

          {/* Horizontal category switcher — faster than going back to the grid. */}
          <ul className="mt-6 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide md:mx-0 md:flex-wrap md:px-0">
            {CATEGORIES.map((item) => {
              const isCurrent = item.slug === category.slug

              return (
                <li key={item.slug} className="shrink-0">
                  <Button
                    to={categoryPath(item.slug)}
                    variant={isCurrent ? "primary" : "outline"}
                    size="sm"
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    {item.label}
                  </Button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <ProductCatalog
        lockedFilters={{ category: category.slug }}
        emptyAction={<Button to="/products">Browse all products</Button>}
      />
    </div>
  )
}

export default CategoryPage
