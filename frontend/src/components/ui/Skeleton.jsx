import { cn } from "../../lib/cn"

/**
 * Shimmer placeholder used while data loads.
 *
 * Skeletons must match the real content's dimensions, otherwise they trade one
 * layout shift for another — the page-level skeletons in this app mirror the
 * exact grid and card heights they stand in for.
 */
const Skeleton = ({ className, rounded = "rounded-lg", ...props }) => {
  return (
    <div
      aria-hidden="true"
      className={cn("relative overflow-hidden bg-gray-200/80", rounded, className)}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  )
}

/** Multi-line text placeholder; the last line is short, like real text. */
export const SkeletonText = ({ lines = 3, className }) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={cn("h-3.5", i === lines - 1 ? "w-2/3" : "w-full")} rounded="rounded" />
    ))}
  </div>
)

/** Product card placeholder. Tracks ProductCard's 4:5 image + two title lines +
 *  price row — if this drifts, load introduces the layout shift the skeleton
 *  exists to prevent.
 *
 *  No card chrome (border, shadow, white panel): ProductCard dropped all three,
 *  so a placeholder that still drew them would flash a boxed grid and then
 *  un-box it the moment data landed. */
export const SkeletonProductCard = ({ className }) => (
  <div className={cn(className)}>
    <Skeleton className="aspect-[4/5] w-full rounded-card" />
    <div className="space-y-2 pt-2.5">
      <Skeleton className="h-4 w-full" rounded="rounded" />
      <Skeleton className="h-4 w-2/3" rounded="rounded" />
      <Skeleton className="h-5 w-20" rounded="rounded" />
    </div>
  </div>
)

/** Grid of product placeholders matching the shop grid's column counts. */
export const SkeletonProductGrid = ({ count = 12, className }) => (
  <div
    className={cn("grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:gap-5 xl:grid-cols-4", className)}
    aria-hidden="true"
  >
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonProductCard key={i} />
    ))}
  </div>
)

export default Skeleton
