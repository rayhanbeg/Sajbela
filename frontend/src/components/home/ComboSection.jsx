import ProductShowcase from "./ProductShowcase"

/**
 * Combo deals rail — curated multi-piece sets at a bundle price.
 * See ProductShowcase for the shared fetch/loading/error behaviour.
 */
const ComboSection = () => (
  <ProductShowcase
    endpoint="/products/combos/list"
    title="Combo sets"
    actionLabel="View all"
    actionTo="/category/combo"
    layout="rail"
    className="bg-gray-50"
  />
)

export default ComboSection
