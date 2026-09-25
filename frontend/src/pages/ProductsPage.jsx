import { useSearchParams } from "react-router-dom"

import ProductCatalog from "../components/products/ProductCatalog"
import { SECTIONS } from "../lib/catalog"
import { Breadcrumbs } from "../components/ui"

/**
 * /products — the full catalogue.
 *
 * Almost everything lives in ProductCatalog, which /category/:slug shares.
 * This page only supplies the heading, which changes when you arrive from a
 * search or from one of the home-page rails (?section=new-arrivals).
 */
const ProductsPage = () => {
  const [searchParams] = useSearchParams()
  const search = searchParams.get("search")?.trim()
  const section = SECTIONS.find((item) => item.value === searchParams.get("section"))

  const heading = search ? <>Results for &ldquo;{search}&rdquo;</> : section?.label || "All products"

  return (
    <div className="bg-gray-50">
      <div className="border-b border-gray-100 bg-white">
        <div className="page-container py-5 md:py-7">
          <Breadcrumbs items={[{ label: search ? "Search" : heading }]} className="mb-3" />

          <h1 className="text-display-sm font-bold text-gray-900">{heading}</h1>
        </div>
      </div>

      <ProductCatalog />
    </div>
  )
}

export default ProductsPage
