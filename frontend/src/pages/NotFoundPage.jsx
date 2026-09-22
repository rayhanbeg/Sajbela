import { useNavigate } from "react-router-dom"
import { ArrowLeft, Home, Search, ShoppingBag } from "lucide-react"
import { Button } from "../components/ui"
import { CATEGORIES, categoryPath } from "../lib/navigation"

/**
 * 404 page. Previously an unmatched URL rendered a blank <main> with no
 * explanation and no way out.
 */
const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <div className="page-container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-[5rem] font-bold leading-none text-pink-100 md:text-[7rem]" aria-hidden="true">
        404
      </p>

      <h1 className="-mt-4 text-display-sm font-bold text-gray-900 md:-mt-6">Page not found</h1>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-600 md:text-base">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has moved. Let&rsquo;s get you back to shopping.
      </p>

      <div className="mt-7 flex flex-col-reverse gap-2.5 sm:flex-row">
        <Button variant="outline" onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Go back
        </Button>
        <Button to="/" leftIcon={<Home className="h-4 w-4" />}>
          Back to home
        </Button>
        <Button to="/products" variant="secondary" leftIcon={<ShoppingBag className="h-4 w-4" />}>
          Shop all
        </Button>
      </div>

      <div className="mt-12 w-full max-w-lg">
        <p className="mb-3 flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
          <Search aria-hidden="true" className="h-3.5 w-3.5" />
          Popular categories
        </p>

        <ul className="flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((category) => (
            <li key={category.slug}>
              <Button to={categoryPath(category.slug)} variant="outline" size="sm">
                {category.label}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default NotFoundPage
