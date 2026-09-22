import { forwardRef } from "react"
import { Link } from "react-router-dom"
import { cn } from "../../lib/cn"
import Spinner from "./Spinner"

/**
 * The one button in the app.
 *
 * Renders as <button>, or as a router <Link> when `to` is passed, or as an
 * <a> when `href` is passed — so every clickable affordance shares one visual
 * language and one focus treatment.
 *
 * All variants stay inside the locked brand palette.
 */

const VARIANTS = {
  // Solid brand — the single primary action on a screen.
  primary:
    "bg-pink-600 text-white shadow-sm hover:bg-pink-700 active:bg-pink-800 " +
    "focus-visible:ring-pink-500 disabled:hover:bg-pink-600",
  // Outlined brand — secondary action sitting next to a primary.
  secondary:
    "border border-pink-600 text-pink-600 bg-white hover:bg-pink-50 active:bg-pink-100 " +
    "focus-visible:ring-pink-500 disabled:hover:bg-white",
  // Neutral outline — tertiary / cancel.
  outline:
    "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 " +
    "active:bg-gray-100 focus-visible:ring-gray-400 disabled:hover:bg-white",
  // Low-emphasis, no chrome until hover.
  ghost: "text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-400",
  // Brand-tinted ghost, for inline links that need a hit area.
  "ghost-brand": "text-pink-600 hover:bg-pink-50 active:bg-pink-100 focus-visible:ring-pink-500",
  // Destructive — delete product, cancel order.
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500",
  "danger-soft": "bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200 focus-visible:ring-red-500",
  // Dark neutral, used for "View all" style CTAs on light sections.
  dark: "bg-gray-900 text-white shadow-sm hover:bg-gray-800 active:bg-black focus-visible:ring-gray-600",
}

const SIZES = {
  // 44px min touch target on sm and up — meets WCAG 2.5.5 on mobile.
  xs: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-5 text-sm gap-2 rounded-lg",
  lg: "h-12 px-6 text-base gap-2 rounded-lg",
  xl: "h-14 px-8 text-base gap-2.5 rounded-xl",
}

const Button = forwardRef(function Button(
  {
    as,
    to,
    href,
    variant = "primary",
    size = "md",
    fullWidth = false,
    loading = false,
    loadingText,
    disabled = false,
    leftIcon,
    rightIcon,
    className,
    children,
    type = "button",
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading

  const classes = cn(
    "inline-flex items-center justify-center font-semibold whitespace-nowrap select-none",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-in-out-smooth",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
    "active:scale-[0.98] disabled:active:scale-100",
    SIZES[size] || SIZES.md,
    VARIANTS[variant] || VARIANTS.primary,
    fullWidth && "w-full",
    className,
  )

  const content = (
    <>
      {loading ? (
        <Spinner size={size === "xs" || size === "sm" ? "xs" : "sm"} label={null} />
      ) : (
        leftIcon && (
          <span aria-hidden="true" className="shrink-0">
            {leftIcon}
          </span>
        )
      )}
      {loading && loadingText ? loadingText : children}
      {!loading && rightIcon && (
        <span aria-hidden="true" className="shrink-0">
          {rightIcon}
        </span>
      )}
    </>
  )

  // Router link
  if (to && !isDisabled) {
    return (
      <Link ref={ref} to={to} className={classes} {...props}>
        {content}
      </Link>
    )
  }

  // External / tel: / mailto: link
  if (href && !isDisabled) {
    return (
      <a ref={ref} href={href} className={classes} {...props}>
        {content}
      </a>
    )
  }

  const Component = as || "button"

  return (
    <Component
      ref={ref}
      type={Component === "button" ? type : undefined}
      className={classes}
      disabled={Component === "button" ? isDisabled : undefined}
      aria-disabled={Component !== "button" ? isDisabled : undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {content}
    </Component>
  )
})

export default Button
