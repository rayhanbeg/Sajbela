import mongoose from "mongoose"

const bannerSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true, default: "" },
    buttonLabel: { type: String, trim: true, maxlength: 50, default: "" },
    buttonUrl: { type: String, trim: true, maxlength: 500, default: "" },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

bannerSchema.index({ isActive: 1, sortOrder: 1, createdAt: -1 })

export default mongoose.model("Banner", bannerSchema)
