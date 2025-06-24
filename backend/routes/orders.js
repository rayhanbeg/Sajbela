import express from "express"
import auth from "../middleware/auth.js"
import {
  getAllOrders,
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
} from "../controllers/orderController.js"

const router = express.Router()

// Order routes
router.get("/", auth, getAllOrders)
router.post("/", auth, createOrder)
router.get("/my", auth, getUserOrders)
router.get("/:id", auth, getOrder)
router.put("/:id/status", auth, updateOrderStatus)
router.put("/:id/cancel", auth, cancelOrder)

export default router
