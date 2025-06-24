import User from "../models/User.js"

// Get all users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." })
    }

    const { page = 1, limit = 10, search, role } = req.query

    const query = {}
    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }]
    }
    if (role && role !== "all") {
      query.role = role
    }

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))

    const total = await User.countDocuments(query)

    res.json({
      users,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(total / Number.parseInt(limit)),
        total,
        hasNext: skip + Number.parseInt(limit) < total,
        hasPrev: Number.parseInt(page) > 1,
      },
    })
  } catch (error) {
    console.error("Get all users error:", error)
    res.status(500).json({ message: "Server error fetching users" })
  }
}

// Update user role (Admin only)
export const updateUserRole = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." })
    }

    const { userId } = req.params
    const { role } = req.body

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" })
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select("-password")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    console.log(`✅ User role updated: ${user.email} -> ${role}`)

    res.json({
      message: "User role updated successfully",
      user,
    })
  } catch (error) {
    console.error("Update user role error:", error)
    res.status(500).json({ message: "Server error updating user role" })
  }
}

// Delete user (Admin only)
export const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." })
    }

    const { userId } = req.params

    // Prevent admin from deleting themselves
    if (userId === req.userId.toString()) {
      return res.status(400).json({ message: "Cannot delete your own account" })
    }

    const user = await User.findByIdAndDelete(userId)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({ message: "Server error deleting user" })
  }
}

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(user)
  } catch (error) {
    console.error("Get user profile error:", error)
    res.status(500).json({ message: "Server error fetching profile" })
  }
}

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body

    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, email, phone },
      { new: true, runValidators: true },
    ).select("-password")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      message: "Profile updated successfully",
      user,
    })
  } catch (error) {
    console.error("Update user profile error:", error)
    res.status(500).json({ message: "Server error updating profile" })
  }
}
