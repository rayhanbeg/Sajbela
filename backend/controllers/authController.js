import jwt from "jsonwebtoken"
import { OAuth2Client } from "google-auth-library"
import User from "../models/User.js"
import { sendPasswordResetLink, sendPasswordResetSuccess } from "../config/email.js"

/** 30-day session, matching the login/register handlers below. */
const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" })

/**
 * Verifies Google ID tokens. Constructed once — the client caches Google's
 * public keys, so a new instance per request would re-fetch them every time.
 */
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

/** "nu***@gmail.com" — shown back on the reset page to confirm the inbox. */
const maskEmail = (email = "") => email.replace(/(.{2})(.*)(@.*)/, "$1***$3")

/**
 * Sign in with Google.
 *
 * The browser gets an ID token from Google Identity Services and posts it here;
 * nothing is trusted until `verifyIdToken` checks the signature and confirms
 * the token was minted for this app's client id. Decoding the JWT client-side
 * and sending the claims would let anyone sign in as anyone.
 *
 * Three cases, in order: a returning Google user (matched on googleId), someone
 * who first registered with a password and is now using Google (the accounts
 * are linked rather than duplicated — same verified email), and a brand new
 * shopper, who gets an account created on the spot.
 */
export const googleLogin = async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ message: "Google sign-in is not configured" })
    }

    const { credential } = req.body
    if (!credential) {
      return res.status(400).json({ message: "Missing Google credential" })
    }

    let payload
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      })
      payload = ticket.getPayload()
    } catch (verifyError) {
      console.error("Google token verification failed:", verifyError.message)
      return res.status(401).json({ message: "Could not verify your Google account. Please try again." })
    }

    // Google will hand back unverified addresses for some account types; those
    // can't be used to claim an existing local account.
    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({ message: "Your Google account has no verified email address" })
    }

    const email = payload.email.toLowerCase()
    let user = await User.findOne({ googleId: payload.sub })

    if (!user) {
      user = await User.findOne({ email })

      if (user) {
        // Existing local account, same verified email — link it. The password
        // still works; they now have two ways in.
        user.googleId = payload.sub
        if (!user.avatar && payload.picture) user.avatar = payload.picture
        await user.save()
      } else {
        user = await User.create({
          name: payload.name || email.split("@")[0],
          email,
          googleId: payload.sub,
          avatar: payload.picture,
          authProvider: "google",
        })
      }
    } else if (payload.picture && user.avatar !== payload.picture) {
      user.avatar = payload.picture
      await user.save()
    }

    res.json({
      message: "Login successful",
      token: signToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Google login error:", error)
    res.status(500).json({ message: "Server error during Google sign-in" })
  }
}

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

// Forgot password — email a single-use reset link
//
// Always answers 200 with the same message, whether or not the address is
// registered. The previous version returned 404 "User not found with this
// email address", which turned this public endpoint into an account-existence
// oracle: anyone could check whether a given email had an account here.
export const forgotPassword = async (req, res) => {
  const generic = {
    message: "If an account exists for that email, we've sent a password reset link.",
  }

  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase()

    if (!email) {
      return res.status(400).json({ message: "Email address is required" })
    }

    const user = await User.findOne({ email })

    // No account: answer exactly as if there were one, and send nothing.
    if (!user) {
      console.log(`🔑 Reset requested for unknown address: ${maskEmail(email)}`)
      return res.json(generic)
    }

    const rawToken = user.createPasswordResetToken()
    await user.save()

    const baseUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "")
    const resetUrl = `${baseUrl}/auth/reset-password?token=${rawToken}`

    const emailResult = await sendPasswordResetLink(user.email, user.name, resetUrl)

    if (!emailResult.success) {
      // The token is already saved, so drop it again — leaving a live token
      // behind for an email that never arrived is a window with no upside.
      user.clearPasswordResetToken()
      await user.save()
      return res.status(500).json({ message: "We couldn't send the email. Please try again in a moment." })
    }

    res.json(generic)
  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({ message: "Server error. Please try again." })
  }
}

// Verify a reset token before showing the reset form
//
// Lets the reset page say "this link expired, here's a new one" up front,
// instead of after the shopper has chosen and confirmed a new password.
export const verifyResetToken = async (req, res) => {
  try {
    const user = await User.findByPasswordResetToken(req.params.token)

    if (!user) {
      return res.status(400).json({
        message: "This reset link has expired or has already been used. Reset links last 30 minutes and work once.",
      })
    }

    res.json({ valid: true, email: maskEmail(user.email) })
  } catch (error) {
    console.error("Verify reset token error:", error)
    res.status(500).json({ message: "Server error. Please try again." })
  }
}

// Reset password using the emailed token
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      return res.status(400).json({ message: "A reset link and a new password are both required" })
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" })
    }

    const user = await User.findByPasswordResetToken(token)

    if (!user) {
      return res.status(400).json({
        message: "This reset link has expired or has already been used. Please request a new one.",
      })
    }

    user.password = password
    // Single use: consumed in the same save that sets the new password, so the
    // link can't be replayed from the shopper's email history.
    user.clearPasswordResetToken()
    await user.save()

    // Best effort — the password is already changed, so a mail failure here
    // must not read as a failed reset.
    sendPasswordResetSuccess(user.email, user.name).catch((error) =>
      console.error("Reset confirmation email failed:", error),
    )

    res.json({ message: "Password reset successful. You can now log in with your new password." })
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

    const nextEmail = email?.trim().toLowerCase()

    // `email` is a unique index, so without this check the save below throws a
    // duplicate-key error and the shopper is told "Server error updating
    // profile" — which reads like our fault, not a taken address.
    if (nextEmail && nextEmail !== user.email) {
      const taken = await User.findOne({ email: nextEmail, _id: { $ne: user._id } })
      if (taken) {
        return res.status(400).json({ message: "That email is already used by another account" })
      }
      user.email = nextEmail
    }

    user.name = name?.trim() || user.name
    user.phone = phone?.trim() || user.phone

    await user.save()

    // The whole document (minus the password) rather than a hand-picked
    // subset: the client merges this into its session, and omitting `_id` /
    // `createdAt` / `avatar` here silently stripped them from it.
    const { password: _password, resetPasswordToken, resetPasswordExpires, ...safe } = user.toObject()

    res.json({
      message: "Profile updated successfully",
      user: safe,
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({ message: "Server error updating profile" })
  }
}
