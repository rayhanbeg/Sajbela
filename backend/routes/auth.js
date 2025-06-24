import express from "express"
import auth from "../middleware/auth.js"
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
} from "../controllers/authController.js"

const router = express.Router()

// Auth routes
router.post("/register", register)
router.post("/login", login)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password", resetPassword)
router.get("/profile", auth, getProfile)
router.put("/profile", auth, updateProfile)

export default router
