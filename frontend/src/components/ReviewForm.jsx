import { useState } from "react"
import { Star, X, Camera } from "lucide-react"
import { reviewsAPI, uploadAPI } from "../lib/api"

const ReviewForm = ({ product, orderId, onClose, onReviewSubmitted }) => {
  const [formData, setFormData] = useState({
    rating: 0,
    title: "",
    comment: "",
    images: [],
  })
  const [hoveredRating, setHoveredRating] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleRatingClick = (rating) => {
    setFormData({ ...formData, rating })
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = files.map((file) => uploadAPI.single(file))
      const responses = await Promise.all(uploadPromises)

      const newImages = responses.map((response) => response.data.imageUrl)
      setFormData({
        ...formData,
        images: [...formData.images, ...newImages].slice(0, 4), // Max 4 images
      })
    } catch (error) {
      console.error("Image upload error:", error)
      alert("Failed to upload images")
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index)
    setFormData({ ...formData, images: newImages })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.rating === 0) {
      alert("Please select a rating")
      return
    }

    setSubmitting(true)
    try {
      await reviewsAPI.createReview({
        productId: product._id,
        orderId,
        ...formData,
      })

      alert("Review submitted successfully!")
      onReviewSubmitted()
      onClose()
    } catch (error) {
      console.error("Submit review error:", error)
      alert(error.response?.data?.message || "Failed to submit review")
    } finally {
      setSubmitting(false)
    }
  }

  const getRatingText = (rating) => {
    const texts = {
      1: "Poor",
      2: "Fair",
      3: "Good",
      4: "Very Good",
      5: "Excellent",
    }
    return texts[rating] || ""
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Write a Review</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Product Info */}
          <div className="flex items-center mb-6 p-4 bg-gray-50 rounded-lg">
            <img
              src={product.images?.[0]?.url || product.image || "/placeholder.svg"}
              alt={product.name}
              className="w-16 h-16 object-cover rounded"
            />
            <div className="ml-4">
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-600">Share your experience with this product</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= (hoveredRating || formData.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                {formData.rating > 0 && (
                  <span className="ml-2 text-sm font-medium text-gray-700">{getRatingText(formData.rating)}</span>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Review Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Summarize your review in a few words"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                maxLength={100}
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
              <textarea
                name="comment"
                value={formData.comment}
                onChange={handleInputChange}
                placeholder="Tell others about your experience with this product..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.comment.length}/1000 characters</p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Add Photos (Optional)</label>
              <div className="space-y-4">
                {/* Upload Button */}
                <div className="flex items-center">
                  <label className="cursor-pointer flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Camera className="h-5 w-5 mr-2" />
                    {uploading ? "Uploading..." : "Add Photos"}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading || formData.images.length >= 4}
                    />
                  </label>
                  <span className="ml-2 text-xs text-gray-500">Max 4 photos</span>
                </div>

                {/* Image Preview */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Review ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || formData.rating === 0}
                className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ReviewForm
