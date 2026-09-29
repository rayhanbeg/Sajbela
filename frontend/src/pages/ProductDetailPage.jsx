import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { ArrowLeft, BadgeCheck, PackageX, Share2, ShoppingBag, Truck, Wallet } from "lucide-react"

import { addToCartAsync } from "../lib/store/cartSlice"
import { clearCurrentProduct, fetchProductById } from "../lib/store/productSlice"
import { categoryLabel, categoryPath, SHIPPING } from "../lib/navigation"
import { isProductAvailable } from "../lib/catalog"
import { formatPrice } from "../lib/utils"
import { cn } from "../lib/cn"
import { useStorefrontUI } from "../lib/storefrontUI"
import ProductGallery from "../components/products/ProductGallery"
import { ColorPicker, SizePicker } from "../components/products/VariantPicker"
import ProductShowcase from "../components/home/ProductShowcase"
import ReviewsList from "../components/ReviewsList"
import {
  Badge,
  Breadcrumbs,
  Button,
  CountBadge,
  EmptyState,
  ErrorState,
  IconButton,
  Modal,
  Price,
  QuantityStepper,
  Rating,
  Skeleton,
  Tabs,
  getDiscount,
  useToast,
} from "../components/ui"

/**
 * /product/:id — the product detail page.
 *
 * What changed from the previous version, beyond the visuals:
 *  - the two bespoke variant dropdowns became always-visible swatches/chips
 *    (see VariantPicker), so sold-out options are visible instead of filtered
 *    out and picking one is a single tap
 *  - `alert()` × 6 became toasts, and a successful add opens the cart drawer
 *  - the gallery gained thumbnails, keyboard nav, hover zoom and a lightbox
 *  - on phones the buy actions moved into a fixed bar at the bottom of the
 *    screen, which the layout swaps in for the bottom nav on this route
 *  - adding to cart no longer requires an account. It used to stash the chosen
 *    size/colour under `pendingProductSelection`, redirect to /auth/register,
 *    and replay the add on return — a signup wall in front of the cart, with a
 *    replay path that silently dropped the selection if the shopper signed in
 *    from a different page. Guests get a real cart now (lib/guestCart), which
 *    merges onto the account if they ever make one.
 */

/**
 * Mirrors the stock resolution in backend/controllers/cartController.addToCart
 * so the quantity cap on screen matches the one the API will enforce.
 *
 * Note what it does *not* answer: with nothing selected it falls through to
 * `product.stock`, which for a product whose stock lives on its sizes or
 * colours is 0. Availability is `isProductAvailable`; this is the cap.
 */
function resolveStock(product, size, color) {
  if (!product) return 0
  if (product.category === "bangles" && size) return Number(size.stock) || 0
  if (color) return Number(color.stock) || 0
  if (size) return Number(size.stock) || 0
  return Number(product.stock) || 0
}

const ProductDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const toast = useToast()
  const { openCart } = useStorefrontUI()

  const { currentProduct: product, loading, error } = useSelector((state) => state.products)
  const cartCount = useSelector((state) => state.cart.totalItems)

  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [pending, setPending] = useState(null) // "add" | "buy" | null
  // Which action the variant window is collecting for — null when it's closed.
  // It carries the intent rather than a boolean, so one window serves both
  // buttons and its confirm button knows what to do when it closes.
  const [choiceMode, setChoiceMode] = useState(null) // "add" | "buy" | null

  useEffect(() => {
    if (id) dispatch(fetchProductById(id))
    return () => dispatch(clearCurrentProduct())
  }, [dispatch, id])

  // Reset on a genuine product change (following a related-product link),
  // not on every store update that hands back a new object identity.
  useEffect(() => {
    setSelectedSize(null)
    setSelectedColor(null)
    setQuantity(1)
  }, [product?._id])

  const sizeOptions = useMemo(
    () => (product?.sizes || []).filter((option) => option?.size && String(option.size).trim() !== ""),
    [product],
  )
  const colorOptions = useMemo(() => product?.colors || [], [product])

  const requiresSize = sizeOptions.length > 0
  const requiresColor = colorOptions.length > 0
  const maxStock = resolveStock(product, selectedSize, selectedColor)

  /** Clamp the quantity down when a smaller-stock variant is picked. */
  useEffect(() => {
    setQuantity((current) => (maxStock > 0 ? Math.min(current, maxStock) : 1))
  }, [maxStock])

  /**
   * True only when a *choice* is outstanding — `product.stock > 0` was never
   * consulted, so this says nothing about availability. `inStock` is separate.
   */
  const missingChoice = (requiresSize && !selectedSize) || (requiresColor && !selectedColor)

  /*
   * Availability — not the same question as `maxStock > 0`.
   *
   * It used to be exactly that, and it was wrong for most of the catalogue:
   * before a variant is picked `resolveStock` returns `product.stock`, which is
   * 0 whenever stock lives on the sizes or colours. Both buttons therefore
   * arrived disabled and labelled "Out of stock", and only came alive once a
   * size or colour was chosen — the very ordering the variant window exists to
   * remove. You can't ask someone to pick a size for a product the page is
   * simultaneously telling them it doesn't have.
   *
   * So: before a choice is made, ask the product; after one is made, ask the
   * chosen variant, which is what the API will check on add.
   */
  const inStock = missingChoice ? isProductAvailable(product) : maxStock > 0

  /*
   * Both triggers funnel through here so the gate lives in exactly one place.
   *
   * "Add to cart" with a size/colour still outstanding opens the picker window
   * instead of adding — the window asks for what's missing and the button in
   * there calls straight back into this same function with the choice now made.
   * Only once every required option has been chosen does it add on the spot.
   *
   * The alternative was to block the trigger and relabel it "Select a size",
   * which is what this page used to do. It reads as a dead button, and it makes
   * the customer satisfy a form before they're allowed to express intent. Both
   * buttons are now always live, and the one thing that genuinely has to be
   * answered — which variant — is answered in the window, once, for both paths.
   */
  const startAction = (mode) => {
    if (missingChoice) {
      setChoiceMode(mode)
      return
    }
    addToCart(mode)
  }

  const addToCart = async (mode) => {
    if (!product) return

    if (requiresSize && !selectedSize) {
      toast.error("Please choose a size first")
      return
    }
    if (requiresColor && !selectedColor) {
      toast.error("Please choose a colour first")
      return
    }

    setPending(mode)
    try {
      await dispatch(
        addToCartAsync({
          productId: product._id,
          quantity,
          selectedSize: selectedSize?.size,
          selectedColor: selectedColor?.name,
          // Saves the guest branch a round trip: this page already has it.
          product,
        }),
      ).unwrap()

      if (mode === "buy") {
        setChoiceMode(null)
        navigate("/checkout")
      } else {
        toast.success(`${product.name} added to your cart`)
        openCart()
      }
    } catch (failure) {
      toast.error(typeof failure === "string" ? failure : "Couldn't add this to your cart")
    } finally {
      setPending(null)
    }
  }

  /* ── Floating header actions (phones) ──────────────────── */

  /*
   * `navigate(-1)` alone is a trap on a shared link: the shopper arrived from
   * WhatsApp, there's no entry before this one, and back either does nothing or
   * leaves the site. React Router stamps its own index on the history entry, so
   * we can tell the two apart and fall back to the category the product is in.
   */
  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1)
    else navigate(product ? categoryPath(product.category) : "/products")
  }

  /* Native share sheet where there is one, clipboard everywhere else. */
  const handleShare = async () => {
    if (!product) return

    const url = window.location.href
    const copy = async () => {
      await navigator.clipboard.writeText(url)
      toast.success("Link copied")
    }

    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text: product.name, url })
        return
      }
      await copy()
    } catch (failure) {
      // Dismissing the OS sheet rejects with AbortError. That's a decision, not
      // a failure — telling them it went wrong would be a lie.
      if (failure?.name === "AbortError") return
      try {
        await copy()
      } catch {
        toast.error("Couldn't share this product")
      }
    }
  }

  /* ── Loading / error / missing ─────────────────────────── */

  if (loading && !product) return <ProductDetailSkeleton />

  if (error) {
    return (
      <div className="page-container py-16">
        <ErrorState
          title="We couldn't load this product"
          description={typeof error === "string" ? error : undefined}
          onRetry={() => dispatch(fetchProductById(id))}
        />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="page-container py-16">
        <EmptyState
          icon={<PackageX />}
          title="Product not found"
          description="This link may be out of date."
          action={<Button to="/products">Browse all products</Button>}
        />
      </div>
    )
  }

  /* ── Derived display values ────────────────────────────── */

  const discount = getDiscount(product.price, product.originalPrice)
  const label = categoryLabel(product.category)

  const actions = (
    <>
      {/*
        Neither button is gated on the variant pickers any more. The only
        genuine blocker is stock, which the API enforces regardless.
      */}
      <Button
        size="lg"
        fullWidth
        onClick={() => startAction("add")}
        disabled={!inStock}
        loading={pending === "add"}
        loadingText="Adding…"
        leftIcon={<ShoppingBag className="h-5 w-5" />}
      >
        {inStock ? "Add to cart" : "Out of stock"}
      </Button>

      <Button
        variant="dark"
        size="lg"
        fullWidth
        onClick={() => startAction("buy")}
        disabled={!inStock}
        loading={pending === "buy"}
        loadingText="Just a moment…"
      >
        Buy now
      </Button>
    </>
  )

  const tabs = [
    {
      id: "description",
      label: "Description",
      content: (
        <div className="max-w-3xl">
          <p className="whitespace-pre-line leading-relaxed text-gray-700">{product.description}</p>

          {product.tags?.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <li key={tag}>
                  <Badge tone="neutral">{tag}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      ),
    },
    {
      id: "specifications",
      label: "Specifications",
      content: <Specifications product={product} />,
    },
    {
      id: "shipping",
      label: "Delivery",
      content: <ShippingInfo />,
    },
    {
      id: "reviews",
      label: "Reviews",
      count: product.numReviews || 0,
      content: <ReviewsList productId={product._id} />,
    },
  ]

  const galleryOverlay = (
    <>
      <IconButton label="Go back" variant="surface" onClick={goBack} className="shadow-card">
        <ArrowLeft />
      </IconButton>

      <div className="flex items-center gap-2">
        <IconButton label="Share this product" variant="surface" onClick={handleShare} className="shadow-card">
          <Share2 />
        </IconButton>

        {/* The header carried the cart on every other route; this route hides
            it, so the cart comes along with the floating controls rather than
            leaving the phone with no way back to it. */}
        <IconButton
          label={cartCount > 0 ? `Open cart, ${cartCount} items` : "Open cart"}
          variant="surface"
          onClick={openCart}
          className="shadow-card"
        >
          <ShoppingBag />
          <CountBadge count={cartCount} className="-right-1 -top-1" label={null} />
        </IconButton>
      </div>
    </>
  )

  return (
    <div className="bg-gray-50">
      {/*
        ── Breadcrumbs ───────────────────────────────────────
        md and up only. Below that the site header is hidden on this route and
        the gallery owns the top of the screen, so a breadcrumb bar would be
        the one strip of chrome left above a full-bleed photo — back and share
        float on the image instead.
      */}
      <div className="hidden border-b border-gray-100 bg-white md:block">
        <div className="page-container py-3">
          <Breadcrumbs
            items={[
              { label: "Shop", to: "/products" },
              { label, to: categoryPath(product.category) },
              { label: product.name },
            ]}
          />
        </div>
      </div>

      <div className="page-container pb-6 pt-0 md:py-10">
        <div className="grid gap-6 md:gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10 xl:gap-14">
          {/* ── Gallery ──────────────────────────────────────── */}
          {/* Cancels the container's gutter below md so the stage reaches both
              screen edges. The values have to track .page-container's own
              px-4 / sm:px-6 — md and up it's carded again and the outdent goes. */}
          <div className="-mx-4 sm:-mx-6 md:mx-0 lg:sticky lg:top-24 lg:self-start">
            <ProductGallery
              product={product}
              overlay={galleryOverlay}
              badges={
                <>
                  {discount && <Badge tone="danger-solid">{discount.percent}% off</Badge>}
                  {product.isNewArrival && <Badge tone="brand-solid">New</Badge>}
                  {product.isCombo && <Badge tone="info">Combo</Badge>}
                </>
              }
            />
          </div>

          {/* ── Buying panel ─────────────────────────────────── */}
          <div className="min-w-0">
            {/*
              No category eyebrow above the title: the breadcrumb directly
              above this column already reads Shop → Earrings → <name>, so an
              uppercase "EARRINGS" line was the same word twice in 40px.
            */}
            <h1 className="text-display-sm font-bold leading-tight text-gray-900">{product.name}</h1>

            {(product.numReviews > 0 || product.rating > 0) && (
              <Rating
                value={product.rating}
                count={product.numReviews}
                size="md"
                showValue
                className="mt-2.5"
              />
            )}

            {/*
              Price alone. It already strikes through the original and the
              gallery carries a "N% off" badge, so the old "You save ৳x" line
              next to it was the third statement of one fact. The truncated
              two-line description that followed is gone too — it was the first
              sentence of the Description tab, cut mid-word.
            */}
            <div className="mt-4">
              <Price price={product.price} originalPrice={product.originalPrice} size="xl" />
            </div>

            {/* ── Variants ───────────────────────────────────── */}
            {(requiresColor || requiresSize) && (
              <div className="mt-6 space-y-5 border-t border-gray-200 pt-6">
                {requiresColor && (
                  <ColorPicker colors={colorOptions} value={selectedColor} onChange={setSelectedColor} />
                )}
                {requiresSize && <SizePicker sizes={sizeOptions} value={selectedSize} onChange={setSelectedSize} />}
              </div>
            )}

            {/* ── Stock + quantity ───────────────────────────── */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <StockLine missingChoice={missingChoice} inStock={inStock} maxStock={maxStock} />

              <div className="mt-4 flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-900">Quantity</span>
                <QuantityStepper
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={Math.max(1, maxStock)}
                  disabled={missingChoice || !inStock}
                />
                {inStock && !missingChoice && quantity >= maxStock && maxStock <= 5 && (
                  <span className="text-xs text-gray-500">Max available</span>
                )}
              </div>
            </div>

            {/* ── Actions ────────────────────────────────────── */}
            {/*
              Hidden below md, where the fixed bar at the bottom of the screen
              carries the same two actions and is always visible. Rendering both
              would put the same pair of controls on screen twice, which is what
              this page used to do — the bar was scroll-triggered and duplicated
              these, so it needed an intersection observer, a `tabIndex` flip
              and an `aria-hidden` flip to keep the offscreen copy out of the
              tab order. One copy per breakpoint needs none of that.
            */}
            <div className="mt-6 hidden gap-2.5 md:flex">{actions}</div>

            {/* ── Combo contents ─────────────────────────────── */}
            {product.isCombo && product.comboItems?.length > 0 && (
              <div className="mt-6 rounded-card bg-pink-50 p-4 ring-1 ring-inset ring-pink-100">
                <h2 className="text-sm font-semibold text-gray-900">This combo includes</h2>
                <ul className="mt-2 space-y-1.5">
                  {product.comboItems.map((item, index) => (
                    <li key={`${item.name}-${index}`} className="flex gap-2 text-sm text-gray-700">
                      <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-pink-500" />
                      <span>
                        <span className="font-medium">{item.name}</span>
                        {item.description && <span className="text-gray-600"> — {item.description}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
                {product.comboDiscount > 0 && (
                  <p className="mt-2.5 text-sm font-semibold text-pink-700">
                    Save {product.comboDiscount}% vs buying separately.
                  </p>
                )}
              </div>
            )}

            {/* ── Reassurance ────────────────────────────────── */}
            <ul className="mt-6 grid gap-2.5 border-t border-gray-200 pt-6 sm:grid-cols-3">
              {[
                { icon: Truck, text: `Free delivery over ${formatPrice(SHIPPING.freeThreshold)}` },
                { icon: Wallet, text: "Cash on delivery" },
                { icon: BadgeCheck, text: "Quality checked" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2">
                  <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-pink-600" />
                  <span className="text-xs font-medium text-gray-700">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Detail panels ────────────────────────────────────── */}
      <div className="border-t border-gray-100 bg-white">
        <div className="page-container py-8 md:py-12">
          <Tabs tabs={tabs} panelClassName="pt-6" />
        </div>
      </div>

      {/* ── Related ──────────────────────────────────────────── */}
      <ProductShowcase
        // Same category minus this product. `key` forces a refetch when you
        // follow a related link into a different category.
        key={product._id}
        endpoint={`/products?category=${product.category}&limit=10`}
        title={`More ${label.toLowerCase()}`}
        actionLabel="View all"
        actionTo={categoryPath(product.category)}
        exclude={product._id}
        layout="rail"
        limit={8}
        className="bg-gray-50"
      />

      {/*
        ── Mobile buy bar ───────────────────────────────────────
        This is the bottom nav's replacement on this route, not a second bar
        stacked on top of it — StorefrontLayout drops the nav for /products/:id.
        So it mirrors the nav exactly: same `md:hidden` breakpoint, same
        `z-bottom-nav` layer (below the drawer and modal layers, so the cart and
        the variant window still cover it), and the same 4rem + safe-area
        height, which is what lets <main>'s existing `pb-bottom-nav` clear
        whichever of the two bars is on screen.

        Always visible, never scroll-triggered. The old bar slid in once the
        inline buttons scrolled away, which was the right call when it was a
        second control on top of the nav — but with the nav gone, a bar that
        waits for a scroll leaves the bottom of the screen empty on arrival,
        having taken the navigation away and put nothing in its place.

        Height maths: pt-2.5 (0.625rem) + h-11 button (2.75rem) + the same
        0.625rem of bottom padding = 4rem, plus the inset. The buttons are
        `size="md"` rather than "lg" deliberately — `lg` is px-6, and two of
        those plus a spinner overflow a 360px screen. Padding can't be
        overridden through `className` either: cn() has no tailwind-merge and
        Tailwind emits .px-4 before .px-6, so the size's own padding would win.
      */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-bottom-nav md:hidden",
          "border-t border-gray-200 bg-white/95 shadow-nav backdrop-blur-lg",
          "px-3 pt-2.5",
          "pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))]",
        )}
      >
        {inStock ? (
          <div className="flex items-center gap-2">
            <Button
              size="md"
              fullWidth
              onClick={() => startAction("add")}
              loading={pending === "add"}
              loadingText="Adding…"
            >
              Add to cart
            </Button>

            <Button
              variant="dark"
              size="md"
              fullWidth
              onClick={() => startAction("buy")}
              loading={pending === "buy"}
              loadingText="Wait…"
            >
              Buy now
            </Button>
          </div>
        ) : (
          /* One dead button rather than two — nothing here is actionable, so
             splitting it in half only makes the message smaller. */
          <Button size="md" fullWidth disabled>
            Out of stock
          </Button>
        )}
      </div>

      {/*
        ── Variant window ───────────────────────────────────────
        Serves both buttons, which is why its title tracks `choiceMode` rather
        than being fixed. `startAction` opens it only when a size or colour is
        still unchosen; if the customer already picked everything inline it
        never appears and the action happens straight away.

        It edits the same `selectedColor` / `selectedSize` / `quantity` state the
        inline pickers use, so confirming hands straight back to addToCart with
        the intent it was opened for — one add path and one set of variant
        rules, rather than a second checkout route that could drift from it.
      */}
      <Modal
        open={choiceMode !== null}
        onClose={() => setChoiceMode(null)}
        size="md"
        title={choiceMode === "buy" ? "Buy now" : "Add to cart"}
      >
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <p className="min-w-0 text-sm font-medium leading-snug text-gray-900">{product.name}</p>
            <div className="shrink-0">
              <Price price={product.price} originalPrice={product.originalPrice} size="md" showBadge={false} />
            </div>
          </div>

          {(requiresColor || requiresSize) && (
            <div className="space-y-4">
              {requiresColor && (
                <ColorPicker colors={colorOptions} value={selectedColor} onChange={setSelectedColor} />
              )}
              {requiresSize && <SizePicker sizes={sizeOptions} value={selectedSize} onChange={setSelectedSize} />}
            </div>
          )}

          <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
            <span className="text-sm font-medium text-gray-900">Quantity</span>
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              min={1}
              max={Math.max(1, maxStock)}
              disabled={missingChoice || !inStock}
            />
          </div>

          <StockLine missingChoice={missingChoice} inStock={inStock} maxStock={maxStock} />
        </div>

        {/*
          The one place the variant gate is allowed to bite. The triggers never
          block, so this button is what tells the customer *why* the window is
          open and stays inert until they've answered it — `addToCart` keeps its
          guards as the last line of defence, but they're unreachable from here
          because this button can't fire while `missingChoice` is true.
        */}
        <Button
          size="lg"
          fullWidth
          className="mt-5"
          onClick={() => addToCart(choiceMode)}
          disabled={missingChoice || !inStock}
          loading={pending === choiceMode}
          loadingText={choiceMode === "buy" ? "Just a moment…" : "Adding…"}
        >
          {requiresSize && !selectedSize
            ? "Select a size"
            : requiresColor && !selectedColor
              ? "Select a colour"
              : choiceMode === "buy"
                ? "Confirm and check out"
                : "Add to cart"}
        </Button>
      </Modal>
    </div>
  )
}

/* ── Sub-views ───────────────────────────────────────────── */

const StockLine = ({ missingChoice, inStock, maxStock }) => {
  if (missingChoice) {
    return <p className="text-sm text-gray-600">Choose an option to see stock.</p>
  }

  if (!inStock) {
    return (
      <p className="flex items-center gap-2 text-sm font-semibold text-red-600">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-red-500" />
        Out of stock
      </p>
    )
  }

  return (
    <p className="flex items-center gap-2 text-sm font-semibold text-green-700">
      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-green-500" />
      In stock
      {maxStock <= 5 && <span className="font-normal text-orange-600">— only {maxStock} left</span>}
    </p>
  )
}

const SPEC_LABELS = {
  material: "Material",
  weight: "Weight",
  dimensions: "Dimensions",
  color: "Colour",
}

const Specifications = ({ product }) => {
  const rows = Object.entries(product.specifications || {})
    .filter(([, value]) => value)
    .map(([key, value]) => [SPEC_LABELS[key] || key, value])

  if (product.category) rows.unshift(["Category", categoryLabel(product.category)])

  if (rows.length === 0) {
    return <p className="text-sm text-gray-500">No specifications listed.</p>
  }

  return (
    <dl className="max-w-2xl divide-y divide-gray-100 border-y border-gray-100">
      {rows.map(([key, value]) => (
        <div key={key} className="flex justify-between gap-6 py-3">
          <dt className="text-sm text-gray-600">{key}</dt>
          <dd className="text-right text-sm font-medium text-gray-900">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * What's here is only what the three-line reassurance strip above the fold
 * doesn't already say. "Free over ৳X" and "cash on delivery" both appear there
 * within a screen of this tab, so repeating them under a "Delivery" heading was
 * two statements of one fact. The rates, the 3-day window and the policy link
 * stay — none of them are said anywhere else on the page.
 */
const ShippingInfo = () => (
  <div className="max-w-2xl">
    <ul className="space-y-2 text-sm text-gray-600">
      <li>Inside Dhaka — {formatPrice(SHIPPING.insideDhaka)}, 1–2 days.</li>
      <li>Outside Dhaka — {formatPrice(SHIPPING.outsideDhaka)}, 2–4 days.</li>
      <li>Check your parcel with the rider — damaged or wrong items are replaced free.</li>
      <li>Report an issue within 3 days. Cosmetics returnable unopened only.</li>
    </ul>

    <Button to="/returns" variant="ghost-brand" size="sm" className="mt-3 -ml-3">
      Full policy
    </Button>
  </div>
)

const ProductDetailSkeleton = () => (
  <div className="bg-gray-50">
    <div className="page-container pb-6 pt-0 md:py-10">
      <div className="grid gap-6 md:gap-7 lg:grid-cols-2 lg:gap-14">
        {/* Tracks the real gallery: edge-to-edge and square-cornered below md,
            carded from there up. A rounded placeholder over a full-bleed photo
            would square itself off the moment the image landed. */}
        <div className="-mx-4 space-y-3 sm:-mx-6 md:mx-0">
          <Skeleton className="aspect-square w-full" rounded="rounded-none md:rounded-card" />
          <div className="flex gap-2 px-4 sm:px-6 md:px-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-16 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Mirrors the real buying panel: title, rating, price, variants,
            quantity, two buttons. Nothing for an eyebrow or a description
            blurb any more, so the panel doesn't shift when data lands. */}
        <div className="space-y-5">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-10 w-44 rounded-lg" />
          <div className="flex gap-2.5">
            <Skeleton className="h-12 flex-1 rounded-lg" />
            <Skeleton className="h-12 flex-1 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default ProductDetailPage
