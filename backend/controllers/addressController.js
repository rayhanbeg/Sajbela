import Address from "../models/Address.js"

// Get user addresses
export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.userId }).sort({ isDefault: -1, createdAt: -1 })
    res.json(addresses)
  } catch (error) {
    console.error("Get addresses error:", error)
    res.status(500).json({ message: "Server error fetching addresses" })
  }
}

// Create new address
export const createAddress = async (req, res) => {
  try {
    const addressData = {
      ...req.body,
      user: req.userId,
    }

    const address = new Address(addressData)
    await address.save()

    res.status(201).json({
      message: "Address created successfully",
      address,
    })
  } catch (error) {
    console.error("Create address error:", error)
    res.status(500).json({ message: "Server error creating address" })
  }
}

// Update address
export const updateAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.userId })

    if (!address) {
      return res.status(404).json({ message: "Address not found" })
    }

    Object.assign(address, req.body)
    await address.save()

    res.json({
      message: "Address updated successfully",
      address,
    })
  } catch (error) {
    console.error("Update address error:", error)
    res.status(500).json({ message: "Server error updating address" })
  }
}

// Delete address
export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.userId })

    if (!address) {
      return res.status(404).json({ message: "Address not found" })
    }

    await Address.findByIdAndDelete(req.params.id)

    res.json({ message: "Address deleted successfully" })
  } catch (error) {
    console.error("Delete address error:", error)
    res.status(500).json({ message: "Server error deleting address" })
  }
}

// Set default address
export const setDefaultAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.userId })

    if (!address) {
      return res.status(404).json({ message: "Address not found" })
    }

    // Remove default from all other addresses
    await Address.updateMany({ user: req.userId }, { isDefault: false })

    // Set this address as default
    address.isDefault = true
    await address.save()

    res.json({
      message: "Default address updated successfully",
      address,
    })
  } catch (error) {
    console.error("Set default address error:", error)
    res.status(500).json({ message: "Server error setting default address" })
  }
}
