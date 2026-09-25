import { useEffect, useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { A11y, Autoplay, Keyboard, Pagination } from "swiper/modules"

import api from "../../lib/api"
import { useMediaQuery } from "../../lib/hooks"
import { Button, Image } from "../ui"

import "swiper/css"
import "swiper/css/pagination"

const PAGINATION_STYLES = [
  "[&_.swiper-pagination]:!bottom-3",
  "[&_.swiper-pagination-bullet]:!h-2",
  "[&_.swiper-pagination-bullet]:!w-2",
  "[&_.swiper-pagination-bullet]:!rounded-full",
  "[&_.swiper-pagination-bullet]:!bg-white",
  "[&_.swiper-pagination-bullet]:!opacity-50",
  "[&_.swiper-pagination-bullet]:!transition-all",
  "[&_.swiper-pagination-bullet]:!duration-300",
  "[&_.swiper-pagination-bullet-active]:!w-6",
  "[&_.swiper-pagination-bullet-active]:!opacity-100",
].join(" ")

/** Homepage banners are managed entirely in Admin → Banners. */
const HeroSection = () => {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const [banners, setBanners] = useState([])

  useEffect(() => {
    const controller = new AbortController()
    api
      .get("/banners", { signal: controller.signal })
      .then(({ data }) => setBanners(Array.isArray(data?.banners) ? data.banners : []))
      .catch((error) => {
        if (error?.code !== "ERR_CANCELED" && error?.name !== "CanceledError") console.error("Could not load banners:", error)
      })
    return () => controller.abort()
  }, [])

  if (banners.length === 0) return null

  return (
    <section aria-label="Featured offers" className="bg-gradient-to-b from-pink-50 via-pink-50/40 to-white">
      <div className="page-container py-4 md:py-7 lg:py-9">
        <div className={"relative overflow-hidden rounded-card shadow-card lg:rounded-sheet " + PAGINATION_STYLES}>
          <Swiper
            modules={[Autoplay, Pagination, Keyboard, A11y]}
            slidesPerView={1}
            spaceBetween={0}
            loop={banners.length > 1}
            keyboard={{ enabled: true }}
            autoplay={reducedMotion || banners.length < 2 ? false : { delay: 4500, disableOnInteraction: false }}
            pagination={banners.length > 1 ? { clickable: true } : false}
            a11y={{ prevSlideMessage: "Previous banner", nextSlideMessage: "Next banner" }}
            className="aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-[16/9]"
          >
            {banners.map((banner, index) => {
              const hasButton = Boolean(banner.buttonLabel && banner.buttonUrl)
              const buttonProps = banner.buttonUrl?.startsWith("/") ? { to: banner.buttonUrl } : { href: banner.buttonUrl }

              return (
                <SwiperSlide key={banner._id}>
                  <div className="relative h-full w-full">
                    <Image src={banner.imageUrl} alt="Sajbela banner" aspect="auto" priority={index === 0} sizes="100vw" className="h-full w-full" imgClassName="object-cover" />
                    {hasButton && (
                      <div className="absolute inset-x-0 bottom-7 flex justify-center px-4 sm:bottom-9">
                        <Button {...buttonProps} size="md" className="shadow-lg">{banner.buttonLabel}</Button>
                      </div>
                    )}
                  </div>
                </SwiperSlide>
              )
            })}
          </Swiper>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
