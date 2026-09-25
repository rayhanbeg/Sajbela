import jwt from "jsonwebtoken"
import User from "../models/User.js"

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select("-password")

    if (!user) {
      return res.status(401).json({ message: "Token is not valid" })
    }

    req.user = user
    req.userId = user._id
    next()
  } catch (error) {
    console.error("Auth middleware error:", error)
    res.status(401).json({ message: "Token is not valid" })
  }
}

export default auth

/**
 * Same as `auth`, but a missing or bad token is not an error — it just means
 * `req.user` stays undefined and the handler treats the caller as a guest.
 *
 * Used by `POST /orders`, so someone can check out without an account while a
 * signed-in shopper's order is still attached to theirs.
 */
export const optionalAuth = async (req, _res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "")
  if (!token) return next()

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select("-password")
    if (user) {
      req.user = user
      req.userId = user._id
    }
  } catch {
    // An expired token on a guest-capable route shouldn't block the purchase.
  }

  next()
}
