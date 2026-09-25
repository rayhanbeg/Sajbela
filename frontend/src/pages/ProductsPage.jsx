import ProductCatalog from "../components/products/ProductCatalog"

/**
 * /products — the full catalogue.
 * Opens directly into controls and products for a quiet browsing experience.
 */
const ProductsPage = () => (
  <div className="bg-gray-50">
    <ProductCatalog />
  </div>
)

export default ProductsPage
