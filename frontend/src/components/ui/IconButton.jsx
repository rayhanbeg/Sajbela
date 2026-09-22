import { forwardRef } from "react"
import { Link } from "react-router-dom"
import { cn } from "../../lib/cn"

/**
 * Square icon-only button. Always requires an accessible `label`, which becomes
 * both aria-label and the native tooltip.
 */

const VARIANTS = {
  ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 focus-visible:ring-gray-400",
  "ghost-light": "text-white/90 hover:bg-white/15 hover:text-white active:bg-white/25 focus-visible:ring-white",
  "ghost-brand": "text-pink-600 hover:bg-pink-50 active:bg-pink-100 focus-visible:ring-pink-500",
  solid: "bg-pink-600 text-white shadow-sm hover:bg-pink-700 active:bg-pink-800 focus-visible:ring-pink-500",
  outline: "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus-visible:ring-gray-400",
  surface: "bg-white text-gray-700 shadow-card hover:bg-gray-50 hover:shadow-card-hover focus-visible:ring-gray-400",
  danger: "text-red-600 hover:bg-red-50 active:bg-red-100 focus-visible:ring-red-500",
}

const SIZES = {
  xs: "h-7 w-7 rounded-md [&_svg]:h-3.5 [&_svg]:w-3.5",
  sm: "h-9 w-9 rounded-lg [&_svg]:h-4 [&_svg]:w-4",
  md: "h-10 w-10 rounded-lg [&_svg]:h-5 [&_svg]:w-5",
  lg: "h-11 w-11 rounded-lg [&_svg]:h-5 [&_svg]:w-5",
  xl: "h-12 w-12 rounded-xl [&_svg]:h-6 [&_svg]:w-6",
}

const IconButton = forwardRef(function IconButton(
  { to, href, label, variant = "ghost", size = "md", disabled = false, className, children, type = "button", ...props },
  ref,
) {
  const classes = cn(
    "relative inline-flex items-center justify-center shrink-0",
    "transition-[background-color,color,box-shadow,transform] duration-200 ease-in-out-smooth",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "active:scale-95 disabled:active:scale-100",
    SIZES[size] || SIZES.md,
    VARIANTS[variant] || VARIANTS.ghost,
    className,
  )

  const content = <span aria-hidden="true">{children}</span>

  if (to && !disabled) {
    return (
      <Link ref={ref} to={to} className={classes} aria-label={label} title={label} {...props}>
        {content}
      </Link>
    )
  }

  if (href && !disabled) {
    return (
      <a ref={ref} href={href} className={classes} aria-label={label} title={label} {...props}>
        {content}
      </a>
    )
  }

  return (
    <button ref={ref} type={type} className={classes} disabled={disabled} aria-label={label} title={label} {...props}>
      {content}
    </button>
  )
})

export default IconButton
