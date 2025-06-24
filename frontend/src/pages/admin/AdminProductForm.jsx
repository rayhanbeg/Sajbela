import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate, useParams } from "react-router-dom"
import { Upload, X, Save, ArrowLeft, Plus, Minus } from "lucide-react"
import { createProduct, updateProduct, fetchProductById, clearCurrentProduct } from "../../lib/store/productSlice"
import { uploadAPI } from "../../lib/api"

const AdminProductForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const { currentProduct, loading } = useSelector((state) => state.products)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "bangles",
    subcategory: "",
    stock: "",
    tags: "",
    specifications: {
      material: "",
      color: "",
      size: "",
      weight: "",
    },
    sizes: [],
    colors: [],
    featured: false,
    isNewArrival: false,
    isCombo: false,
  })

  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState({})

  const categories = [
    { value: "bangles", label: "Bangles" },
    { value: "earrings", label: "Earrings" },
    { value: "cosmetics", label: "Cosmetics" },
    { value: "necklaces", label: "Necklaces" },
    { value: "rings", label: "Rings" },
    { value: "alna", label: "Alna" },
    { value: "combo", label: "Combo" },
  ]

  const sizeOptions = [
    { size: "S", measurement: "2.4/24" },
    { size: "M", measurement: "2.6/26" },
    { size: "L", measurement: "2.8/28" },
    { size: "XL", measurement: "2.10/30" },
  ]

  const predefinedColors = [
    { name: "Red", hexCode: "#FF0000" },
    { name: "Blue", hexCode: "#0000FF" },
    { name: "Green", hexCode: "#00FF00" },
    { name: "Yellow", hexCode: "#FFFF00" },
    { name: "Purple", hexCode: "#800080" },
    { name: "Orange", hexCode: "#FFA500" },
    { name: "Pink", hexCode: "#FFC0CB" },
    { name: "Black", hexCode: "#000000" },
    { name: "White", hexCode: "#FFFFFF" },
    { name: "Gold", hexCode: "#FFD700" },
    { name: "Silver", hexCode: "#C0C0C0" },
    { name: "Rose Gold", hexCode: "#E8B4B8" },
  ]

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      navigate("/auth/login")
      return
    }

    if (id) {
      dispatch(fetchProductById(id))
    }

    return () => {
      dispatch(clearCurrentProduct())
    }
  }, [dispatch, id, isAuthenticated, user, navigate])

  useEffect(() => {
    if (currentProduct && id) {
      console.log("📦 Loading product data:", currentProduct)
      setFormData({
        name: currentProduct.name || "",
        description: currentProduct.description || "",
        price: currentProduct.price || "",
        originalPrice: currentProduct.originalPrice || "",
        category: currentProduct.category || "bangles",
        subcategory: currentProduct.subcategory || "",
        stock: currentProduct.stock || "",
        tags: currentProduct.tags?.join(", ") || "",
        specifications: {
          material: currentProduct.specifications?.material || "",
          color: currentProduct.specifications?.color || "",
          size: currentProduct.specifications?.size || "",
          weight: currentProduct.specifications?.weight || "",
        },
        sizes: currentProduct.sizes || [],
        colors: currentProduct.colors || [],
        featured: currentProduct.featured || false,
        isNewArrival: currentProduct.isNewArrival || false,
        isCombo: currentProduct.isCombo || false,
      })
      setImages(currentProduct.images || [])

      console.log("🎨 Loaded colors:", currentProduct.colors)
      console.log("📏 Loaded sizes:", currentProduct.sizes)
    }
  }, [currentProduct, id])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name.startsWith("specifications.")) {
      const specField = name.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specField]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }))
    }
  }

  const handleSizeChange = (index, field, value) => {
    const updatedSizes = [...formData.sizes]

    if (field === "size") {
      const selectedOption = sizeOptions.find((opt) => opt.size === value)
      updatedSizes[index] = {
        ...updatedSizes[index],
        size: value,
        measurement: selectedOption?.measurement || updatedSizes[index].measurement || "",
      }
    } else {
      updatedSizes[index] = {
        ...updatedSizes[index],
        [field]: field === "stock" ? Number(value) || 0 : field === "available" ? Boolean(value) : value,
      }
    }

    console.log("📏 Updated sizes:", updatedSizes)
    setFormData((prev) => ({
      ...prev,
      sizes: updatedSizes,
    }))
  }

  const handleColorChange = (index, field, value) => {
    const updatedColors = [...formData.colors]

    if (field === "name") {
      const selectedColor = predefinedColors.find((color) => color.name === value)
      updatedColors[index] = {
        ...updatedColors[index],
        name: value,
        hexCode: selectedColor?.hexCode || updatedColors[index].hexCode || "#000000",
      }
    } else {
      updatedColors[index] = {
        ...updatedColors[index],
        [field]: field === "stock" ? Number(value) || 0 : field === "available" ? Boolean(value) : value,
      }
    }

    console.log("🎨 Updated colors:", updatedColors)
    setFormData((prev) => ({
      ...prev,
      colors: updatedColors,
    }))
  }

  const addSize = () => {
    const usedSizes = formData.sizes.map((s) => s.size)
    const availableSize = sizeOptions.find((option) => !usedSizes.includes(option.size))
    const newSize = availableSize || sizeOptions[0]

    const newSizeObj = {
      size: newSize.size,
      measurement: newSize.measurement,
      stock: 0,
      available: true,
    }

    console.log("➕ Adding new size:", newSizeObj)
    setFormData((prev) => ({
      ...prev,
      sizes: [...prev.sizes, newSizeObj],
    }))
  }

  const addColor = () => {
    const usedColors = formData.colors.map((c) => c.name)
    const availableColor = predefinedColors.find((color) => !usedColors.includes(color.name))
    const newColor = availableColor || predefinedColors[0]

    const newColorObj = {
      name: newColor.name,
      hexCode: newColor.hexCode,
      stock: 0,
      available: true,
    }

    console.log("🎨 Adding new color:", newColorObj)
    setFormData((prev) => ({
      ...prev,
      colors: [...prev.colors, newColorObj],
    }))
  }

  const removeSize = (index) => {
    console.log("➖ Removing size at index:", index)
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }))
  }

  const removeColor = (index) => {
    console.log("🗑️ Removing color at index:", index)
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }))
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    console.log("📤 Starting image upload for", files.length, "files")
    setUploading(true)

    try {
      const uploadPromises = files.map(async (file) => {
        console.log("📁 Uploading file:", file.name)
        const response = await uploadAPI.single(file)
        console.log("✅ Upload response:", response.data)
        return response
      })

      const responses = await Promise.all(uploadPromises)

      const newImages = responses.map((response) => ({
        url: response.data.imageUrl || response.data.url, // Handle both possible response formats
        publicId: response.data.publicId || response.data.public_id, // Handle both formats
        alt: formData.name,
      }))

      console.log("🖼️ New images added:", newImages)
      setImages((prev) => [...prev, ...newImages])
    } catch (error) {
      console.error("❌ Upload error:", error)
      alert(`Failed to upload images: ${error.response?.data?.message || error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = async (index) => {
    const image = images[index]
    console.log("🗑️ Removing image:", image)

    try {
      if (image.publicId) {
        await uploadAPI.delete(image.publicId)
        console.log("✅ Image deleted from Cloudinary")
      }
      setImages((prev) => prev.filter((_, i) => i !== index))
    } catch (error) {
      console.error("❌ Delete image error:", error)
      alert("Failed to delete image")
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) newErrors.name = "Product name is required"
    if (!formData.description.trim()) newErrors.description = "Description is required"
    if (!formData.price || formData.price <= 0) newErrors.price = "Valid price is required"
    if (formData.category !== "bangles" && (!formData.stock || formData.stock < 0))
      newErrors.stock = "Valid stock quantity is required"
    if (images.length === 0) newErrors.images = "At least one image is required"

    if (formData.category === "bangles" && formData.sizes.length === 0) {
      newErrors.sizes = "At least one size is required for bangles"
    }

    if (formData.category === "bangles" && formData.sizes.length > 0) {
      const sizeValues = formData.sizes.map((s) => s.size)
      const duplicates = sizeValues.filter((size, index) => sizeValues.indexOf(size) !== index)
      if (duplicates.length > 0) {
        newErrors.sizes = "Duplicate sizes are not allowed"
      }
    }

    if (formData.colors.length > 0) {
      const colorNames = formData.colors.map((c) => c.name)
      const duplicates = colorNames.filter((name, index) => colorNames.indexOf(name) !== index)
      if (duplicates.length > 0) {
        newErrors.colors = "Duplicate colors are not allowed"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    const productData = {
      ...formData,
      price: Number(formData.price),
      originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
      stock: formData.category === "bangles" ? 0 : Number(formData.stock),
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag),
      images,
      sizes: formData.sizes.map((size) => ({
        size: size.size,
        measurement: size.measurement,
        stock: Number(size.stock) || 0,
        available: Boolean(size.available),
      })),
      colors: formData.colors.map((color) => ({
        name: color.name,
        hexCode: color.hexCode,
        stock: Number(color.stock) || 0,
        available: Boolean(color.available),
      })),
      isActive: true,
    }

    console.log("💾 Saving product data:", productData)

    try {
      if (id) {
        await dispatch(updateProduct({ id, productData })).unwrap()
        alert("Product updated successfully!")
      } else {
        await dispatch(createProduct(productData)).unwrap()
        alert("Product created successfully!")
      }
      navigate("/admin/products")
    } catch (error) {
      console.error("❌ Save error:", error)
      alert("Failed to save product")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <button onClick={() => navigate("/admin/products")} className="mr-4 p-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{id ? "Edit Product" : "Add New Product"}</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter product name"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      errors.description ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter product description"
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                        errors.price ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="0.00"
                    />
                    {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Original Price</label>
                    <input
                      type="number"
                      name="originalPrice"
                      value={formData.originalPrice}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      {categories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.category !== "bangles" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                      <input
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleInputChange}
                        min="0"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                          errors.stock ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="0"
                      />
                      {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Enter tags separated by commas"
                  />
                </div>

                <div className="flex items-center space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Featured Product</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isNewArrival"
                      checked={formData.isNewArrival}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">New Arrival</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isCombo"
                      checked={formData.isCombo}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Combo Product</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Specifications */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Specifications</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                    <input
                      type="text"
                      name="specifications.material"
                      value={formData.specifications.material}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="e.g., Gold plated"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <input
                      type="text"
                      name="specifications.color"
                      value={formData.specifications.color}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="e.g., Gold"
                    />
                  </div>

                  {formData.category !== "bangles" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                      <input
                        type="text"
                        name="specifications.size"
                        value={formData.specifications.size}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="e.g., Medium"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                    <input
                      type="text"
                      name="specifications.weight"
                      value={formData.specifications.weight}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="e.g., 50g"
                    />
                  </div>
                </div>
              </div>

              {/* Size Management for Bangles */}
              {formData.category === "bangles" && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Available Sizes *</h2>
                    <button
                      type="button"
                      onClick={addSize}
                      className="flex items-center px-3 py-1 bg-pink-600 text-white rounded hover:bg-pink-700"
                      disabled={formData.sizes.length >= 4}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Size
                    </button>
                  </div>

                  {errors.sizes && <p className="text-red-500 text-sm mb-3">{errors.sizes}</p>}

                  <div className="space-y-3">
                    {formData.sizes.map((size, index) => (
                      <div
                        key={`size-${index}-${size.size || "new"}`}
                        className="grid grid-cols-5 gap-3 items-center p-3 border rounded-lg"
                      >
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Size</label>
                          <select
                            value={size.size || ""}
                            onChange={(e) => handleSizeChange(index, "size", e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                          >
                            <option value="">Select Size</option>
                            {sizeOptions.map((option) => (
                              <option key={option.size} value={option.size}>
                                {option.size}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Measurement</label>
                          <input
                            type="text"
                            value={size.measurement || ""}
                            onChange={(e) => handleSizeChange(index, "measurement", e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                            placeholder="2.4/24"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Stock</label>
                          <input
                            type="number"
                            value={size.stock || 0}
                            onChange={(e) => handleSizeChange(index, "stock", e.target.value)}
                            min="0"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                          />
                        </div>

                        <div className="text-center">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Available</label>
                          <input
                            type="checkbox"
                            checked={size.available !== false}
                            onChange={(e) => handleSizeChange(index, "available", e.target.checked)}
                            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                          />
                        </div>

                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => removeSize(index)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Remove size"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {formData.sizes.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No sizes added yet. Click "Add Size" to add available sizes.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Color Management */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Available Colors</h2>
                  <button
                    type="button"
                    onClick={addColor}
                    className="flex items-center px-3 py-1 bg-pink-600 text-white rounded hover:bg-pink-700"
                    disabled={formData.colors.length >= predefinedColors.length}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Color
                  </button>
                </div>

                {errors.colors && <p className="text-red-500 text-sm mb-3">{errors.colors}</p>}

                <div className="space-y-3">
                  {formData.colors.map((color, index) => (
                    <div
                      key={`color-${index}-${color.name || "new"}`}
                      className="grid grid-cols-5 gap-3 items-center p-3 border rounded-lg"
                    >
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                        <select
                          value={color.name || ""}
                          onChange={(e) => handleColorChange(index, "name", e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                        >
                          <option value="">Select Color</option>
                          {predefinedColors.map((option) => (
                            <option key={option.name} value={option.name}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Preview</label>
                        <div
                          className="w-8 h-8 rounded border border-gray-300"
                          style={{ backgroundColor: color.hexCode || "#000000" }}
                          title={color.hexCode || "#000000"}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Stock</label>
                        <input
                          type="number"
                          value={color.stock || 0}
                          onChange={(e) => handleColorChange(index, "stock", e.target.value)}
                          min="0"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                        />
                      </div>

                      <div className="text-center">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Available</label>
                        <input
                          type="checkbox"
                          checked={color.available !== false}
                          onChange={(e) => handleColorChange(index, "available", e.target.checked)}
                          className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                        />
                      </div>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => removeColor(index)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Remove color"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {formData.colors.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No colors added yet. Click "Add Color" to add available colors.</p>
                  </div>
                )}
              </div>

              {/* Images */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Images *</h2>

                <div className="space-y-4">
                  <div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="image-upload"
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 ${
                        uploading ? "border-gray-300 cursor-not-allowed" : "border-gray-300 hover:border-pink-500"
                      }`}
                    >
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">{uploading ? "Uploading..." : "Click to upload images"}</p>
                    </label>
                    {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}
                  </div>

                  {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image.url || "/placeholder.svg"}
                            alt={`Product ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                            onError={(e) => {
                              console.error("Image load error:", e.target.src)
                              e.target.src = "/placeholder.svg"
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex items-center px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5 mr-2" />
              {loading ? "Saving..." : id ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminProductForm
