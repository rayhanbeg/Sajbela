import express from "express"
import { uploadSingle, uploadMultiple, deleteImage, upload } from "../controllers/uploadController.js"
import auth from "../middleware/auth.js"

const router = express.Router()

// Upload single image
router.post("/single", auth, upload.single("image"), uploadSingle)

// Upload multiple images
router.post("/multiple", auth, upload.array("images", 5), uploadMultiple)

// Delete image
router.post("/delete", auth, deleteImage)

export default router
