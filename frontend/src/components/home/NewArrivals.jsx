import ProductShowcase from "./ProductShowcase"

/**
 * New arrivals rail. All of the fetch/loading/error/card logic lives in
 * ProductShowcase — this file only describes *which* products to show.
 */
const NewArrivals = () => (
  <ProductShowcase
    endpoint="/products/new-arrivals/list"
    title="New arrivals"
    actionLabel="View all"
    actionTo="/products?section=new-arrivals"
    layout="rail"
    className="bg-white"
  />
)

export default NewArrivals
