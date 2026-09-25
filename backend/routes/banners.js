import express from "express"
import auth from "../middleware/auth.js"
import { createBanner, deleteBanner, getAdminBanners, getBanners, updateBanner } from "../controllers/bannerController.js"

const router = express.Router()

router.get("/", getBanners)
router.get("/admin/list", auth, getAdminBanners)
router.post("/", auth, createBanner)
router.put("/:id", auth, updateBanner)
router.delete("/:id", auth, deleteBanner)

export default router
