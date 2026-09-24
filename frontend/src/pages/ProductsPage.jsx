import { useSearchParams } from "react-router-dom"

import ProductCatalog from "../components/products/ProductCatalog"
import { Breadcrumbs } from "../components/ui"

/**
 * /products — the full catalogue.
 *
 * Almost everything lives in ProductCatalog, which /category/:slug shares.
 * This page only supplies the heading, which changes when you arrive from a
 * search so the results read as "Results for …" rather than "All products".
 */
const ProductsPage = () => {
  const [searchParams] = useSearchParams()
  const search = searchParams.get("search")?.trim()

  return (
    <div className="bg-gray-50">
      <div className="border-b border-gray-100 bg-white">
        <div className="page-container py-5 md:py-7">
          <Breadcrumbs items={[{ label: search ? "Search" : "All products" }]} className="mb-3" />

          <h1 className="text-display-sm font-bold text-gray-900">
            {search ? <>Results for &ldquo;{search}&rdquo;</> : "All products"}
          </h1>

          <p className="mt-1.5 text-sm text-gray-600 md:text-base">
            {search
              ? "Refine with the filters if you don't see what you're after."
              : "Handmade jewelry and beauty picks, delivered across Bangladesh."}
          </p>
        </div>
      </div>

      <ProductCatalog />
    </div>
  )
}

export default ProductsPage
