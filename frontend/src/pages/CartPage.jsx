import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { ArrowRight, MapPin, ShieldCheck, ShoppingBag, Trash2, Truck } from "lucide-react"

import { addressesAPI } from "../lib/api"
import { cn } from "../lib/cn"
import { formatPrice } from "../lib/utils"
import { SHIPPING } from "../lib/navigation"
import { cartTotals, readCartItem, totalItemCount, variantLabel } from "../lib/cart"
import {
  clearCartAsync,
  fetchCart,
  removeFromCartAsync,
  updateCartItemAsync,
} from "../lib/store/cartSlice"
import {
  Breadcrumbs,
  Button,
  EmptyState,
  IconButton,
  Image,
  QuantityStepper,
  Skeleton,
  useConfirm,
  useToast,
} from "../components/ui"

/**
 * Full cart page.
 *
 * The old version had three `alert()`s and a `window.confirm()`, recomputed the
 * delivery rules inline with the thresholds as bare numbers, rendered raw
 * <img> tags with an onError fallback, and linked "Login" to `/login` — a route
 * that doesn't exist (it's `/auth/login`), so the one prompt shown to logged-out
 * shoppers was a dead end.
 *
 * It also had guest branches that dispatched `updateQuantity`/`removeFromCart`
 * — which are aliases for the authenticated thunks, so they threw "Please login
 * to update cart" and did nothing. Those branches are gone; the real guest cart
 * is Phase 5 and will land in the redux slice, not here.
 */

const CartPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()

  const { items, loading, initialized } = useSelector((state) => state.cart)
  const { isAuthenticated } = useSelector((state) => state.auth)

  const [address, setAddress] = useState(null)
  const [addressLoading, setAddressLoading] = useState(false)
  // Per-row busy flag, so updating one line doesn't grey out the whole list.
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) return
    dispatch(fetchCart())
  }, [dispatch, isAuthenticated])

  // The saved address only decides which delivery rate to *preview*; checkout
  // re-reads it from the form. A failure here is silent on purpose.
  useEffect(() => {
    if (!isAuthenticated) {
      setAddress(null)
      return
    }

    let cancelled = false
    setAddressLoading(true)

    addressesAPI
      .getAll()
      .then((response) => {
        if (cancelled) return
        // The flag is `isDefault` — the old page checked `isPrimary`, which the
        // Address schema has never had, so it always fell through to [0].
        const saved = response.data || []
        setAddress(saved.find((entry) => entry.isDefault) || saved[0] || null)
      })
      .catch((error) => console.error("Could not load saved address:", error))
      .finally(() => !cancelled && setAddressLoading(false))

    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  const lines = items || []
  const totals = cartTotals(lines, address?.district)
  const count = totalItemCount(lines)

  const runItemAction = async (itemId, thunk, onSuccess) => {
    setBusyId(itemId)
    try {
      await dispatch(thunk).unwrap()
      onSuccess?.()
    } catch (error) {
      toast.error("Something went wrong", { description: String(error) })
    } finally {
      setBusyId(null)
    }
  }

  const handleQuantity = (itemId, quantity) => {
    runItemAction(itemId, updateCartItemAsync({ itemId, quantity }))
  }

  const handleRemove = (itemId, name) => {
    runItemAction(itemId, removeFromCartAsync(itemId), () =>
      toast.success("Removed from cart", { description: name }),
    )
  }

  const handleClear = async () => {
    const ok = await confirm({
      title: "Empty your cart?",
      message: `This removes all ${count} ${count === 1 ? "item" : "items"}. You can always add them again.`,
      confirmLabel: "Empty cart",
      tone: "danger",
      onConfirm: () => dispatch(clearCartAsync()).unwrap(),
    })

    if (ok) toast.success("Cart emptied")
  }

  /* ── Loading ──────────────────────────────────────────────── */
  if (isAuthenticated && !initialized && loading) {
    return <CartSkeleton />
  }

  /* ── Empty ────────────────────────────────────────────────── */
  if (lines.length === 0) {
    return (
      <div className="bg-gray-50">
        <PageHeader count={0} />
        <div className="page-container pb-16 pt-4">
          {isAuthenticated ? (
            <EmptyState
              icon={<ShoppingBag />}
              title="Your cart is empty"
              description="Nothing here yet. Browse the collections and add something you love."
              action={<Button to="/products" size="lg">Start shopping</Button>}
              secondaryAction={<Button to="/" variant="ghost">Back to home</Button>}
              className="rounded-card border border-gray-100 bg-white shadow-card"
            />
          ) : (
            <EmptyState
              icon={<ShoppingBag />}
              title="Sign in to see your cart"
              description="Your cart is saved to your account, so it's waiting for you on any device."
              action={<Button to="/auth/login" size="lg">Sign in</Button>}
              secondaryAction={<Button to="/products" variant="ghost">Continue shopping</Button>}
              className="rounded-card border border-gray-100 bg-white shadow-card"
            />
          )}
        </div>
      </div>
    )
  }

  /* ── Cart ─────────────────────────────────────────────────── */
  return (
    <div className="bg-gray-50">
      <PageHeader
        count={count}
        action={
          <Button variant="ghost" size="sm" onClick={handleClear} disabled={loading} className="text-gray-500">
            <Trash2 aria-hidden="true" className="h-4 w-4" />
            Empty cart
          </Button>
        }
      />

      <div className="page-container pb-8 pt-4 md:pb-14">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_23rem]">
          {/* ── Line items ─────────────────────────────────── */}
          <div className="space-y-4">
            <FreeDeliveryMeter totals={totals} />

            <ul className="divide-y divide-gray-100 overflow-hidden rounded-card border border-gray-100 bg-white shadow-card">
              {lines.map((item) => {
                const line = readCartItem(item)
                const variant = variantLabel(item)
                const busy = busyId === line.id

                return (
                  <li key={line.id} className={cn("p-4 transition-opacity sm:p-5", busy && "opacity-60")}>
                    <div className="flex gap-4">
                      <Link
                        to={`/products/${line.productId}`}
                        className="shrink-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
                        tabIndex={-1}
                        aria-hidden="true"
                      >
                        <Image
                          src={line.image}
                          alt=""
                          aspect="square"
                          width={200}
                          sizes="96px"
                          rounded="rounded-lg"
                          className="w-20 sm:w-24"
                        />
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="text-sm font-semibold leading-snug text-gray-900 sm:text-base">
                              <Link
                                to={`/products/${line.productId}`}
                                className="transition-colors hover:text-pink-600 focus:outline-none focus-visible:underline"
                              >
                                {line.name}
                              </Link>
                            </h2>

                            {variant && <p className="mt-1 text-xs text-gray-500 sm:text-sm">{variant}</p>}

                            <p className="mt-1 text-xs text-gray-500 sm:hidden">{formatPrice(line.price)} each</p>
                          </div>

                          <IconButton
                            label={`Remove ${line.name} from cart`}
                            variant="danger"
                            size="xs"
                            disabled={busy}
                            onClick={() => handleRemove(line.id, line.name)}
                            className="-mr-1 shrink-0"
                          >
                            <Trash2 />
                          </IconButton>
                        </div>

                        <p className="mt-1 hidden text-sm text-gray-500 sm:block">{formatPrice(line.price)} each</p>

                        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                          <QuantityStepper
                            size="sm"
                            value={line.quantity}
                            min={1}
                            max={99}
                            loading={busy}
                            onChange={(quantity) => handleQuantity(line.id, quantity)}
                            label={`Quantity of ${line.name}`}
                          />

                          <p className="text-base font-bold text-gray-900 tabular-nums sm:text-lg">
                            {formatPrice(line.price * line.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="hidden lg:block">
              <Button to="/products" variant="ghost" className="text-gray-600">
                Continue shopping
              </Button>
            </div>
          </div>

          {/* ── Summary ────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-card border border-gray-100 bg-white shadow-card">
              <h2 className="border-b border-gray-100 px-5 py-4 text-base font-semibold text-gray-900">
                Order summary
              </h2>

              <div className="space-y-4 p-5">
                <DeliveryTo address={address} loading={addressLoading} authenticated={isAuthenticated} />

                <dl className="space-y-2.5 text-sm">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-gray-600">
                      Subtotal <span className="text-gray-400">({count} {count === 1 ? "item" : "items"})</span>
                    </dt>
                    <dd className="font-medium text-gray-900 tabular-nums">{formatPrice(totals.subtotal)}</dd>
                  </div>

                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-gray-600">Delivery{totals.zone ? ` (${totals.zone})` : ""}</dt>
                    <dd
                      className={cn(
                        "font-medium tabular-nums",
                        totals.shipping === 0 ? "text-green-600" : "text-gray-900",
                      )}
                    >
                      {totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)}
                    </dd>
                  </div>

                  <div className="flex items-baseline justify-between gap-4 border-t border-gray-100 pt-3">
                    <dt className="text-base font-semibold text-gray-900">Total</dt>
                    <dd className="text-xl font-bold text-gray-900 tabular-nums">{formatPrice(totals.total)}</dd>
                  </div>
                </dl>

                {totals.estimated && (
                  <p className="text-xs leading-relaxed text-gray-500">
                    Delivery is estimated at the outside-Dhaka rate. Add your address at checkout for the exact charge.
                  </p>
                )}

                <Button fullWidth size="lg" onClick={() => navigate("/checkout")}>
                  Proceed to checkout
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Button>

                <ul className="space-y-2 border-t border-gray-100 pt-4 text-xs text-gray-600">
                  <li className="flex items-center gap-2">
                    <ShieldCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-green-600" />
                    Cash on delivery available
                  </li>
                  <li className="flex items-center gap-2">
                    <Truck aria-hidden="true" className="h-4 w-4 shrink-0 text-pink-600" />
                    Free delivery over {formatPrice(SHIPPING.freeThreshold)}
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-4 text-center lg:hidden">
              <Button to="/products" variant="ghost" className="text-gray-600">
                Continue shopping
              </Button>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Mobile checkout bar ─────────────────────────────── */}
      {/* Parked above the bottom nav (h-16) rather than over it. */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-40 flex items-center gap-3 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-nav backdrop-blur-lg lg:hidden">
        <div className="min-w-0">
          <p className="text-[0.6875rem] uppercase tracking-wide text-gray-500">Total</p>
          <p className="text-lg font-bold leading-tight text-gray-900 tabular-nums">{formatPrice(totals.total)}</p>
        </div>
        <Button size="lg" className="ml-auto flex-1" onClick={() => navigate("/checkout")}>
          Checkout
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>
      <div aria-hidden="true" className="h-20 lg:hidden" />
    </div>
  )
}

/* ── Pieces ─────────────────────────────────────────────────── */

const PageHeader = ({ count, action }) => (
  <div className="border-b border-gray-100 bg-white">
    <div className="page-container py-4 md:py-5">
      <Breadcrumbs items={[{ label: "Cart" }]} className="mb-3" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
          Shopping cart
          {count > 0 && (
            <span className="ml-2 text-base font-normal text-gray-500">
              ({count} {count === 1 ? "item" : "items"})
            </span>
          )}
        </h1>
        {action}
      </div>
    </div>
  </div>
)

/** Progress towards the free-delivery threshold — mirrors the cart drawer. */
const FreeDeliveryMeter = ({ totals }) => (
  <div className="rounded-card border border-pink-100 bg-pink-50/60 px-4 py-3.5">
    {totals.hasFreeShipping ? (
      <p className="flex items-center gap-2 text-sm font-semibold text-green-700">
        <Truck aria-hidden="true" className="h-4 w-4 shrink-0" />
        You&rsquo;ve unlocked free delivery
      </p>
    ) : (
      <p className="text-sm text-gray-700">
        Add <span className="font-semibold text-pink-700">{formatPrice(totals.freeShippingRemaining)}</span> more to get
        free delivery
      </p>
    )}

    <div
      role="progressbar"
      aria-valuenow={Math.round(totals.freeShippingProgress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progress towards free delivery"
      className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-pink-100"
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out-expo",
          totals.hasFreeShipping ? "bg-green-500" : "bg-pink-600",
        )}
        style={{ width: `${totals.freeShippingProgress}%` }}
      />
    </div>
  </div>
)

const DeliveryTo = ({ address, loading, authenticated }) => {
  if (!authenticated) return null

  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-gray-50 px-3 py-2.5">
      <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />

      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium text-gray-700">Delivering to</p>

        {loading ? (
          <Skeleton className="mt-1 h-3.5 w-28" rounded="rounded" />
        ) : address ? (
          <p className="truncate text-gray-600">
            {[address.thana, address.district].filter(Boolean).join(", ")}
          </p>
        ) : (
          <Link to="/account" className="font-medium text-pink-600 underline-offset-2 hover:underline">
            Add a delivery address
          </Link>
        )}
      </div>
    </div>
  )
}

const CartSkeleton = () => (
  <div className="bg-gray-50">
    <PageHeader count={0} />

    <div className="page-container pb-14 pt-4">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="space-y-4">
          <Skeleton className="h-[4.75rem] w-full" rounded="rounded-card" />

          <div className="divide-y divide-gray-100 overflow-hidden rounded-card border border-gray-100 bg-white shadow-card">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 sm:p-5">
                <Skeleton className="h-20 w-20 shrink-0 sm:h-24 sm:w-24" />
                <div className="flex-1 space-y-2.5">
                  <Skeleton className="h-4 w-3/4" rounded="rounded" />
                  <Skeleton className="h-3 w-1/3" rounded="rounded" />
                  <div className="flex items-center justify-between pt-3">
                    <Skeleton className="h-9 w-28" />
                    <Skeleton className="h-5 w-20" rounded="rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Skeleton className="h-96 w-full" rounded="rounded-card" />
      </div>
    </div>
  </div>
)

export default CartPage
