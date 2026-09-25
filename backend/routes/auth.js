import express from "express"
import auth from "../middleware/auth.js"
import {
  register,
  login,
  googleLogin,
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
// Exchanges a Google ID token for this app's own JWT.
router.post("/google", googleLogin)
router.post("/forgot-password", forgotPassword)
// GET is a pre-flight check for the reset page; POST performs the reset.
router.get("/reset-password/:token", verifyResetToken)
router.post("/reset-password", resetPassword)
router.get("/profile", auth, getProfile)
router.put("/profile", auth, updateProfile)

export default router
