import mongoose from "mongoose"

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    district: {
      type: String,
      required: [true, "District is required"],
      trim: true,
    },
    thana: {
      type: String,
      required: [true, "Thana is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      default: "Bangladesh",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// Ensure only one default address per user
addressSchema.pre("save", async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany({ user: this.user, _id: { $ne: this._id } }, { isDefault: false })
  }
  next()
})

export default mongoose.model("Address", addressSchema)
