import jwt from "jsonwebtoken"
import User from "../models/User.js"
import { sendVerificationCode, sendPasswordResetSuccess } from "../config/email.js"

// Register user
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone,
    })

    await user.save()

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    })

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Register error:", error)
    res.status(500).json({ message: "Server error during registration" })
  }
}

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    })

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error during login" })
  }
}

// Forgot password - Send verification code
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: "User not found with this email address" })
    }

    // Generate verification code
    const verificationCode = user.generateVerificationCode()
    await user.save()

    // Send verification code via email
    const emailResult = await sendVerificationCode(email, verificationCode, user.name)

    if (!emailResult.success) {
      return res.status(500).json({ message: "Failed to send verification code. Please try again." })
    }

    res.json({
      message: "Verification code sent to your email address",
      email: email.replace(/(.{2})(.*)(@.*)/, "$1***$3"), // Mask email for security
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({ message: "Server error. Please try again." })
  }
}

// Verify code and reset password
export const resetPassword = async (req, res) => {
  try {
    const { email, verificationCode, newPassword } = req.body

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Check if verification code is valid and not expired
    if (!user.verificationCode || user.verificationCode !== verificationCode) {
      return res.status(400).json({ message: "Invalid verification code" })
    }

    if (user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({ message: "Verification code has expired. Please request a new one." })
    }

    // Update password
    user.password = newPassword
    user.verificationCode = undefined
    user.verificationCodeExpires = undefined
    await user.save()

    // Send success email
    await sendPasswordResetSuccess(email, user.name)

    res.json({ message: "Password reset successful. You can now login with your new password." })
  } catch (error) {
    console.error("Reset password error:", error)
    res.status(500).json({ message: "Server error. Please try again." })
  }
}

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password")
    res.json(user)
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({ message: "Server error fetching profile" })
  }
}

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body

    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    user.name = name || user.name
    user.email = email || user.email
    user.phone = phone || user.phone

    await user.save()

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({ message: "Server error updating profile" })
  }
}
