import { useParams } from "react-router-dom"

import ProductCatalog from "../components/products/ProductCatalog"
import { Breadcrumbs, Button } from "../components/ui"
import { CATEGORIES, categoryPath, getCategory } from "../lib/navigation"
import NotFoundPage from "./NotFoundPage"

/**
 * /category/:slug — a real category landing page.
 *
 * This route used to be a redirect to /products?category=<slug>, which meant
 * every category link threw away its own URL. Now it renders the shared
 * catalogue with the category locked, so the route stays canonical and the
 * filter panel shows the filters that are still yours to change.
 *
 * ── No icon ──────────────────────────────────────────────────────────────
 *
 * The banner used to lead with a 64px gradient tile holding a lucide glyph —
 * a circle for bangles, a shirt for alna, a palette for cosmetics. It was
 * decoration standing in for the thing itself: the grid two inches below is
 * full of photographs of the actual products, and no abstract mark competes
 * with those. It also promised a taxonomy the icon set couldn't keep — a
 * circle and a heart tell you nothing about bangles versus necklaces, and
 * every new category needed a glyph picked for it or fell back to the circle.
 *
 * What's left is what the shopper came for: where they are, what this is, and
 * the row of sibling categories.
 */

const CategoryPage = () => {
  const { slug } = useParams()
  const category = getCategory(slug)

  // An unknown slug is a 404, not an empty product grid.
  if (!category) return <NotFoundPage />

  return (
    <div className="bg-gray-50">
      {/* ── Category banner ──────────────────────────────────── */}
      <div className="border-b border-gray-100 bg-gradient-to-b from-pink-50 to-white">
        <div className="page-container py-6 md:py-9">
          <Breadcrumbs items={[{ label: "Shop", to: "/products" }, { label: category.label }]} className="mb-4" />

          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-pink-600">{category.tagline}</p>
          <h1 className="mt-1 text-display-sm font-bold text-gray-900">{category.label}</h1>

          {/* Horizontal category switcher — faster than going back to the grid. */}
          <ul className="mt-6 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide sm:-mx-6 sm:px-6 md:mx-0 md:flex-wrap md:px-0">
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

      {/*
        bg-gray-50 to match /products. The page body is white, so without this
        the toolbar's white outline buttons and the white product cards had no
        edge against it — the sidebar used to carry a border that hid the
        problem, and it's gone now.
      */}
      <div className="bg-gray-50">
        <ProductCatalog
          lockedFilters={{ category: category.slug }}
          emptyAction={<Button to="/products">Browse all products</Button>}
        />
      </div>
    </div>
  )
}

export default CategoryPage
