import { Link } from "react-router-dom"
import { Swiper, SwiperSlide } from "swiper/react"
import { A11y, Autoplay, Keyboard, Pagination } from "swiper/modules"
import { ArrowRight } from "lucide-react"

import { useMediaQuery } from "../../lib/hooks"
import { Button, Image } from "../ui"

import "swiper/css"
import "swiper/css/pagination"

/**
 * Home hero: copy + CTAs on the left, banner carousel on the right.
 *
 * Three things changed beyond the visuals:
 *  - The page now has an <h1>. It had none at all, which cost both SEO and
 *    screen-reader orientation.
 *  - Swiper's pagination is styled with scoped arbitrary variants instead of a
 *    <style> tag injected into document.head on mount (that leaked global
 *    `.swiper-pagination` overrides onto every other carousel on the site).
 *  - The banner sits in a fixed aspect ratio, so it reserves its space before
 *    the image downloads instead of shoving the page down on load.
 */

const SLIDES = [
  {
    id: 1,
    image: "https://res.cloudinary.com/dh6czikx1/image/upload/v1750672511/sajbela-products/absrovkh4qqri2isbhgh.png",
    alt: "Handmade bangles collection",
    to: "/category/bangles",
  },
  {
    id: 2,
    image: "https://res.cloudinary.com/dh6czikx1/image/upload/v1750584511/sajbela-products/ont8uvrvee094f17hann.png",
    alt: "Tamanna glass bangles collection",
    to: "/category/bangles",
  },
  {
    id: 3,
    image: "https://res.cloudinary.com/dh6czikx1/image/upload/v1750578610/sajbela-products/olgvdbxqbr0q9ir69wvi.png",
    alt: "Metal bangles combo collection",
    to: "/category/combo",
  },
]

/* Swiper ships its own CSS, so these overrides need !important to land. */
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

const HeroSection = () => {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")

  return (
    <section className="bg-gradient-to-b from-pink-50 via-pink-50/40 to-white">
      <div className="page-container py-6 md:py-10 lg:py-12">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] lg:gap-10">
          {/* ── Copy ─────────────────────────────────────────────── */}
          <div className="max-w-xl animate-fade-in-up">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-pink-600">Sajbela essentials</p>

            <h1 className="mt-3 text-display-md font-bold leading-[1.1] tracking-tight text-gray-900">
              Little details, <span className="text-pink-600">beautifully chosen.</span>
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-gray-600 md:text-base">
              Jewelry and beauty picks for every day.
            </p>

            <div className="mt-6 flex gap-2.5">
              <Button to="/products" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />} className="min-w-0 flex-1 px-3 text-sm sm:px-6 sm:text-base">
                Shop now
              </Button>
              <Button to="/products?section=new-arrivals" variant="outline" size="lg" className="min-w-0 flex-1 px-3 text-sm sm:px-6 sm:text-base">
                New in
              </Button>
            </div>
          </div>

          {/* ── Banner carousel ─────────────────────────────────── */}
          <div
            className={`relative overflow-hidden rounded-card shadow-card lg:rounded-sheet ${PAGINATION_STYLES}`}
          >
            <Swiper
              modules={[Autoplay, Pagination, Keyboard, A11y]}
              slidesPerView={1}
              spaceBetween={0}
              loop
              keyboard={{ enabled: true }}
              // Autoplay is opt-out for anyone who asked the OS for less motion.
              autoplay={reducedMotion ? false : { delay: 4500, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              a11y={{ prevSlideMessage: "Previous banner", nextSlideMessage: "Next banner" }}
              className="aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-[16/9]"
            >
              {SLIDES.map((slide, index) => (
                <SwiperSlide key={slide.id}>
                  <Link to={slide.to} className="group block h-full w-full focus:outline-none">
                    <Image
                      src={slide.image}
                      alt={slide.alt}
                      aspect="auto"
                      // The first banner is the LCP element on the home page.
                      priority={index === 0}
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      className="h-full w-full"
                      imgClassName="transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
                    />
                    <span className="sr-only">Shop {slide.alt}</span>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
