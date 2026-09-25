import ProductShowcase from "./ProductShowcase"

/**
 * Best sellers / featured grid. Uses the grid layout rather than a rail so the
 * page ends on a substantial block of product rather than another side-scroller.
 *
 * This section previously mounted a second Swiper instance purely to show four
 * cards; the shared showcase renders a plain responsive grid instead, which
 * drops that JavaScript entirely.
 */
const FeaturedProducts = () => (
  <ProductShowcase
    endpoint="/products/featured/list"
    title="Best sellers"
    actionLabel="Shop all"
    actionTo="/products"
    layout="grid"
    limit={8}
    skeletonCount={8}
    className="bg-white"
  />
)

export default FeaturedProducts
