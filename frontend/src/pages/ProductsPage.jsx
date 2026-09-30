import ProductCatalog from "../components/products/ProductCatalog"

/**
 * /products — the full catalogue.
 * Opens directly into controls and products for a quiet browsing experience.
 *
 * White, not grey. The grey field existed to give the white product cards an
 * edge to sit against, but the cards lost their panel — they're bare photos with
 * a caption now — so the grey was framing nothing and just made the photos look
 * dimmer than they are.
 */
const ProductsPage = () => (
  <div className="bg-white">
    <ProductCatalog />
  </div>
)

export default ProductsPage
