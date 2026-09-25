import ProductShowcase from "./ProductShowcase"

/**
 * New arrivals rail. All of the fetch/loading/error/card logic lives in
 * ProductShowcase — this file only describes *which* products to show.
 */
const NewArrivals = () => (
  <ProductShowcase
    endpoint="/products/new-arrivals/list"
    eyebrow="Just in"
    title="New arrivals"
    actionLabel="View all new arrivals"
    actionTo="/products?section=new-arrivals"
    layout="rail"
    className="bg-white"
  />
)

export default NewArrivals
