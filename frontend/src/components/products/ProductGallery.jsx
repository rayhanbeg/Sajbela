import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react"
import { createPortal } from "react-dom"

import { cn } from "../../lib/cn"
import { PLACEHOLDER_IMAGE, cloudinaryUrl, productImageUrl } from "../../lib/cloudinary"
import { useEscapeKey, useMediaQuery, useScrollLock } from "../../lib/hooks"
import { Image, IconButton } from "../ui"

/**
 * Product image gallery: main stage, thumbnail strip, hover zoom and a
 * full-screen lightbox.
 *
 * The old detail page rendered a plain <img> with six inline style overrides
 * fighting each other, no keyboard support and no way to see an image larger
 * than the column it sat in.
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

const ProductGallery = ({ product, badges, overlay, className }) => {
  const images = Array.isArray(product?.images) && product.images.length > 0 ? product.images : [{ url: null }]

  const [index, setIndex] = useState(0)
  const [zoomOrigin, setZoomOrigin] = useState(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const thumbsRef = useRef(null)

  const canZoom = useMediaQuery("(hover: hover) and (pointer: fine)")
  const hasMultiple = images.length > 1

  // A different product in the same route (related-product click) resets the stage.
  useEffect(() => {
    setIndex(0)
    setZoomOrigin(null)
  }, [product?._id])

  const clampedIndex = Math.min(index, images.length - 1)
  const currentUrl = images[clampedIndex]?.url || productImageUrl(product, clampedIndex)

  const go = (delta) => {
    setZoomOrigin(null)
    setIndex((prev) => (prev + delta + images.length) % images.length)
  }

  const select = (next) => {
    setZoomOrigin(null)
    setIndex(next)
    // Keep the active thumbnail visible when the strip overflows.
    thumbsRef.current?.children[next]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" })
  }

  const handleKeyDown = (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault()
      go(1)
    } else if (event.key === "ArrowLeft") {
      event.preventDefault()
      go(-1)
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
    <div className={cn("flex flex-col gap-3 md:gap-4", className)}>
      {/* ── Main stage ───────────────────────────────────────── */}
      <div
        role="group"
        aria-label="Product images"
        aria-roledescription="carousel"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseMove={trackPointer}
        onMouseLeave={() => setZoomOrigin(null)}
        className={cn(
          "group relative overflow-hidden bg-white",
          "md:rounded-card md:border md:border-gray-100",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2",
          canZoom && "cursor-zoom-in",
        )}
      >
        <Image
          key={currentUrl}
          src={currentUrl}
          alt={`${product?.name || "Product"} — image ${clampedIndex + 1} of ${images.length}`}
          aspect="square"
          fit="contain"
          width={960}
          sizes="(max-width: 1024px) 100vw, 45vw"
          priority
          className="bg-white"
          /* The letterbox band around a `contain` shot. It used to be p-2
             rising to p-4, which on a 375px screen spent 8% of the stage on
             white space around a photo that already ships with its own
             margin. Nothing below md, and a hairline from there up where the
             card border gives the image an edge to keep away from. */
          imgClassName="md:p-3"
          style={
            zoomOrigin
              ? { transform: "scale(2)", transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%` }
              : undefined
          }
        />

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
              "pointer-events-none absolute left-3 flex flex-col gap-1.5",
              overlay ? "top-[3.75rem] md:top-3" : "top-3",
            )}
          >
            {badges}
          </div>
        )}

        {/* Bottom-right on phones, where the share/cart cluster owns the top. */}
        <div className="absolute bottom-3 right-3 md:bottom-auto md:top-3">
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

        {hasMultiple && (
          <>
            {/* Arrows fade in on hover for pointers, stay visible on touch. */}
            <div
              className={cn(
                "absolute inset-y-0 left-2 flex items-center transition-opacity duration-200",
                canZoom && "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
              )}
            >
              <IconButton label="Previous image" variant="surface" onClick={() => go(-1)} className="shadow-card">
                <ChevronLeft />
              </IconButton>
            </div>

            <div
              className={cn(
                "absolute inset-y-0 right-2 flex items-center transition-opacity duration-200",
                canZoom && "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
              )}
            >
              <IconButton label="Next image" variant="surface" onClick={() => go(1)} className="shadow-card">
                <ChevronRight />
              </IconButton>
            </div>

            <p
              aria-live="polite"
              className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-pill bg-gray-900/70 px-2.5 py-1 text-xs font-medium text-white tabular-nums backdrop-blur-sm"
            >
              {clampedIndex + 1} / {images.length}
            </p>
          </>
        )}
      </div>

      {/* ── Thumbnails ───────────────────────────────────────── */}
      {hasMultiple && (
        <ul
          ref={thumbsRef}
          className={cn(
            "flex gap-2 overflow-x-auto pb-1 scrollbar-hide sm:gap-2.5",
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
                onClick={() => select(i)}
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
                  className="h-16 w-16 bg-white sm:h-[4.5rem] sm:w-[4.5rem]"
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
        onIndexChange={select}
        alt={product?.name}
      />
    </div>
  )
}

/**
 * Full-screen image viewer. Kept local to the gallery rather than built on the
 * shared Modal because it needs an edge-to-edge dark surface with no card
 * chrome, which every other dialog in the app does want.
 */
const Lightbox = ({ open, onClose, images, index, onIndexChange, alt }) => {
  useScrollLock(open)
  useEscapeKey(open, onClose)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event) => {
      if (event.key === "ArrowRight") onIndexChange((index + 1) % images.length)
      if (event.key === "ArrowLeft") onIndexChange((index - 1 + images.length) % images.length)
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, index, images.length, onIndexChange])

  if (!open) return null

  const src = images[index]?.url
  const full = src ? cloudinaryUrl(src, { width: 1600 }) : PLACEHOLDER_IMAGE

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

      <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-4">
        <img
          src={full}
          alt={`${alt || "Product"} — image ${index + 1}`}
          className="max-h-full max-w-full object-contain"
        />
      </div>

      {images.length > 1 && (
        // One calc() rather than `pb-4 pb-safe`: both set padding-bottom, and
        // the custom utility would simply win, dropping the 1rem.
        <div className="flex shrink-0 items-center justify-center gap-2 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          <IconButton
            label="Previous image"
            variant="ghost-light"
            onClick={() => onIndexChange((index - 1 + images.length) % images.length)}
          >
            <ChevronLeft />
          </IconButton>

          <ul className="flex gap-1.5">
            {images.map((image, i) => (
              <li key={image.public_id || image.url || i}>
                <button
                  type="button"
                  onClick={() => onIndexChange(i)}
                  aria-label={`Show image ${i + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300 ease-out-expo",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-white",
                    i === index ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70",
                  )}
                />
              </li>
            ))}
          </ul>

          <IconButton
            label="Next image"
            variant="ghost-light"
            onClick={() => onIndexChange((index + 1) % images.length)}
          >
            <ChevronRight />
          </IconButton>
        </div>
      )}
    </div>,
    document.body,
  )
}

export default ProductGallery
