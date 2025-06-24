"use client"

import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { formatPrice } from "../../lib/utils"
import api from "../../lib/api"

const ComboSection = () => {
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCombos()
  }, [])

  const fetchCombos = async () => {
    try {
      const response = await api.get("/products/combos/list")
      setCombos(response.data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching combos:", error)
      setLoading(false)
    }
  }

  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="text-yellow-400">
          ★
        </span>,
      )
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="text-yellow-400">
          ☆
        </span>,
      )
    }

    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-300">
          ★
        </span>,
      )
    }

    return stars
  }

  if (loading) {
    return (
      <section className="py-8 md:py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Special Combos</h2>
            <p className="text-gray-600">Save more with our curated jewelry combinations</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="bg-gray-300 h-48 rounded-t-lg"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded mb-3"></div>
                  <div className="h-8 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (combos.length === 0) {
    return null
  }

  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Special Combos</h2>
          <p className="text-gray-600">Save more with our curated jewelry combinations</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {combos.map((combo) => (
            <Link key={combo._id} to={`/products/${combo._id}`} className="group">
              <div className="card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="relative overflow-hidden">
                  <img
                    src={combo.images?.[0]?.url || "/placeholder.svg"}
                    alt={combo.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {combo.comboDiscount > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      {combo.comboDiscount}% OFF
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <button className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors">
                      ❤️
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
                    {combo.name}
                  </h3>

                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex items-center">{renderStars(combo.rating || 0)}</div>
                    <span className="text-xs text-gray-500">({combo.numReviews || 0})</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-sm md:text-base font-bold text-pink-600">{formatPrice(combo.price)}</span>
                      {combo.originalPrice && (
                        <span className="text-xs text-gray-500 line-through">{formatPrice(combo.originalPrice)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-6 md:mt-8">
          <Link
            to="/products?category=combo"
            className="inline-flex items-center px-6 py-2 bg-pink-600 text-white rounded-full hover:bg-pink-700 transition-colors duration-300 text-sm font-medium"
          >
            View All Combos
          </Link>
        </div>
      </div>
    </section>
  )
}

export default ComboSection
