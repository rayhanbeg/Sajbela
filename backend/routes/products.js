import express from "express"
import auth from "../middleware/auth.js"
import {
  getProducts,
  getAdminProducts,
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
// Before "/:id", or Express matches "admin" as an id and answers 500.
router.get("/admin/list", auth, getAdminProducts)
router.get("/:id", getProduct)
router.post("/", auth, createProduct)
router.put("/:id", auth, updateProduct)
router.delete("/:id", auth, deleteProduct)

export default router
