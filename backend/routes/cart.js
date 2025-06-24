import express from "express"
import auth from "../middleware/auth.js"
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from "../controllers/cartController.js"

const router = express.Router()

// Cart routes
router.get("/", auth, getCart)
router.post("/add", auth, addToCart)
router.put("/update", auth, updateCartItem)
router.delete("/remove/:itemId", auth, removeFromCart)
router.delete("/clear", auth, clearCart)

export default router
