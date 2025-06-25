"use client"

import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Pagination, Autoplay } from "swiper/modules"
import api from "../../lib/api"
import { formatPrice } from "../../lib/utils"

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

  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="text-yellow-400">★</span>
      )
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="text-yellow-400">☆</span>
      )
    }

    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-300">★</span>
      )
    }

    return stars
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
    return () => document.head.removeChild(style)
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="card animate-pulse">
                <div className="aspect-square bg-gray-300 rounded-md"></div>
                <div className="p-4 h-32">
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
      <section className="py-16 bg-gray-50 text-center">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchFeaturedProducts}
            className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
          >
            Try Again
          </button>
        </div>
      </section>
    )
  }

  if (featuredProducts.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
          <p className="text-gray-600 max-w-xl mx-auto">Discover our most popular and trending products</p>
        </div>

        <Swiper
          modules={[Pagination, Autoplay]}
          spaceBetween={20}
          slidesPerView={1}
          loop
          autoplay={{
            delay: 3000,
            disableOnInteraction: false
          }}
          pagination={{ clickable: true }}
          breakpoints={{
            640: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 }
          }}
          className="featured-products-swiper"
        >
          {featuredProducts.map((product) => (
            <SwiperSlide key={product._id}>
              <Link to={`/products/${product._id}`} className="group">
                <div className="card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="relative overflow-hidden aspect-square">
                    <img
                      src={product.images?.[0]?.url || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      NEW
                    </div>
                    <div className="absolute top-2 right-2">
                      <button className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors">
                        ❤️
                      </button>
                    </div>
                  </div>

                  <div className="p-4 h-32 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors leading-tight">
                        {product.name}
                      </h3>

                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex items-center">{renderStars(product.rating)}</div>
                        <span className="text-xs text-gray-500">({product.numReviews || 0})</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-sm md:text-base font-bold text-pink-600">
                          {formatPrice(product.price)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-xs text-gray-500 line-through">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>

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
