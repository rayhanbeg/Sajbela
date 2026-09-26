import { useEffect, useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { A11y, Autoplay, Keyboard, Pagination } from "swiper/modules"

import api from "../../lib/api"
import { useMediaQuery } from "../../lib/hooks"
import { Button, Image, Skeleton } from "../ui"

import "swiper/css"
import "swiper/css/pagination"

/**
 * Homepage banners, managed in Admin → Banners.
 *
 * Aspect ratio note. One uploaded image has to look right on a 375px phone and
 * a 1920px monitor, and `object-cover` crops whatever doesn't fit, so the frame
 * ratios matter more than anything else here.
 *
 * The rule: a container **narrower** than the image crops it horizontally, a
 * container **wider** than the image crops it vertically. Banner content is
 * laid out horizontally — product on one side, price and CTA on the other — so
 * a horizontal crop cuts the message in half while a vertical one only trims
 * empty margin off the top and bottom. The ratios below therefore only ever get
 * *wider* as the viewport grows: 1.5 → 2.33 → 3.0.
 *
 * That's also why the desktop side is capped with a height ceiling rather than
 * a wider ratio — see the FRAME note below.
 *
 * Upload target: 2400 × 1000 or anything wider than 3:2. Narrower than 3:2 and
 * phones start losing the left and right edges.
 */

/**
 * Small screens keep the 3:2 ratio and nothing else — the phone frame is
 * exactly as it was.
 *
 * From md up the banner gets a height ceiling so it reads as a banner rather
 * than a full screen of picture. The ceiling is a `max-height` and not a wider
 * ratio, and that distinction is the whole point: raising the ratio (21/9 →
 * 3/1) would also *grow* the frame, so at 1536px wide it would want 512px — the
 * cap would never bite and the banner would be no shorter at all. A max-height
 * is applied after the ratio, so the box is width-first, full-bleed, and its
 * height stops at 544px however wide the monitor gets.
 *
 * It only binds from about 1140px up. Below that the 2.33 box is already under
 * the ceiling and the two are identical, which is why tablets and small laptops
 * are unaffected. `object-cover` crops the extra off the top and bottom (see
 * the crop note above — vertical is the safe axis), and `object-center` splits
 * it evenly. Widening the ratio instead would have cropped horizontally, which
 * is the one axis that cuts the banner's message in half.
 *
 * Because the skeleton reuses this same class string, the reserved box still
 * matches the rendered one exactly — no layout shift.
 */
const FRAME = "aspect-[3/2] w-full md:aspect-[21/9] md:max-h-[34rem]"

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
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    api
      .get("/banners", { signal: controller.signal })
      .then(({ data }) => setBanners(Array.isArray(data?.banners) ? data.banners : []))
      .catch((error) => {
        if (error?.code !== "ERR_CANCELED" && error?.name !== "CanceledError") {
          console.error("Could not load banners:", error)
        }
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  if (loading) {
    return (
      <section aria-label="Loading featured offers">
        <Skeleton className={FRAME} rounded="rounded-none" />
      </section>
    )
  }

  if (banners.length === 0) return null

  const multiple = banners.length > 1

  return (
    <section aria-label="Featured offers">
      <div className={`relative overflow-hidden bg-gray-100 ${PAGINATION_STYLES}`}>
        <Swiper
          modules={[Autoplay, Pagination, Keyboard, A11y]}
          slidesPerView={1}
          spaceBetween={0}
          loop={multiple}
          keyboard={{ enabled: true }}
          autoplay={reducedMotion || !multiple ? false : { delay: 4500, disableOnInteraction: false }}
          pagination={multiple ? { clickable: true } : false}
          a11y={{ prevSlideMessage: "Previous banner", nextSlideMessage: "Next banner" }}
          className={FRAME}
        >
          {banners.map((banner, index) => {
            const hasButton = Boolean(banner.buttonLabel && banner.buttonUrl)
            const buttonProps = banner.buttonUrl?.startsWith("/")
              ? { to: banner.buttonUrl }
              : { href: banner.buttonUrl }

            return (
              <SwiperSlide key={banner._id}>
                <div className="relative h-full w-full">
                  <Image
                    src={banner.imageUrl}
                    alt=""
                    aspect="auto"
                    /* The first banner is the LCP element on the home page. */
                    priority={index === 0}
                    /* Without an explicit width the fallback src was 800px wide
                       and visibly soft on anything larger than a tablet. */
                    width={1920}
                    sizes="100vw"
                    className="h-full w-full"
                    imgClassName="object-cover object-center"
                  />

                  {hasButton && (
                    <>
                      {/* Scrim: the CTA has to stay legible over a banner we
                          don't control the brightness of. */}
                      <div
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent"
                      />
                      <div
                        className={`absolute inset-x-0 flex justify-center px-4 ${
                          multiple ? "bottom-9 sm:bottom-11" : "bottom-5 sm:bottom-8"
                        }`}
                      >
                        <Button {...buttonProps} size="md" className="shadow-lg">
                          {banner.buttonLabel}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </SwiperSlide>
            )
          })}
        </Swiper>
      </div>
    </section>
  )
}

export default HeroSection
