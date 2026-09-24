import { useRef, useState } from "react"
import { Camera, X } from "lucide-react"
import { Button, FormField, IconButton, Image, Input, Modal, RatingInput, Textarea, useToast } from "./ui"
import { reviewsAPI, uploadAPI } from "../lib/api"

/**
 * Write a product review.
 *
 * Changes from the previous version:
 *  - Sits in the shared <Modal>: focus trap, Escape to close, background
 *    scroll lock. The old overlay had none of them, so on a phone the page
 *    behind it scrolled under the form.
 *  - Four `alert()` calls became toasts, including the one that fired on
 *    success — a modal dialog to acknowledge a modal dialog.
 *  - "Please select a rating" was an alert with no visual link to the field.
 *    It's now inline validation next to the stars.
 *  - Photo uploads report which files failed instead of throwing the whole
 *    batch away, and the file input is cleared so re-picking the same file
 *    after a failed upload actually fires a change event.
 */

const MAX_IMAGES = 4

const RATING_TEXT = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very good",
  5: "Excellent",
}

const ReviewForm = ({ product, orderId, onClose, onReviewSubmitted }) => {
  const toast = useToast()
  const fileInputRef = useRef(null)

  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState("")
  const [comment, setComment] = useState("")
  const [images, setImages] = useState([])
  const [ratingError, setRatingError] = useState("")
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const busy = uploading || submitting
  const remaining = MAX_IMAGES - images.length

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []).slice(0, remaining)
    // Reset immediately: without this, picking the same file again after a
    // failed upload is a no-op because the input's value hasn't changed.
    event.target.value = ""
    if (files.length === 0) return

    setUploading(true)
    try {
      const results = await Promise.allSettled(files.map((file) => uploadAPI.single(file)))

      const uploaded = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value.data?.imageUrl)
        .filter(Boolean)

      const failed = results.length - uploaded.length

      if (uploaded.length > 0) setImages((prev) => [...prev, ...uploaded].slice(0, MAX_IMAGES))

      if (failed > 0) {
        toast.error(failed === 1 ? "One photo didn't upload" : `${failed} photos didn't upload`, {
          description: "Check the file size and try again.",
        })
      }
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (rating === 0) {
      setRatingError("Pick a star rating")
      return
    }

    setSubmitting(true)
    try {
      await reviewsAPI.createReview({
        productId: product._id,
        orderId,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        images,
      })

      toast.success("Thanks for your review", { description: "It'll appear on the product page shortly." })
      onReviewSubmitted?.()
      onClose()
    } catch (error) {
      console.error("Submit review error:", error)
      toast.error("Couldn't submit your review", {
        description: error.response?.data?.message || "Please check your connection and try again.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      closeOnBackdrop={!busy}
      size="lg"
      title="Write a review"
      description="Reviews are public and shown with your first name."
      footer={
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
          <Button variant="outline" fullWidth disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="review-form"
            fullWidth
            loading={submitting}
            loadingText="Posting…"
            disabled={uploading}
          >
            Post review
          </Button>
        </div>
      }
    >
      <div className="mb-6 flex items-center gap-4 rounded-lg bg-gray-50 p-3.5">
        <Image
          src={product.images?.[0]?.url || product.image}
          alt={product.name || ""}
          aspect="square"
          width={160}
          sizes="56px"
          className="h-14 w-14 shrink-0"
          rounded="rounded-lg"
        />
        <div className="min-w-0">
          <h3 className="font-medium leading-snug text-gray-900">{product.name}</h3>
          <p className="mt-0.5 text-sm text-gray-600">How was it?</p>
        </div>
      </div>

      <form id="review-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Not a <FormField>: the stars are a radiogroup, and a <label for> can't
            point at one, so the label is a plain span with its own error line. */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-gray-700">
            Your rating
            <span className="ml-0.5 text-red-500" aria-hidden="true">
              *
            </span>
          </span>

          <div className="flex items-center gap-3">
            <RatingInput
              value={rating}
              size="lg"
              disabled={submitting}
              onChange={(value) => {
                setRating(value)
                setRatingError("")
              }}
            />
            {rating > 0 && <span className="text-sm font-medium text-gray-700">{RATING_TEXT[rating]}</span>}
          </div>

          {ratingError && (
            <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
              {ratingError}
            </p>
          )}
        </div>

        <FormField label="Headline" hint="Optional — a few words that sum it up." htmlFor="review-title">
          {(field) => (
            <Input
              {...field}
              size="lg"
              name="title"
              maxLength={100}
              placeholder="e.g. Looks even better in person"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          )}
        </FormField>

        <FormField
          label="Your review"
          hint={`${comment.length}/1000 characters`}
          htmlFor="review-comment"
        >
          {(field) => (
            <Textarea
              {...field}
              name="comment"
              rows={4}
              maxLength={1000}
              placeholder="What did you like? How was the quality, the fit, the delivery?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          )}
        </FormField>

        <div>
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className="block text-sm font-medium text-gray-700">Photos</span>
            <span className="text-xs text-gray-500">Up to {MAX_IMAGES}</span>
          </div>

          {images.length > 0 && (
            <ul className="mb-3 grid grid-cols-4 gap-2">
              {images.map((image, index) => (
                <li key={image} className="relative">
                  <Image
                    src={image}
                    alt={`Photo ${index + 1}`}
                    aspect="square"
                    width={200}
                    sizes="100px"
                    rounded="rounded-lg"
                  />
                  <IconButton
                    type="button"
                    size="xs"
                    variant="solid"
                    label={`Remove photo ${index + 1}`}
                    className="absolute -right-1.5 -top-1.5 bg-gray-900 hover:bg-gray-800"
                    onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <X />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}

          <Button
            type="button"
            variant="outline"
            size="md"
            loading={uploading}
            loadingText="Uploading…"
            disabled={remaining === 0 || submitting}
            leftIcon={<Camera className="h-4 w-4" />}
            onClick={() => fileInputRef.current?.click()}
          >
            {remaining === 0 ? "Photo limit reached" : "Add photos"}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            tabIndex={-1}
            onChange={handleImageUpload}
          />
        </div>
      </form>
    </Modal>
  )
}

export default ReviewForm
