import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { BadgeCheck, PackageX, ShoppingBag, Truck, Wallet } from "lucide-react"

import { addToCartAsync } from "../lib/store/cartSlice"
import { clearCurrentProduct, fetchProductById } from "../lib/store/productSlice"
import { categoryLabel, categoryPath, SHIPPING } from "../lib/navigation"
import { formatPrice } from "../lib/utils"
import { cn } from "../lib/cn"
import { useInView } from "../lib/hooks"
import { useStorefrontUI } from "../lib/storefrontUI"
import ProductGallery from "../components/products/ProductGallery"
import { ColorPicker, SizePicker } from "../components/products/VariantPicker"
import ProductShowcase from "../components/home/ProductShowcase"
import ReviewsList from "../components/ReviewsList"
import {
  Badge,
  Breadcrumbs,
  Button,
  EmptyState,
  ErrorState,
  Price,
  QuantityStepper,
  Rating,
  Skeleton,
  SkeletonText,
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
 *  - a sticky buy bar appears on mobile once the inline buttons scroll away
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

  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [pending, setPending] = useState(null) // "add" | "buy" | null

  // Watches the inline action row so the mobile buy bar only appears once
  // you've scrolled past it — a bar that's always there is just clutter.
  const [actionsRef, actionsInView] = useInView({ once: false, rootMargin: "0px", threshold: 0 })

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

  const missingChoice = (requiresSize && !selectedSize) || (requiresColor && !selectedColor)
  const inStock = maxStock > 0

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

  const actionLabel = missingChoice
    ? requiresSize && !selectedSize
      ? "Select a size"
      : "Select a colour"
    : !inStock
      ? "Out of stock"
      : "Add to cart"

  const actionDisabled = missingChoice || !inStock

  const actions = (
    <>
      <Button
        size="lg"
        fullWidth
        onClick={() => addToCart("add")}
        disabled={actionDisabled}
        loading={pending === "add"}
        loadingText="Adding…"
        leftIcon={<ShoppingBag className="h-5 w-5" />}
      >
        {actionLabel}
      </Button>

      <Button
        variant="dark"
        size="lg"
        fullWidth
        onClick={() => addToCart("buy")}
        disabled={actionDisabled}
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
      label: "Shipping & returns",
      content: <ShippingInfo />,
    },
    {
      id: "reviews",
      label: "Reviews",
      count: product.numReviews || 0,
      content: <ReviewsList productId={product._id} />,
    },
  ]

  return (
    <div className="bg-gray-50">
      {/* ── Breadcrumbs ──────────────────────────────────────── */}
      <div className="border-b border-gray-100 bg-white">
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

      <div className="page-container py-6 md:py-10">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10 xl:gap-14">
          {/* ── Gallery ──────────────────────────────────────── */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductGallery
              product={product}
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
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-pink-600">{label}</p>

            <h1 className="mt-1.5 text-display-sm font-bold leading-tight text-gray-900">{product.name}</h1>

            {(product.numReviews > 0 || product.rating > 0) && (
              <Rating
                value={product.rating}
                count={product.numReviews}
                size="md"
                showValue
                className="mt-2.5"
              />
            )}

            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <Price price={product.price} originalPrice={product.originalPrice} size="xl" />
              {discount && (
                <span className="text-sm font-medium text-green-700">
                  You save {formatPrice(discount.amount)}
                </span>
              )}
            </div>

            <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-gray-600">{product.description}</p>

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
            <div ref={actionsRef} className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              {actions}
            </div>

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
        eyebrow="You might also like"
        title={`More ${label.toLowerCase()}`}
        actionLabel={`Shop all ${label.toLowerCase()}`}
        actionTo={categoryPath(product.category)}
        exclude={product._id}
        layout="rail"
        limit={8}
        className="bg-gray-50"
      />

      {/* ── Mobile buy bar ───────────────────────────────────── */}
      <div
        className={cn(
          "fixed inset-x-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-nav backdrop-blur-lg",
          "transition-transform duration-300 ease-out-expo lg:hidden",
          // Parks itself directly above the bottom nav rather than over it.
          "bottom-[calc(4rem+env(safe-area-inset-bottom,0px))]",
          actionsInView ? "translate-y-[150%]" : "translate-y-0",
        )}
        // Hidden from assistive tech while off-screen — the inline buttons it
        // duplicates are the ones in view.
        aria-hidden={actionsInView}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-gray-600">{product.name}</p>
            <Price price={product.price} originalPrice={product.originalPrice} size="md" showBadge={false} />
          </div>

          <Button
            size="lg"
            onClick={() => addToCart("add")}
            disabled={actionDisabled}
            loading={pending === "add"}
            loadingText="Adding…"
            tabIndex={actionsInView ? -1 : 0}
            leftIcon={<ShoppingBag className="h-5 w-5" />}
            className="shrink-0"
          >
            {actionLabel}
          </Button>
        </div>
      </div>

      {/* Clears the buy bar so the reassurance list isn't sitting under it. */}
      <div aria-hidden="true" className="h-20 lg:hidden" />
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

const ShippingInfo = () => (
  <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
    <div>
      <h3 className="text-sm font-semibold text-gray-900">Delivery</h3>
      <ul className="mt-2 space-y-1.5 text-sm text-gray-600">
        <li>Inside Dhaka — {formatPrice(SHIPPING.insideDhaka)}, 1–2 days.</li>
        <li>Outside Dhaka — {formatPrice(SHIPPING.outsideDhaka)}, 2–4 days.</li>
        <li>Free over {formatPrice(SHIPPING.freeThreshold)}.</li>
        <li>Cash on delivery nationwide.</li>
      </ul>
    </div>

    <div>
      <h3 className="text-sm font-semibold text-gray-900">Returns</h3>
      <ul className="mt-2 space-y-1.5 text-sm text-gray-600">
        <li>Check your parcel with the rider.</li>
        <li>Damaged or wrong items replaced free.</li>
        <li>Report an issue within 3 days.</li>
        <li>Cosmetics returnable unopened only.</li>
      </ul>
      <Button to="/returns" variant="ghost-brand" size="sm" className="mt-3 -ml-3">
        Full policy
      </Button>
    </div>
  </div>
)

const ProductDetailSkeleton = () => (
  <div className="bg-gray-50">
    <div className="page-container py-6 md:py-10">
      <div className="grid gap-7 lg:grid-cols-2 lg:gap-14">
        <div className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-card" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-16 rounded-lg" />
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-40" />
          <SkeletonText lines={3} />
          <Skeleton className="h-11 w-full rounded-lg" />
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
