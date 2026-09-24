import express from "express"
import auth from "../middleware/auth.js"
import {
  register,
  login,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  getProfile,
  updateProfile,
} from "../controllers/authController.js"

const router = express.Router()

// Auth routes
router.post("/register", register)
router.post("/login", login)
router.post("/forgot-password", forgotPassword)
// GET is a pre-flight check for the reset page; POST performs the reset.
router.get("/reset-password/:token", verifyResetToken)
router.post("/reset-password", resetPassword)
router.get("/profile", auth, getProfile)
router.put("/profile", auth, updateProfile)

export default router
