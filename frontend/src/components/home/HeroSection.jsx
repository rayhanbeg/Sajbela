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
 * wider as the viewport grows: 1.78 → 2.0 → 2.33.
 *
 * Upload target: **2400 × 1200** (2:1). That's the middle rung, so it lands
 * exactly at `sm`, loses about 11% off the sides on a phone and about 14% off
 * the top and bottom on a desktop — the most balanced a single file can be
 * across this ladder. Wider files give phones a harsher horizontal crop;
 * narrower ones give desktops a harsher vertical one.
 */

/**
 * Three rungs, each sized for its own class of device.
 *
 * Phones were the problem this ladder fixes. They used to hold 3:2 at every
 * width below `md`, which put a 250px banner on a 375px phone and a 427px one
 * at 640px — with the 64px header that was nearly half the screen before a
 * single product. Widening the frame fixes it on both axes at once: 16/9 is
 * both 16% shorter than 3:2 *and* a closer match to the uploaded file, so it
 * crops less off the sides too (74% of the image width shown, against 63%).
 * The 640px case improves most — 427px down to 320px.
 *
 * From `md` the frame is 21:9, and from `lg` it also takes a height ceiling.
 * The ceiling is a `max-height` and not a wider ratio, and that distinction is
 * the point: raising the ratio would also *grow* the frame, so at 1536px wide a
 * 3:1 box wants 512px and a 544px cap would never bite. A max-height is applied
 * after the ratio, so the box stays width-first and full-bleed while its height
 * stops at 544px however wide the monitor gets. It only starts binding around
 * 1270px, which is why laptops are unaffected.
 *
 * `max-h-[70svh]` is the landscape guard. Ratio alone is a function of width,
 * so a phone turned sideways — 844px wide, 390px tall — would ask for a 475px
 * banner and cover the entire screen. Capping at 70% of the small viewport
 * height stops that without touching the portrait case, where the ratio's
 * height is far below the cap and this class does nothing. `svh` rather than
 * `dvh` so the cap doesn't reflow as the URL bar hides; browsers too old to
 * know the unit drop the declaration and simply get the ratio, as before.
 *
 * Because the skeleton reuses this same class string, the reserved box still
 * matches the rendered one exactly — no layout shift.
 */
const FRAME = "aspect-[16/9] w-full max-h-[70svh] sm:aspect-[2/1] md:aspect-[21/9] lg:max-h-[34rem]"

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
