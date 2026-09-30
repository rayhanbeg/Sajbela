import ProductShowcase from "./ProductShowcase"

/**
 * Combo deals rail — curated multi-piece sets at a bundle price.
 * See ProductShowcase for the shared fetch/loading/error behaviour.
 *
 * White like the rest of the home page. This was the last grey band left, and
 * one grey stripe in an otherwise white page reads as a mistake rather than as
 * a section boundary.
 */
const ComboSection = () => (
  <ProductShowcase
    endpoint="/products/combos/list"
    title="Combo sets"
    actionLabel="View all"
    actionTo="/category/combo"
    layout="rail"
    className="bg-white"
  />
)

export default ComboSection
