import express from "express"
import auth from "../middleware/auth.js"
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getUserReviews,
  getReviewableProducts,
  checkReview,
} from "../controllers/reviewController.js"

const router = express.Router()

// Review routes
router.get("/product/:productId", getProductReviews)
router.post("/", auth, createReview)
router.put("/:id", auth, updateReview)
router.delete("/:id", auth, deleteReview)
router.get("/my", auth, getUserReviews)
router.get("/reviewable", auth, getReviewableProducts)
router.get("/check/:productId/:orderId", auth, checkReview)

export default router
