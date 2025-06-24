"use client"

import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Pagination, Autoplay } from "swiper/modules"
import api from "../../lib/api"

// Import Swiper styles
import "swiper/css"
import "swiper/css/pagination"

const FeaturedProducts = () => {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true)
      const response = await api.get("/products/featured/list")
      setFeaturedProducts(response.data || [])
    } catch (error) {
      console.error("Error fetching featured products:", error)
      setError("Failed to load featured products")
    } finally {
      setLoading(false)
    }
  }

  const getImageUrl = (product, index = 0) => {
    if (product.images && product.images.length > 0) {
      return product.images[index]?.url || product.images[0]?.url || "/placeholder.svg"
    }
    return product.image || "/placeholder.svg"
  }

  const isAvailable = (product) => {
    if (product.category === "bangles" && product.sizes) {
      return product.sizes.some((size) => size.available && size.stock > 0)
    }
    if (product.colors && product.colors.length > 0) {
      return product.colors.some((color) => color.available && color.stock > 0)
    }
    return product.inStock && product.stock > 0
  }

  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = `
    .featured-products-swiper .swiper-pagination {
      position: relative !important;
      margin-top: 2rem !important;
    }
    .featured-products-swiper .swiper-pagination-bullet {
      background-color: #ec4899 !important;
      opacity: 0.3 !important;
    }
    .featured-products-swiper .swiper-pagination-bullet-active {
      opacity: 1 !important;
      background-color: #db2777 !important;
    }
  `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="card animate-pulse">
                <div className="h-64 bg-gray-300 rounded-md"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchFeaturedProducts}
              className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (!featuredProducts || featuredProducts.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-gray-600">No featured products available at the moment.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Discover our most popular and trending products</p>
        </div>

        <div className="relative">
          <Swiper
            modules={[Pagination, Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            loop={true}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            pagination={{
              clickable: true,
              bulletClass: "swiper-pagination-bullet !bg-pink-500",
              bulletActiveClass: "swiper-pagination-bullet-active !bg-pink-600",
            }}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 24,
              },
              1024: {
                slidesPerView: 4,
                spaceBetween: 24,
              },
            }}
            className="featured-products-swiper"
          >
            {featuredProducts.map((product) => (
              <SwiperSlide key={product._id}>
                <Link to={`/products/${product._id}`} className="block">
                  <div className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    {/* Product Image - Fixed to show full image */}
                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={getImageUrl(product) || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = "/placeholder.svg"
                        }}
                      />

                      {/* Availability Badge */}
                      <div className="absolute top-2 left-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            isAvailable(product) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {isAvailable(product) ? "Available" : "Not Available"}
                        </span>
                      </div>

                      {/* Discount Badge */}
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="absolute bottom-2 left-2">
                          <span className="bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">
                            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors line-clamp-2">
                        {product.name}
                      </h3>

                      {/* Rating */}
                      <div className="flex items-center mb-2">
                        <div className="flex items-center text-sm">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`${i < Math.floor(product.rating || 0) ? "text-yellow-400" : "text-gray-300"}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 ml-2">({product.numReviews || 0})</span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-base font-bold text-pink-600">৳{product.price}</span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-xs text-gray-500 line-through">৳{product.originalPrice}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className="text-center mt-12">
          <Link
            to="/products"
            className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  )
}

export default FeaturedProducts
