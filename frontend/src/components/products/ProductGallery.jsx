import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react"
import { createPortal } from "react-dom"

import { cn } from "../../lib/cn"
import { PLACEHOLDER_IMAGE, cloudinaryUrl, productImageUrl } from "../../lib/cloudinary"
import { useEscapeKey, useMediaQuery, useScrollLock } from "../../lib/hooks"
import { Image, IconButton } from "../ui"

/**
 * Product image gallery: a swipeable stage, a thumbnail strip, hover zoom and a
 * full-screen lightbox.
 *
 * ── Why the stage is a scroll-snap track ─────────────────────────────────
 *
 * The stage used to be one <Image> swapped by index, with a chevron pinned to
 * each side. That gave a phone no way to change image except to hit a 40px
 * target, which is the one gesture nobody reaches for on a product photo — you
 * swipe. So the stage is now a horizontal scroll container holding every image
 * as a full-width slide, with CSS scroll-snap doing the paging. The browser
 * owns the gesture: native momentum, native rubber-banding, the trackpad
 * two-finger swipe on desktop, and nothing to re-implement.
 *
 * The scroll offset is the single source of truth. `handleTrackScroll` is the
 * only thing that writes `index` — everything else (thumbnail, keyboard) moves
 * the scroll position and lets that handler report where it landed. Two writers
 * is what makes carousels flicker.
 *
 * It also fixes a layout bug for free. Below lg the detail page's grid has no
 * explicit columns, so the implicit `auto` track sized itself to the gallery's
 * *content* minimum — and an in-flow <img> hands up its intrinsic width for
 * that, which for a wide source shot blew the column past the viewport and put
 * a horizontal scrollbar on the whole page. A scroll container contributes zero
 * minimum size along its scrolling axis, so no image, at any width, can push
 * the column open any more.
 *
 * Zoom is deliberately pointer-gated: on a touch screen there's no hover, and
 * the browser's own pinch-zoom inside the lightbox is better than anything we
 * could reimplement.
 *
 * Below md the stage is edge-to-edge: no radius, no border, no letterbox
 * padding. The detail page cancels its own gutter around this block, so the
 * photo runs to both screen edges the way a native product screen does, and
 * `overlay` is where that screen's floating controls (back, share, cart) go —
 * they replace the site header, which the layout drops on this route.
 */

/*
 * What the browser should download per slide. The old value said `100vw` up to
 * 1024px, which over-fetched hard on tablets — at md the slide is the grid
 * column, not the screen — and it was also the number the grid was reading as
 * the gallery's minimum width.
 *
 * Tracks the detail page's own layout: full-bleed below md, `100vw - 3rem` of
 * page gutter at md, then a ~45vw column that stops growing once .page-container
 * hits its max-w-7xl.
 */
const SLIDE_SIZES =
  "(max-width: 767px) 100vw, (max-width: 1023px) calc(100vw - 3rem), (max-width: 1279px) 45vw, 600px"

const ProductGallery = ({ product, badges, overlay, className }) => {
  const images = Array.isArray(product?.images) && product.images.length > 0 ? product.images : [{ url: null }]

  const [index, setIndex] = useState(0)
  const [zoomOrigin, setZoomOrigin] = useState(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const trackRef = useRef(null)
  const thumbsRef = useRef(null)

  const canZoom = useMediaQuery("(hover: hover) and (pointer: fine)")
  const hasMultiple = images.length > 1

  const clampedIndex = Math.min(index, images.length - 1)

  // Read by the resize handler, which must not re-subscribe on every paging.
  const indexRef = useRef(0)
  useEffect(() => {
    indexRef.current = clampedIndex
  }, [clampedIndex])

  /** Move the track. `instant` for jumps, `auto` for the CSS-driven glide. */
  const slideTo = (next, behavior = "auto") => {
    const track = trackRef.current
    if (!track) return
    track.scrollTo({ left: track.clientWidth * next, behavior })
  }

  /** Thumbnail selection — jump straight there, no glide past three other photos.
   *  Writes the index as well as scrolling, so the strip still responds if the
   *  track hasn't been laid out yet (clientWidth 0) and the scroll is a no-op. */
  const jumpTo = (next) => {
    setZoomOrigin(null)
    setIndex(next)
    slideTo(next, "instant")
  }

  /**
   * Keyboard paging. Clamped rather than wrapped: with a visible track, looping
   * from the last slide back to the first is a jarring full-width rewind.
   *
   * Note what this does *not* do: set the index. A glide takes ~300ms, during
   * which `handleTrackScroll` keeps reporting where the track actually is — so
   * writing the destination up front makes the counter read 2, then 1 as the
   * glide crosses the first half of the gap, then 2 again. Letting the scroll
   * position be the only writer costs nothing and can't disagree with itself.
   */
  const step = (delta) => {
    const next = Math.min(images.length - 1, Math.max(0, clampedIndex + delta))
    if (next === clampedIndex) return
    setZoomOrigin(null)
    slideTo(next)
  }

  // A different product in the same route (related-product click) resets the stage.
  useEffect(() => {
    setIndex(0)
    setZoomOrigin(null)
    trackRef.current?.scrollTo({ left: 0, behavior: "instant" })
  }, [product?._id])

  /*
   * Slide offsets are multiples of the track width, so a resize (or a phone
   * rotating) leaves the track parked between two slides. Re-park it on the
   * index we already have.
   */
  useEffect(() => {
    const onResize = () => {
      const track = trackRef.current
      if (!track) return
      track.scrollTo({ left: track.clientWidth * indexRef.current, behavior: "instant" })
    }

    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  /*
   * Keep the active thumbnail in view. Deliberately not `scrollIntoView`: that
   * scrolls *every* scrollable ancestor including the document, so on first
   * paint it would yank the page down to the strip. Measuring instead and
   * scrolling only the strip keeps the effect local.
   */
  useEffect(() => {
    const strip = thumbsRef.current
    const active = strip?.children[clampedIndex]
    if (!strip || !active) return
    if (strip.scrollWidth <= strip.clientWidth) return

    const stripBox = strip.getBoundingClientRect()
    const itemBox = active.getBoundingClientRect()
    const delta = itemBox.left - stripBox.left - (stripBox.width - itemBox.width) / 2

    // `auto` + the strip's own `scroll-smooth`, so reduced-motion still applies.
    strip.scrollTo({ left: strip.scrollLeft + delta, behavior: "auto" })
  }, [clampedIndex])

  const handleTrackScroll = () => {
    const track = trackRef.current
    if (!track || !track.clientWidth) return

    const next = Math.min(images.length - 1, Math.max(0, Math.round(track.scrollLeft / track.clientWidth)))
    if (next === clampedIndex) return

    setZoomOrigin(null)
    setIndex(next)
  }

  const handleKeyDown = (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault()
      step(1)
    } else if (event.key === "ArrowLeft") {
      event.preventDefault()
      step(-1)
    }
  }

  const trackPointer = (event) => {
    if (!canZoom) return
    const rect = event.currentTarget.getBoundingClientRect()
    setZoomOrigin({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    })
  }

  return (
    // `min-w-0` so this column can be narrower than its own content — the other
    // half of the grid-blowout fix, alongside the page's grid-cols-1.
    <div className={cn("flex min-w-0 flex-col gap-3 md:gap-4", className)}>
      {/* ── Main stage ───────────────────────────────────────── */}
      {/*
        The shell holds the chrome; the track inside it holds the photos. They
        have to be separate elements: an absolutely positioned child of a scroll
        container scrolls away with the content, so the badges and the expand
        button would drift off-screen on the first swipe if they lived in there.
      */}
      <div
        onMouseMove={trackPointer}
        onMouseLeave={() => setZoomOrigin(null)}
        className={cn(
          "group relative overflow-hidden bg-white",
          "md:rounded-card md:border md:border-gray-100",
          canZoom && "cursor-zoom-in",
        )}
      >
        <div
          ref={trackRef}
          onScroll={handleTrackScroll}
          onKeyDown={handleKeyDown}
          role="group"
          aria-label="Product images"
          aria-roledescription="carousel"
          tabIndex={0}
          className={cn(
            "flex snap-x-mandatory overflow-x-auto overscroll-x-contain scroll-smooth scrollbar-hide",
            // `ring-inset` because the shell clips overflow — a ring drawn
            // outside the track would be cut off on all four sides.
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500",
          )}
        >
          {images.map((image, i) => (
            <div
              key={image.public_id || image.url || i}
              role="group"
              aria-roledescription="slide"
              aria-label={`Image ${i + 1} of ${images.length}`}
              /* `overflow-hidden` keeps the hover zoom's scale(2) from adding to
                 the track's scrollable width. */
              className="w-full shrink-0 snap-start-always overflow-hidden"
            >
              <Image
                src={image.url || productImageUrl(product, i)}
                alt={`${product?.name || "Product"} — image ${i + 1} of ${images.length}`}
                aspect="square"
                fit="contain"
                width={960}
                sizes={SLIDE_SIZES}
                priority={i === 0}
                background="bg-white"
                /*
                 * A square stage is 100vw tall on a phone, which is fine
                 * portrait and absurd in landscape — 740x360 would hand you a
                 * photo twice the height of the screen. The cap never bites on
                 * any portrait phone or a 768px tablet; it only trims the
                 * landscape case.
                 */
                className="max-h-[75dvh]"
                /* The letterbox band around a `contain` shot. Nothing below md,
                   and a hairline from there up where the card border gives the
                   image an edge to keep away from. */
                imgClassName="md:p-3"
                style={
                  i === clampedIndex && zoomOrigin
                    ? { transform: "scale(2)", transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%` }
                    : undefined
                }
              />
            </div>
          ))}
        </div>

        {/*
          Floating controls, phone only — back / share / cart, supplied by the
          page. They sit above the photo because there's no header up there to
          hold them any more.
        */}
        {overlay && (
          <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 px-3 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] md:hidden">
            {overlay}
          </div>
        )}

        {/* Badges sit above the image but below the controls — pushed clear of
            the floating row on phones, back in the corner once it's gone. */}
        {badges && (
          <div
            className={cn(
              "pointer-events-none absolute left-3 z-10 flex flex-col gap-1.5",
              overlay ? "top-[3.75rem] md:top-3" : "top-3",
            )}
          >
            {badges}
          </div>
        )}

        {/* Bottom-right on phones, where the share/cart cluster owns the top. */}
        <div className="absolute bottom-3 right-3 z-10 md:bottom-auto md:top-3">
          <IconButton
            label="View full size"
            variant="surface"
            size="sm"
            onClick={() => setLightboxOpen(true)}
            className="shadow-card"
          >
            <Expand />
          </IconButton>
        </div>

        {/* No chevrons here. The track is swipeable, the thumbnails are one tap
            away, and two 40px buttons parked over the middle of the photo were
            covering the product to offer a worse version of both. `aria-live`
            is what announces the change now; arrow keys still page the track. */}
        {hasMultiple && (
          <p
            aria-live="polite"
            className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-pill bg-gray-900/70 px-2.5 py-1 text-xs font-medium text-white tabular-nums backdrop-blur-sm"
          >
            {clampedIndex + 1} / {images.length}
          </p>
        )}
      </div>

      {/* ── Thumbnails ───────────────────────────────────────── */}
      {hasMultiple && (
        <ul
          ref={thumbsRef}
          className={cn(
            "flex gap-2 overflow-x-auto scroll-smooth pb-1 scrollbar-hide sm:gap-2.5",
            // The stage bleeds to the screen edge below md but the thumbs
            // shouldn't, so they carry the page gutter themselves down there.
            // From md the stage is carded again and the strip goes back to its
            // 1px outdent, which stops the focus ring being clipped by the
            // scroll container.
            "px-4 sm:px-6 md:-mx-1 md:px-1",
          )}
        >
          {images.map((image, i) => (
            <li key={image.public_id || image.url || i} className="shrink-0">
              <button
                type="button"
                onClick={() => jumpTo(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === clampedIndex ? "true" : undefined}
                className={cn(
                  "block overflow-hidden rounded-lg border-2 bg-white transition-all duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-1",
                  i === clampedIndex
                    ? "border-pink-600 shadow-sm"
                    : "border-gray-200 opacity-70 hover:border-gray-300 hover:opacity-100",
                )}
              >
                <Image
                  src={image.url}
                  alt=""
                  aspect="square"
                  fit="contain"
                  width={160}
                  sizes="72px"
                  background="bg-white"
                  className="h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]"
                  imgClassName="p-1"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Lightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={images}
        index={clampedIndex}
        onIndexChange={jumpTo}
        alt={product?.name}
      />
    </div>
  )
}

/**
 * Full-screen image viewer. Kept local to the gallery rather than built on the
 * shared Modal because it needs an edge-to-edge dark surface with no card
 * chrome, which every other dialog in the app does want.
 *
 * Same snap track as the stage, so the swipe gesture is identical in both
 * places — but the chevrons stay here. On a full-screen viewer they aren't
 * covering anything you're trying to look at, a desktop user has no swipe
 * gesture to fall back on, and there's no thumbnail strip down here to page
 * with instead.
 */
const Lightbox = ({ open, onClose, images, index, onIndexChange, alt }) => {
  const trackRef = useRef(null)

  useScrollLock(open)
  useEscapeKey(open, onClose)

  /*
   * Two paths, same split as the stage.
   *
   * `glide` scrolls and nothing else. The move takes ~300ms, during which
   * `handleScroll` keeps reporting where the track actually is — so writing the
   * destination up front makes the counter read 2, then 1 as the glide crosses
   * the first half of the gap, then 2 again. Letting the scroll position be the
   * only writer costs nothing and can't disagree with itself.
   *
   * `jump` is instant, so there's no in-between to misreport — and it *does*
   * write the index, because a track that hasn't been laid out yet has
   * clientWidth 0, which makes the scroll a no-op the dots would never recover
   * from.
   */
  const glide = (next) => {
    if (next < 0 || next > images.length - 1) return
    trackRef.current?.scrollTo({ left: trackRef.current.clientWidth * next, behavior: "auto" })
  }

  const jump = (next) => {
    if (next < 0 || next > images.length - 1) return
    trackRef.current?.scrollTo({ left: trackRef.current.clientWidth * next, behavior: "instant" })
    onIndexChange(next)
  }

  /*
   * Park the track on the slide the gallery was showing, before first paint —
   * an effect would flash image 1 for a frame. `open` is the only dependency on
   * purpose: after this the scroll position leads and the index follows, so
   * re-running on `index` would fight every swipe.
   */
  useLayoutEffect(() => {
    if (!open) return
    const track = trackRef.current
    if (!track) return
    track.scrollTo({ left: track.clientWidth * index, behavior: "instant" })
  }, [open]) // `index` deliberately omitted — see above.

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event) => {
      if (event.key === "ArrowRight") glide(index + 1)
      if (event.key === "ArrowLeft") glide(index - 1)
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, index, images.length])

  if (!open) return null

  const handleScroll = () => {
    const track = trackRef.current
    if (!track || !track.clientWidth) return

    const next = Math.min(images.length - 1, Math.max(0, Math.round(track.scrollLeft / track.clientWidth)))
    if (next !== index) onIndexChange(next)
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${alt || "Product"} image viewer`}
      className="fixed inset-0 z-modal flex animate-fade-in flex-col bg-gray-900/95 backdrop-blur-sm"
    >
      <div className="flex shrink-0 items-center justify-between px-4 py-3 pt-safe">
        <p className="text-sm font-medium text-white/80 tabular-nums">
          {index + 1} / {images.length}
        </p>
        <IconButton label="Close image viewer" variant="ghost-light" onClick={onClose} autoFocus>
          <X />
        </IconButton>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="flex h-full w-full snap-x-mandatory overflow-x-auto overscroll-x-contain scroll-smooth scrollbar-hide"
        >
          {images.map((image, i) => (
            <div
              key={image.public_id || image.url || i}
              className="flex h-full w-full shrink-0 snap-start-always items-center justify-center px-4 pb-4"
            >
              <img
                src={image.url ? cloudinaryUrl(image.url, { width: 1600 }) : PLACEHOLDER_IMAGE}
                alt={`${alt || "Product"} — image ${i + 1}`}
                /* Only the visible one is worth a 1600px download up front. */
                loading={i === index ? "eager" : "lazy"}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            {/* Siblings of the track, not children — an absolutely positioned
                child of a scroll container scrolls away with the content. */}
            <div className="absolute inset-y-0 left-2 flex items-center sm:left-4">
              <IconButton
                label="Previous image"
                variant="ghost-light"
                onClick={() => glide(index - 1)}
                disabled={index === 0}
              >
                <ChevronLeft />
              </IconButton>
            </div>

            <div className="absolute inset-y-0 right-2 flex items-center sm:right-4">
              <IconButton
                label="Next image"
                variant="ghost-light"
                onClick={() => glide(index + 1)}
                disabled={index === images.length - 1}
              >
                <ChevronRight />
              </IconButton>
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        // One calc() rather than `pb-4 pb-safe`: both set padding-bottom, and
        // the custom utility would simply win, dropping the 1rem.
        <ul className="flex shrink-0 items-center justify-center gap-1 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          {images.map((image, i) => (
            <li key={image.public_id || image.url || i}>
              {/* 6px dot, 24px tap target — the padding is the hit area. */}
              <button
                type="button"
                onClick={() => jump(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                className="flex h-6 items-center px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span
                  className={cn(
                    "block h-1.5 rounded-full transition-all duration-300 ease-out-expo",
                    i === index ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70",
                  )}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>,
    document.body,
  )
}

export default ProductGallery
