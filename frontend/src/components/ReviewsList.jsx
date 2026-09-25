import { useCallback, useEffect, useState } from "react"
import { Camera, MessageSquare } from "lucide-react"

import { reviewsAPI } from "../lib/api"
import { formatDate } from "../lib/utils"
import { Badge, Button, EmptyState, ErrorState, Image, Rating, Skeleton } from "./ui"

/**
 * Reviews for one product, rendered inside the PDP's Reviews tab.
 *
 * This component predated the redesign and was the last storefront view still
 * building everything by hand. Fixed here:
 *
 *  - "Load More Reviews" called `setReviews(response.data.reviews)`, replacing
 *    the list instead of appending. Clicking it showed reviews 6–10 and threw
 *    away 1–5, with no way back except a reload. It appends now.
 *  - The "Helpful (0)" button had no onClick and there is no helpful/vote
 *    route in backend/routes/reviews.js, so it could never do anything. Gone,
 *    like the "Remember me" checkbox on the sign-in form.
 *  - A failed fetch only hit console.error and then rendered "No reviews yet",
 *    telling shoppers a product had no reviews when the request had failed.
 *  - Its own five-star loop, skeleton, green badge and date formatter are now
 *    Rating / Skeleton / Badge / lib/utils.formatDate, so stars, dates and
 *    badges match the rest of the site.
 *  - Review photos went through a raw <img> with no lazy loading and no
 *    srcset; full-size uploads were downloaded to fill an 80px thumbnail.
 *  - There's no "Customer Reviews (n)" heading any more — the tab that owns
 *    this panel is already labelled "Reviews" and carries the same count.
 */

const PAGE_SIZE = 5

const ReviewsList = ({ productId }) => {
  const [reviews, setReviews] = useState([])
  const [pagination, setPagination] = useState({})
  const [status, setStatus] = useState("loading") // loading | ready | error
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchPage = useCallback(
    async (page, { append = false, signal } = {}) => {
      if (append) setLoadingMore(true)
      else setStatus("loading")

      try {
        const { data } = await reviewsAPI.getProductReviews(productId, { page, limit: PAGE_SIZE }, { signal })
        const incoming = data.reviews || []

        // Append, don't replace — see the note above.
        setReviews((prev) => (append ? [...prev, ...incoming] : incoming))
        setPagination(data.pagination || {})
        setStatus("ready")
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") return
        console.error("Fetch reviews error:", error)
        // A failed "load more" keeps the reviews already on screen.
        if (!append) setStatus("error")
      } finally {
        setLoadingMore(false)
      }
    },
    [productId],
  )

  useEffect(() => {
    const controller = new AbortController()
    setReviews([])
    fetchPage(1, { signal: controller.signal })
    return () => controller.abort()
  }, [fetchPage])

  if (status === "loading") {
    return (
      <div className="space-y-4" aria-hidden="true">
        {[0, 1, 2].map((row) => (
          <div key={row} className="rounded-card border border-gray-100 p-4 sm:p-5">
            <Skeleton className="h-4 w-28" rounded="rounded" />
            <Skeleton className="mt-2.5 h-3 w-40" rounded="rounded" />
            <Skeleton className="mt-3.5 h-3.5 w-full" rounded="rounded" />
            <Skeleton className="mt-2 h-3.5 w-3/4" rounded="rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (status === "error") {
    return <ErrorState size="sm" description="We couldn't load the reviews." onRetry={() => fetchPage(1)} />
  }

  if (reviews.length === 0) {
    return <EmptyState icon={<MessageSquare />} title="No reviews yet" description="Be the first to review this." size="sm" />
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {reviews.map((review) => (
          <li key={review._id} className="rounded-card border border-gray-100 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <Rating value={review.rating} size="sm" showCount={false} />
              {review.isVerified && (
                <Badge tone="success" size="sm">
                  Verified purchase
                </Badge>
              )}
            </div>

            <p className="mt-1.5 text-xs text-gray-500">
              {review.user?.name || "Anonymous"} · {formatDate(review.createdAt)}
            </p>

            {review.title && <p className="mt-2.5 font-medium text-gray-900">{review.title}</p>}

            {review.comment && (
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-gray-700">{review.comment}</p>
            )}

            {review.images?.length > 0 && (
              <div className="mt-3">
                <p className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Camera aria-hidden="true" className="h-3.5 w-3.5" />
                  Customer photos
                </p>

                <ul className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {review.images.map((image, index) => (
                    <li key={`${review._id}-${index}`}>
                      <a
                        href={image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
                      >
                        <Image
                          src={image}
                          alt={`Photo ${index + 1} from this review`}
                          aspect="square"
                          width={200}
                          sizes="(max-width: 640px) 22vw, 120px"
                          rounded="rounded-lg"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>

      {pagination.hasNext && (
        <Button
          variant="outline"
          onClick={() => fetchPage((pagination.currentPage || 1) + 1, { append: true })}
          loading={loadingMore}
          loadingText="Loading…"
        >
          Load more
        </Button>
      )}
    </div>
  )
}

export default ReviewsList
