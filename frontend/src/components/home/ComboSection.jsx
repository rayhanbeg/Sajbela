import ProductShowcase from "./ProductShowcase"

/**
 * Combo deals rail — curated multi-piece sets at a bundle price.
 * See ProductShowcase for the shared fetch/loading/error behaviour.
 */
const ComboSection = () => (
  <ProductShowcase
    endpoint="/products/combos/list"
    eyebrow="Better together"
    title="Special combos"
    description="Matched sets that cost less than buying each piece on its own."
    actionLabel="View all combos"
    actionTo="/category/combo"
    layout="rail"
    className="bg-gray-50"
  />
)

export default ComboSection
