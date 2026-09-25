import Banner from "../models/Banner.js"

const isAdmin = (req) => req.user?.role === "admin"

const normaliseBanner = (body = {}) => {
  const imageUrl = String(body.imageUrl || "").trim()
  const buttonLabel = String(body.buttonLabel || "").trim()
  const buttonUrl = String(body.buttonUrl || "").trim()

  if (!imageUrl) throw new Error("A banner image is required.")
  if ((buttonLabel && !buttonUrl) || (!buttonLabel && buttonUrl)) {
    throw new Error("Add both a button label and button link, or leave both empty.")
  }
  if (buttonUrl && !/^(\/|https?:\/\/)/i.test(buttonUrl)) {
    throw new Error("Button link must start with / or http(s)://.")
  }

  return {
    imageUrl,
    publicId: String(body.publicId || "").trim(),
    buttonLabel,
    buttonUrl,
    sortOrder: Math.max(0, Number(body.sortOrder) || 0),
    isActive: body.isActive !== false,
  }
}

export const getBanners = async (_req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ sortOrder: 1, createdAt: -1 }).lean()
    res.json({ banners })
  } catch (error) {
    console.error("Get banners error:", error)
    res.status(500).json({ message: "Could not load banners." })
  }
}

export const getAdminBanners = async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ message: "Access denied. Admin only." })
    const banners = await Banner.find().sort({ sortOrder: 1, createdAt: -1 }).lean()
    res.json({ banners })
  } catch (error) {
    console.error("Get admin banners error:", error)
    res.status(500).json({ message: "Could not load banners." })
  }
}

export const createBanner = async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ message: "Access denied. Admin only." })
    const banner = await Banner.create(normaliseBanner(req.body))
    res.status(201).json({ banner })
  } catch (error) {
    res.status(400).json({ message: error.message || "Could not create banner." })
  }
}

export const updateBanner = async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ message: "Access denied. Admin only." })
    const banner = await Banner.findByIdAndUpdate(req.params.id, normaliseBanner(req.body), {
      new: true,
      runValidators: true,
    })
    if (!banner) return res.status(404).json({ message: "Banner not found." })
    res.json({ banner })
  } catch (error) {
    const status = error.name === "CastError" ? 404 : 400
    res.status(status).json({ message: error.message || "Could not update banner." })
  }
}

export const deleteBanner = async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ message: "Access denied. Admin only." })
    const banner = await Banner.findByIdAndDelete(req.params.id)
    if (!banner) return res.status(404).json({ message: "Banner not found." })
    res.json({ message: "Banner deleted." })
  } catch (error) {
    const status = error.name === "CastError" ? 404 : 500
    res.status(status).json({ message: "Could not delete banner." })
  }
}
