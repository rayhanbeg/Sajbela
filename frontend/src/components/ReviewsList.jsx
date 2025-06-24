import { useState, useEffect } from "react"
import { Star, ThumbsUp, Camera } from "lucide-react"
import { reviewsAPI } from "../lib/api"

const ReviewsList = ({ productId }) => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})

  useEffect(() => {
    fetchReviews()
  }, [productId])

  const fetchReviews = async (page = 1) => {
    try {
      setLoading(true)
      const response = await reviewsAPI.getProductReviews(productId, { page, limit: 5 })
      setReviews(response.data.reviews)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error("Fetch reviews error:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ))
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Customer Reviews ({pagination.total})</h3>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review._id} className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="flex">{renderStars(review.rating)}</div>
                  {review.isVerified && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Verified Purchase</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  By {review.user?.name || "Anonymous"} • {formatDate(review.createdAt)}
                </p>
              </div>
            </div>

            {review.title && <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>}

            {review.comment && <p className="text-gray-700 mb-3">{review.comment}</p>}

            {review.images && review.images.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center mb-2">
                  <Camera className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="text-sm text-gray-600">Customer Photos</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {review.images.map((image, index) => (
                    <img
                      key={index}
                      src={image || "/placeholder.svg"}
                      alt={`Review ${index + 1}`}
                      className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-80"
                      onClick={() => window.open(image, "_blank")}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500">
              <button className="flex items-center space-x-1 hover:text-pink-600">
                <ThumbsUp className="h-4 w-4" />
                <span>Helpful ({review.helpfulCount || 0})</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {pagination.hasNext && (
        <div className="text-center">
          <button
            onClick={() => fetchReviews(pagination.currentPage + 1)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Load More Reviews
          </button>
        </div>
      )}
    </div>
  )
}

export default ReviewsList
