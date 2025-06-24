import express from "express"
import auth from "../middleware/auth.js"
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getUserProfile,
  updateUserProfile,
} from "../controllers/userController.js"

const router = express.Router()

// User routes
router.get("/", auth, getAllUsers)
router.get("/profile", auth, getUserProfile)
router.put("/profile", auth, updateUserProfile)
router.put("/:userId/role", auth, updateUserRole)
router.delete("/:userId", auth, deleteUser)

export default router
