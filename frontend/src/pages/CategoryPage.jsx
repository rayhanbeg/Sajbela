import { Navigate, useParams } from "react-router-dom"
import { getCategory } from "../lib/navigation"
import NotFoundPage from "./NotFoundPage"

/**
 * Dedicated category route: /category/:slug
 *
 * Currently forwards to the shop page with the category filter pre-applied so
 * every category link works today. The full category experience (banner,
 * curated copy, category-scoped filters) lands with the shop-page redesign.
 */
const CategoryPage = () => {
  const { slug } = useParams()
  const category = getCategory(slug)

  if (!category) return <NotFoundPage />

  return <Navigate to={`/products?category=${category.slug}`} replace />
}

export default CategoryPage
