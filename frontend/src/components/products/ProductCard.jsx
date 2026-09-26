import { useState } from "react"
import { Link } from "react-router-dom"

import { formatPrice } from "../../lib/utils"
import { cn } from "../../lib/cn"
import { Image, getDiscount } from "../ui"

/**
 * The product card. One implementation, used by every grid and carousel on the
 * site — the home sections, the shop page and the "related products" rail.
 *
 * ── Why there's no button ────────────────────────────────────────────────
 *
 * There used to be a 40px add-to-cart button in the bottom-right of every
 * card, plus a stretched link over the whole thing. It bought a one-tap add
 * for products with no variants, and in exchange it cost a second focus stop
 * per card, a z-index layering problem, and — for the majority of products,
 * which do have a colour or size — a button that couldn't actually add
 * anything and just navigated to the detail page anyway.
 *
 * Now the card *is* the link. No button, no stretched pseudo-element, no
 * stacking: one anchor wraps everything, so there's one focus stop and one tap
 * target the size of the card. That's what removes the need for the
 * `after:absolute after:inset-0` trick and its z-index dance, and it's why the
 * focus ring can sit on the card itself rather than on a pseudo-box.
 *
 * The trade: adding from a grid means one extra tap on the detail page. For a
 * catalogue where most products need a size or colour chosen first, that's the
 * same number of taps as before for most of the grid, and one more for the
 * rest — paid for with a card that reads as product, not as a control panel.
 *
 * ── Design ───────────────────────────────────────────────────────────────
 *
 * No border, no shadow, no panel. The photo is the card; hairline chrome
 * around every tile in a 48-tile grid is what made the old grid feel busy.
 * Everything below the image is three lines at most: name, price, and the
 * strikethrough when there's a discount. The discount *is* the price display
 * now — a "25% off" pill stacked on a photo that already shows the struck
 * original was the same fact stated twice, and it was the loudest thing on
 * the card.
 */

/** Aspect used by both this card and its skeleton — 4:5 crops a jewellery or
 *  cosmetic bottle shot far less aggressively than a square while still giving
 *  the grid a consistent, slightly editorial proportion. */
const FRAME = "aspect-[4/5] w-full"

/** The card is unavailable if the product is, or if every variant is sold out. */
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
  const [hovered, setHovered] = useState(false)

  const href = `/products/${product._id}`
  const available = isAvailable(product)

  const primaryImage = product.images?.[0]?.url || product.image
  const secondImage = product.images?.[1]?.url

  // Only the struck-through original survives from the old price block. The
  // "N% off" pill is gone: the struck price already says there's a discount,
  // and the percentage is arithmetic the shopper can see.
  const discount = getDiscount(product.price, product.originalPrice)

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      /* `group` so the image can respond to hover anywhere on the card, not
         just on the photo itself. `h-full` because the grid stretches every
         cell to the row's tallest card — without it the caption can't reach the
         bottom and `mt-auto` below has nothing to push against, which is what
         makes prices line up across a row of uneven names. */
      className={cn("group h-full", className)}
    >
      <Link
        to={href}
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-card",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500",
          // Against the page, not the card — the card has no background of its
          // own any more, so an inner ring would have nothing to sit inside.
          "focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        )}
      >
        {/*
          Both photos are absolutely positioned children of the frame, so no
          image can ever change the frame's height — it is always exactly 4:5 of
          the card width.

          This is deliberate and worth keeping. The hover photo was once handed
          its positioning through Image's `className`, but cn() is a plain
          string joiner with no tailwind-merge, and Tailwind emits position
          utilities in source order — .relative comes after .absolute — so
          Image's own base class won the cascade and the second photo stayed in
          flow. It stacked under the first one, every card with two images was
          twice as tall, and because grid rows size to their tallest item, one
          such card dragged the whole row down with it.
        */}
        <div className={cn("relative shrink-0 overflow-hidden bg-gray-50", FRAME)}>
          <div className="absolute inset-0">
            <Image
              src={primaryImage}
              alt={product.name}
              aspect="auto"
              priority={priority}
              sizes={sizes}
              fit="cover"
              background="bg-gray-50"
              className="h-full w-full"
              imgClassName={cn(
                // Slow and small — a grid of cards that all lurch when the
                // pointer crosses them reads as jumpy.
                "transition-transform duration-[600ms] ease-out-expo group-hover:scale-[1.04]",
                secondImage && hovered && "opacity-0",
              )}
            />
          </div>

          {/*
            Crossfades over the first photo rather than swapping its src —
            swapping caused a blank flash while the new file downloaded.
          */}
          {secondImage && (
            <div
              aria-hidden="true"
              className={cn(
                "absolute inset-0 transition-opacity duration-500 ease-in-out-smooth",
                hovered ? "opacity-100" : "opacity-0",
              )}
            >
              <Image
                src={secondImage}
                alt=""
                aspect="auto"
                sizes={sizes}
                fit="cover"
                background="bg-gray-50"
                className="h-full w-full"
                imgClassName="scale-[1.04]"
              />
            </div>
          )}

          {/*
            A veil and one line of text. The old version dropped a white pill
            badged "Out of stock" into the middle of the photo, which is a lot
            of chrome for a state the shopper only needs told once.
          */}
          {!available && (
            <div className="absolute inset-0 flex items-end justify-center bg-white/60 pb-4">
              <span className="rounded-full bg-gray-900/80 px-3 py-1 text-[0.6875rem] font-medium tracking-wide text-white">
                Sold out
              </span>
            </div>
          )}
        </div>

        {/* `shrink-0` so a long name can't squeeze the photo — the ratio frame
            sets the height and the caption takes what's left. `mt-auto` on the
            price then pins it to the bottom of the stretched cell. */}
        <div className="flex flex-1 flex-col pt-2.5">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 transition-colors duration-200 group-hover:text-pink-600">
            {product.name}
          </h3>

          <p className="mt-auto flex flex-wrap items-baseline gap-x-1.5 pt-1.5">
            <span className="text-sm font-semibold text-gray-900">{formatPrice(product.price)}</span>

            {discount && (
              <span className="text-xs text-gray-400 line-through">{formatPrice(discount.original)}</span>
            )}
          </p>
        </div>
      </Link>
    </article>
  )
}

export default ProductCard
