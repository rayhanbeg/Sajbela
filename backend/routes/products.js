import express from "express"
import auth from "../middleware/auth.js"
import {
  getProducts,
  getProduct,
  getFeaturedProducts,
  getNewArrivals,
  getCombos,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js"

const router = express.Router()

// Product routes
router.get("/", getProducts)
router.get("/featured/list", getFeaturedProducts)
router.get("/new-arrivals/list", getNewArrivals)
router.get("/combos/list", getCombos)
router.get("/:id", getProduct)
router.post("/", auth, createProduct)
router.put("/:id", auth, updateProduct)
router.delete("/:id", auth, deleteProduct)

export default router
