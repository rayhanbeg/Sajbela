import crypto from "crypto"
import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Password and phone are required for accounts created with the signup
    // form, but a Google account has neither to give us — Google returns a
    // name, an email and an avatar, and nothing else. Making these
    // unconditionally required is what would otherwise force a fake password
    // to be invented for every social login.
    password: {
      type: String,
      required: function () {
        return this.authProvider === "local"
      },
      minlength: 6,
    },
    phone: {
      type: String,
      required: function () {
        return this.authProvider === "local"
      },
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    /* ── Social sign-in ─────────────────────────────────────── */
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: {
      type: String,
      // `sparse` so the unique index ignores the many documents without one.
      unique: true,
      sparse: true,
    },
    avatar: {
      type: String,
    },

    /* ── Password reset ─────────────────────────────────────── */
    // Only the SHA-256 hash of the token is stored. A database dump therefore
    // can't be used to reset anyone's password, which was not true of the
    // plaintext 6-digit `verificationCode` this replaces.
    resetPasswordToken: {
      type: String,
      index: true,
    },
    resetPasswordExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  // A Google account has no password to hash.
  if (!this.password) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  // Google-only accounts have no password; email login must fail cleanly
  // rather than throw inside bcrypt on an undefined hash.
  if (!this.password) return false
  return bcrypt.compare(candidatePassword, this.password)
}

/**
 * Issue a password reset token.
 *
 * Returns the RAW token — that goes in the email link and is never persisted.
 * The document stores its hash plus a 30-minute expiry. Caller must save().
 */
userSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex")

  this.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex")
  this.resetPasswordExpires = Date.now() + 30 * 60 * 1000

  return rawToken
}

/** Clear the reset token so the link can't be replayed. Caller must save(). */
userSchema.methods.clearPasswordResetToken = function () {
  this.resetPasswordToken = undefined
  this.resetPasswordExpires = undefined
}

/**
 * Find the user a raw reset token belongs to, if it hasn't expired.
 * The expiry is part of the query, so an expired token can never match.
 */
userSchema.statics.findByPasswordResetToken = function (rawToken) {
  if (!rawToken) return Promise.resolve(null)

  const hashed = crypto.createHash("sha256").update(String(rawToken)).digest("hex")

  return this.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: Date.now() },
  })
}

export default mongoose.model("User", userSchema)
