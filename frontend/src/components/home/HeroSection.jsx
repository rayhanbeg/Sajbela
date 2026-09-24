import { Link } from "react-router-dom"
import { Swiper, SwiperSlide } from "swiper/react"
import { A11y, Autoplay, Keyboard, Pagination } from "swiper/modules"
import { ArrowRight, Sparkles } from "lucide-react"

import { STORE } from "../../lib/navigation"
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
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-white px-3 py-1.5 text-xs font-semibold text-pink-700 shadow-sm ring-1 ring-pink-100">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              {STORE.nameBn} &middot; Handcrafted in Bangladesh
            </span>

            <h1 className="mt-4 text-display-md font-bold leading-[1.1] tracking-tight text-gray-900">
              Jewelry &amp; cosmetics that <span className="text-pink-600">feel made for you</span>
            </h1>

            <p className="mt-3.5 text-sm leading-relaxed text-gray-600 md:text-base">
              Handmade bangles, everyday earrings and beauty picks — chosen piece by piece, delivered across Bangladesh
              with cash on delivery.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <Button to="/products" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Shop the collection
              </Button>
              <Button to="/products?section=new-arrivals" variant="outline" size="lg">
                New arrivals
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
