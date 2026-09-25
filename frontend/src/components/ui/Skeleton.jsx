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

/** Product card placeholder — matches ProductCard's compact landscape image + 3 text rows. */
export const SkeletonProductCard = ({ className }) => (
  <div className={cn("overflow-hidden rounded-card border border-gray-100 bg-white shadow-card", className)}>
    <Skeleton className="aspect-[4/3] w-full" rounded="rounded-none" />
    <div className="space-y-2 p-2.5 sm:p-3">
      <Skeleton className="h-4 w-full" rounded="rounded" />
      <Skeleton className="h-3 w-1/2" rounded="rounded" />
      <Skeleton className="h-5 w-24" rounded="rounded" />
    </div>
  </div>
)

/** Grid of product placeholders matching the shop grid's column counts. */
export const SkeletonProductGrid = ({ count = 12, className }) => (
  <div
    className={cn("grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:gap-6 xl:grid-cols-4", className)}
    aria-hidden="true"
  >
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonProductCard key={i} />
    ))}
  </div>
)

export default Skeleton
