import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { ShoppingBag, SlidersHorizontal } from "lucide-react"

import { addToCartAsync, fetchCart } from "../../lib/store/cartSlice"
import { cn } from "../../lib/cn"
import { Badge, Image, Price, Rating, Spinner, getDiscount, useToast } from "../ui"
import { useStorefrontUI } from "../../lib/storefrontUI"

/**
 * The product card. One implementation, used by every grid and carousel on the
 * site — the home sections, the shop page and the "related products" rail all
 * previously inlined their own near-identical copy, which is why the NEW badge
 * showed on featured products that weren't new and the stars rendered as text
 * glyphs in some places and not others.
 *
 * Accessibility note: the old card nested an add-to-cart <button> inside the
 * card's <Link>, which is invalid HTML and made the button unreachable for
 * some screen readers. Here the title is the only link, and it stretches over
 * the whole card via `after:absolute after:inset-0`; the button sits above it
 * on the z-axis. Result: one link, one button, whole card still clickable.
 */

/** Variant products can't be added from a grid — you have to pick a size/colour first. */
function needsVariantChoice(product) {
  if (product.category === "bangles") return true
  if (product.colors?.length > 0) return true
  if (product.sizes?.length > 0) return true
  return false
}

/** Mirrors the backend's per-variant stock model. */
function isAvailable(product) {
  if (product.category === "bangles" && product.sizes?.length) {
    return product.sizes.some((size) => size.available && size.stock > 0)
  }
  if (product.colors?.length) {
    return product.colors.some((color) => color.available && color.stock > 0)
  }
  return Boolean(product.inStock) && Number(product.stock) > 0
}

const ProductCard = ({ product, priority = false, sizes, className }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const { openCart } = useStorefrontUI()

  // Local, not the shared cart.loading flag — that one is global, so a single
  // add-to-cart used to put every card on the page into a loading state.
  const [pending, setPending] = useState(false)
  const [hovered, setHovered] = useState(false)

  const href = `/products/${product._id}`
  const available = isAvailable(product)
  const variantChoice = needsVariantChoice(product)
  const discount = getDiscount(product.price, product.originalPrice)

  const primaryImage = product.images?.[0]?.url || product.image
  const secondImage = product.images?.[1]?.url

  const handleAction = async (event) => {
    event.preventDefault()
    event.stopPropagation()

    // Send shoppers to the detail page to choose a variant.
    if (variantChoice) {
      navigate(href)
      return
    }

    setPending(true)
    try {
      await dispatch(addToCartAsync({ productId: product._id, quantity: 1 })).unwrap()
      toast.success(`${product.name} added to your cart`)
      openCart()
    } catch (error) {
      const message = typeof error === "string" ? error : error?.message || "Could not add to cart"

      // Guests are bounced to login for now; Phase 5 gives them a local cart.
      if (/login/i.test(message)) {
        navigate(`/auth/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`)
        return
      }

      toast.error(message)
      // Re-sync in case the failure was a stale local quantity.
      dispatch(fetchCart())
    } finally {
      setPending(false)
    }
  }

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-card border border-gray-100 bg-white",
        "shadow-card transition-all duration-300 ease-out-expo",
        "hover:-translate-y-1 hover:border-pink-100 hover:shadow-card-hover",
        className,
      )}
    >
      <div className="relative overflow-hidden bg-gray-50">
        <Image
          src={primaryImage}
          alt={product.name}
          aspect="square"
          priority={priority}
          sizes={sizes}
          imgClassName={cn(
            "transition-transform duration-500 ease-out-expo group-hover:scale-105",
            secondImage && hovered && "opacity-0",
          )}
        />

        {/*
          Second image crossfades on top rather than swapping the first one's
          src — swapping caused a blank flash while the new file downloaded.
        */}
        {secondImage && (
          <Image
            src={secondImage}
            alt=""
            aria-hidden="true"
            aspect="square"
            sizes={sizes}
            className={cn(
              "absolute inset-0 transition-opacity duration-500 ease-in-out-smooth",
              hovered ? "opacity-100" : "opacity-0",
            )}
            imgClassName="scale-105"
          />
        )}

        <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1.5 md:left-3 md:top-3">
          {discount && (
            <Badge tone="danger-solid" size="sm">
              {discount.percent}% off
            </Badge>
          )}
          {product.isNewArrival && (
            <Badge tone="brand-solid" size="sm">
              New
            </Badge>
          )}
          {product.isCombo && (
            <Badge tone="info" size="sm">
              Combo
            </Badge>
          )}
        </div>

        {!available && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
            <Badge tone="danger" size="md">
              Out of stock
            </Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 md:p-4">
        <h3 className="text-sm font-semibold leading-snug text-gray-900 md:text-[0.9375rem]">
          <Link
            to={href}
            className={cn(
              "line-clamp-2 transition-colors after:absolute after:inset-0 after:content-['']",
              "hover:text-pink-600 focus:outline-none",
              /*
               * The focus ring is drawn on the stretched ::after box, not on
               * the article — a focus-within ring on the card would also fire
               * when the add-to-cart button is focused, doubling up with that
               * button's own ring.
               */
              "focus-visible:after:rounded-card focus-visible:after:outline focus-visible:after:outline-2",
              "focus-visible:after:outline-offset-2 focus-visible:after:outline-pink-500",
            )}
          >
            {product.name}
          </Link>
        </h3>

        {Number(product.numReviews) > 0 ? (
          <Rating value={product.rating} count={product.numReviews} size="xs" />
        ) : (
          <span className="text-xs text-gray-400">No reviews yet</span>
        )}

        {/* mt-auto pins the price row to the bottom so uneven titles still line up. */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <Price price={product.price} originalPrice={product.originalPrice} size="md" showBadge={false} />

          <button
            type="button"
            onClick={handleAction}
            disabled={!available || pending}
            aria-label={
              !available
                ? `${product.name} is out of stock`
                : variantChoice
                  ? `Choose options for ${product.name}`
                  : `Add ${product.name} to cart`
            }
            className={cn(
              "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2",
              available
                ? "bg-pink-600 text-white hover:bg-pink-700 active:scale-95"
                : "cursor-not-allowed bg-gray-100 text-gray-400",
              pending && "cursor-wait",
            )}
          >
            {pending ? (
              // label={null} — the button's own aria-label already names the action.
              <Spinner size="xs" label={null} />
            ) : variantChoice ? (
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
            ) : (
              <ShoppingBag aria-hidden="true" className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
