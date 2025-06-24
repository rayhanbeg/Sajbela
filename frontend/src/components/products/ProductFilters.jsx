import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Filter } from "lucide-react"

const ProductFilters = ({ filters, onFilterChange }) => {
  const navigate = useNavigate()
  const [urlSearchParams] = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  const categories = [
    { value: "bangles", label: "Bangles" },
    { value: "earrings", label: "Earrings" },
    { value: "cosmetics", label: "Cosmetics" },
    { value: "necklaces", label: "Necklaces" },
    { value: "rings", label: "Rings" },
    { value: "alna", label: "Alna" },
    { value: "combo", label: "Combo" },
  ]

  const colors = [
    { value: "gold", label: "Gold" },
    { value: "silver", label: "Silver" },
    { value: "rose-gold", label: "Rose Gold" },
    { value: "black", label: "Black" },
    { value: "white", label: "White" },
    { value: "red", label: "Red" },
    { value: "blue", label: "Blue" },
    { value: "green", label: "Green" },
    { value: "pink", label: "Pink" },
  ]

  const priceRanges = [
    { value: "0-1000", label: "Under ৳1,000" },
    { value: "1000-2000", label: "৳1,000 - ৳2,000" },
    { value: "2000-5000", label: "৳2,000 - ৳5,000" },
    { value: "5000-999999", label: "Above ৳5,000" },
  ]

  const updateFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    if (onFilterChange) {
      onFilterChange(newFilters)
    }

    // Also update URL
    const params = new URLSearchParams(urlSearchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("page") // Reset page when filtering
    navigate(`/products?${params.toString()}`)
  }

  const clearFilters = () => {
    const clearedFilters = {
      category: "",
      minPrice: "",
      maxPrice: "",
      search: "",
      color: "",
      price: "",
    }
    if (onFilterChange) {
      onFilterChange(clearedFilters)
    }
    navigate("/products")
  }

  const hasActiveFilters = filters && Object.values(filters).some((value) => value && value !== "")

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full p-3 bg-white border border-gray-300 rounded-lg"
        >
          <span className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </span>
          {hasActiveFilters && <span className="bg-pink-600 text-white text-xs px-2 py-1 rounded-full">Active</span>}
        </button>
      </div>

      {/* Filter Panel */}
      <div className={`${isOpen ? "block" : "hidden"} lg:block bg-white p-6 rounded-lg shadow-md`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-sm text-pink-600 hover:text-pink-700">
              Clear All
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Category</h4>
          <div className="space-y-2">
            {categories.map((category) => (
              <label key={category.value} className="flex items-center">
                <input
                  type="radio"
                  name="category"
                  checked={filters?.category === category.value}
                  onChange={(e) => updateFilter("category", e.target.checked ? category.value : "")}
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{category.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Color Filter */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Color</h4>
          <div className="space-y-2">
            {colors.map((color) => (
              <label key={color.value} className="flex items-center">
                <input
                  type="radio"
                  name="color"
                  checked={filters?.color === color.value}
                  onChange={(e) => updateFilter("color", e.target.checked ? color.value : "")}
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{color.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Filter */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
          <div className="space-y-2">
            {priceRanges.map((range) => (
              <label key={range.value} className="flex items-center">
                <input
                  type="radio"
                  name="price"
                  checked={filters?.price === range.value}
                  onChange={(e) => updateFilter("price", e.target.checked ? range.value : "")}
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{range.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Search Filter */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Search</h4>
          <input
            type="text"
            placeholder="Search products..."
            value={filters?.search || ""}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        {/* Mobile Close Button */}
        <div className="lg:hidden">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full bg-pink-600 text-white py-2 px-4 rounded-lg hover:bg-pink-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  )
}

export default ProductFilters
