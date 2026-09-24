import { Star } from "lucide-react"
import { Button, EmptyState, ErrorState, Image, Skeleton } from "../ui"
import { formatDate, formatPrice } from "../../lib/utils"

/**
 * Products waiting for a review.
 *
 * The list is fetched by the page, not here: the tab label carries a count
 * badge, and the order detail dialog needs the same data to decide which line
 * items get a "Write a review" button. One request feeds all three.
 */

const ReviewsSkeleton = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading products to review">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 rounded-card border border-gray-200 bg-white p-4">
        <Skeleton className="h-16 w-16" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" rounded="rounded" />
          <Skeleton className="h-3 w-1/3" rounded="rounded" />
        </div>
        <Skeleton className="h-9 w-28" rounded="rounded-lg" />
      </div>
    ))}
  </div>
)

const ReviewsPanel = ({ items = [], loading, error, onRetry, onReview }) => {
  if (loading && items.length === 0) return <ReviewsSkeleton />

  if (error && items.length === 0) {
    return <ErrorState title="We couldn't load your reviews" description={error} onRetry={onRetry} />
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Star />}
        title="Nothing to review yet"
        description="Once an order is delivered, its items show up here so you can rate them."
        action={
          <Button to="/products" variant="outline" size="lg">
            Browse products
          </Button>
        }
      />
    )
  }

  return (
    <>
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">Waiting for your review</h2>
        <p className="mt-0.5 text-sm text-gray-600">
          A sentence or two is plenty — it's what other shoppers read before they buy.
        </p>
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={`${item.orderId}-${item.product?._id}`}
            className="flex flex-col gap-4 rounded-card border border-gray-200 bg-white p-4 sm:flex-row sm:items-center"
          >
            <Image
              src={item.product?.images?.[0]?.url || item.product?.image}
              alt={item.product?.name || ""}
              aspect="square"
              width={160}
              sizes="64px"
              className="h-16 w-16 shrink-0"
              rounded="rounded-lg"
            />

            <div className="min-w-0 flex-1">
              <h3 className="font-medium leading-snug text-gray-900">{item.product?.name}</h3>
              <p className="mt-1 text-xs text-gray-500">
                Delivered from an order placed {formatDate(item.orderDate)}
                {item.quantity ? ` · ${item.quantity} × ${formatPrice(item.price)}` : ""}
              </p>
            </div>

            <Button
              size="md"
              className="shrink-0"
              leftIcon={<Star className="h-4 w-4" />}
              onClick={() => onReview(item)}
            >
              Write a review
            </Button>
          </li>
        ))}
      </ul>
    </>
  )
}

export default ReviewsPanel
