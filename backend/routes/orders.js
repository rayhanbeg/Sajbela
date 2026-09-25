import express from "express"
import auth, { optionalAuth } from "../middleware/auth.js"
import {
  getAllOrders,
  getOrderStats,
  createOrder,
  getUserOrders,
  getOrder,
  lookupGuestOrder,
  updateOrderStatus,
  cancelOrder,
} from "../controllers/orderController.js"

const router = express.Router()

// Order routes
router.get("/", auth, getAllOrders)
// optionalAuth, not auth: checking out no longer requires an account. A token
// is still read when one is sent, so the order attaches to the right user.
router.post("/", optionalAuth, createOrder)
router.get("/my", auth, getUserOrders)
// Before "/:id", or Express matches "stats" as an order id and answers 500.
router.get("/stats", auth, getOrderStats)
router.post("/lookup", lookupGuestOrder)
router.get("/:id", auth, getOrder)
router.put("/:id/status", auth, updateOrderStatus)
router.put("/:id/cancel", auth, cancelOrder)

export default router
