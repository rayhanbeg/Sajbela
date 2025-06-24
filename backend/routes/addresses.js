import express from "express"
import auth from "../middleware/auth.js"
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/addressController.js"

const router = express.Router()

// Address routes
router.get("/", auth, getAddresses)
router.post("/", auth, createAddress)
router.put("/:id", auth, updateAddress)
router.delete("/:id", auth, deleteAddress)
router.put("/:id/default", auth, setDefaultAddress)

export default router
