import { useState } from "react"
import { cn } from "../../lib/cn"
import { PLACEHOLDER_IMAGE, cloudinarySrcSet, cloudinaryUrl } from "../../lib/cloudinary"

/**
 * Product/content image with the Lighthouse basics handled in one place:
 *
 *  - reserves space via `aspect` so the image can never cause layout shift
 *  - Cloudinary `f_auto,q_auto` + a real `srcset`, so a 375px phone downloads
 *    a 375px-wide AVIF instead of a 2000px PNG
 *  - lazy + async decoding by default; pass `priority` for the LCP image
 *  - fades in on decode, falls back to a placeholder on error
 *
 * `alt` is required by the signature — pass alt="" for decorative images.
 */

const ASPECTS = {
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
  wide: "aspect-[16/9]",
  banner: "aspect-[21/9]",
  auto: "",
}

const Image = ({
  src,
  alt = "",
  aspect = "square",
  fit = "cover",
  width,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  priority = false,
  /*
   * The colour behind the image. Matters for `fit="contain"`, where whatever
   * is behind it shows as a letterbox band — a product shot on a white studio
   * background needs `bg-white` here or it gets a visible grey frame. This is
   * a prop rather than something you pass through `className` because `cn()`
   * doesn't resolve Tailwind conflicts, so `bg-white` in className would lose
   * to the base class depending on stylesheet order.
   */
  background = "bg-gray-100",
  className,
  imgClassName,
  rounded = "",
  ...props
}) => {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  const resolvedSrc = errored || !src ? PLACEHOLDER_IMAGE : src

  const isPlaceholder = resolvedSrc === PLACEHOLDER_IMAGE
  const optimisedSrc = isPlaceholder ? resolvedSrc : cloudinaryUrl(resolvedSrc, { width: width || 800 })
  const srcSet = isPlaceholder ? undefined : cloudinarySrcSet(resolvedSrc)

  return (
    <div className={cn("relative overflow-hidden", background, ASPECTS[aspect] ?? ASPECTS.square, rounded, className)}>
      <img
        src={optimisedSrc}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchpriority={priority ? "high" : undefined}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setErrored(true)
          setLoaded(true)
        }}
        className={cn(
          "h-full w-full transition-opacity duration-500 ease-in-out-smooth",
          fit === "cover" ? "object-cover" : fit === "contain" ? "object-contain" : "object-fill",
          loaded ? "opacity-100" : "opacity-0",
          imgClassName,
        )}
        {...props}
      />
    </div>
  )
}

export default Image
