"use client"

import { Truck, Headphones, Award } from "lucide-react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination } from "swiper/modules"
import { useEffect } from "react"
import "swiper/css"
import "swiper/css/pagination"

const HeroSection = () => {
  // Add styles dynamically
  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = `
      .swiper-pagination {
        position: absolute !important;
        bottom: 12px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        display: flex !important;
        justify-content: center !important;
        width: auto !important;
      }
      .swiper-pagination-bullet-active {
        opacity: 1 !important;
        transform: scale(1.2) !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const slides = [
    {
      id: 1,
      image: "https://i.ibb.co/kj4yxt8/Chat-GPT-Image-Jun-21-2025-02-28-52-PM.png",
      alt: "Handmade Bangles Collection",
    },
    {
      id: 2,
      image: "https://i.ibb.co/d0M9Rjkq/Chat-GPT-Image-Jun-21-2025-02-59-20-PM.png",
      alt: "Tamanna Kacher churi Collection",
    },
    {
      id: 3,
      image: "https://i.ibb.co/rKwfK6FD/Chat-GPT-Image-Jun-21-2025-03-13-22-PM.png",
      alt: "Metal Bangles Combo Collection",
    },
  ]

  const offers = [
    {
      icon: <Truck size={20} className="text-blue-600" />,
      title: "Cash on Delivery",
      description: "Pay when you receive",
    },
    {
      icon: <Headphones size={20} className="text-blue-600" />,
      title: "Customer Support",
      description: "24/7 assistance",
    },
    {
      icon: <Award size={20} className="text-blue-600" />,
      title: "Authentic Products",
      description: "100% handmade",
    },
  ]

  return (
    <section className="relative w-full bg-gray-100">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4">
          {/* Main Slider */}
          <div className="w-full lg:w-2/3 max-w-4xl relative h-[200px] sm:h-[280px] md:h-[360px] lg:h-[460px] overflow-hidden rounded-lg shadow-sm">
            <Swiper
              modules={[Autoplay, Pagination]}
              spaceBetween={0}
              slidesPerView={1}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
              }}
              loop={true}
              pagination={{
                clickable: true,
                renderBullet: (_, className) => {
                  return `<span class="${className}" style="width: 8px; height: 8px; display: inline-block; border-radius: 50%; background: #fff; opacity: 0.6; margin: 0 4px; cursor: pointer; transition: all 300ms;"></span>`
                },
              }}
              className="h-full"
            >
              {slides.map((slide) => (
                <SwiperSlide key={slide.id}>
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img
                        src={slide.image || "/placeholder.svg"}
                        alt={slide.alt}
                        className="min-w-full min-h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/5"></div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Right Side Offers */}
          <div className="w-full lg:w-1/3 max-w-md lg:pl-4">
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              {/* Main Offer Card */}
              <div className="bg-white rounded-lg shadow-sm p-4 border border-blue-100 col-span-2 lg:col-span-1">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-50 p-2 rounded-full">
                    <Truck size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-800">Cash on Delivery</h3>
                    <p className="text-sm text-gray-600 mt-1">No advance payment needed</p>
                    <p className="text-xs text-blue-500 mt-2">Free delivery on orders over ৳2000</p>
                  </div>
                </div>
              </div>

              {/* Additional Offer Cards */}
              {offers.slice(1).map((offer, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-full">{offer.icon}</div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-800">{offer.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{offer.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
