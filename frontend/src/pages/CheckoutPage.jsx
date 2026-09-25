import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Lock,
  Mail,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Truck,
} from "lucide-react"

import { addressesAPI, ordersAPI } from "../lib/api"
import { cn } from "../lib/cn"
import { formatPrice, validatePhone } from "../lib/utils"
import { DISTRICTS } from "../lib/districts"
import { SHIPPING } from "../lib/navigation"
import { cartTotals, readCartItem, totalItemCount, variantLabel } from "../lib/cart"
import { clearCartAsync } from "../lib/store/cartSlice"
import {
  Badge,
  Breadcrumbs,
  Button,
  Checkbox,
  EmptyState,
  FormField,
  Image,
  Input,
  RadioCard,
  Select,
  Skeleton,
  Textarea,
  useToast,
} from "../components/ui"

/**
 * Single-page checkout: delivery details, payment method, order summary.
 *
 * Structural notes on the rewrite:
 *  - The old page ran its redirects inside an effect keyed on `[isAuthenticated,
 *    items, navigate]`. `items` is a new array identity after every cart action,
 *    so placing an order cleared the cart, the effect re-fired, saw an empty
 *    cart and pushed to /products — racing the navigate to /order-success. The
 *    guards are now render-time and `placed` latches so the empty cart we just
 *    created can't bounce the shopper away from their own confirmation.
 *  - Errors went to one red bar at the top of the page; on a phone that's off
 *    screen from the button that triggered it. Field errors now sit on their
 *    fields, and the submit failure renders next to the submit button.
 *  - Delivery charge, subtotal and the free-delivery threshold come from
 *    lib/cart so this page and the cart page can't disagree.
 *  - No account required. The page used to redirect anyone signed out straight
 *    to /auth/login, which is the single most expensive thing a COD store can
 *    do to its conversion rate. Everything it needs — name, phone, address —
 *    was always collected here rather than read from the profile; the only
 *    genuinely missing piece was an email to send the confirmation to, so
 *    guests get one extra field and the order carries a `guestInfo` block.
 */

const EMPTY_FORM = { fullName: "", email: "", phone: "", address: "", district: "", thana: "" }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validate(form, { requireEmail }) {
  const errors = {}

  if (!form.fullName.trim()) errors.fullName = "Enter your name"
  if (!form.phone.trim()) errors.phone = "Enter a phone number"
  else if (!validatePhone(form.phone.replace(/\s+/g, ""))) errors.phone = "Enter a valid number"

  // Only guests are asked: a signed-in shopper's confirmation goes to the
  // address on their account.
  if (requireEmail) {
    if (!form.email.trim()) errors.email = "Enter your email"
    else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "Enter a valid email"
  }

  if (!form.address.trim()) errors.address = "Enter your address"
  if (!form.district.trim()) errors.district = "Select a district"
  if (!form.thana.trim()) errors.thana = "Enter a thana or upazila"

  return errors
}

const CheckoutPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const toast = useToast()

  const { items, loading: cartLoading, initialized } = useSelector((state) => state.cart)
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery")
  const [saveAddress, setSaveAddress] = useState(true)
  const [addressLoaded, setAddressLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  // Latches once the order is in. Without it, clearing the cart re-triggers the
  // empty-cart branch mid-navigation and the shopper lands on /products.
  const [placed, setPlaced] = useState(false)

  const lines = items || []
  const totals = cartTotals(lines, form.district)
  const count = totalItemCount(lines)

  /** Prefill from the saved default address so returning shoppers can just pay. */
  useEffect(() => {
    if (!isAuthenticated) {
      setAddressLoaded(true)
      return
    }

    let cancelled = false

    addressesAPI
      .getAll()
      .then((response) => {
        if (cancelled) return
        const saved = response.data || []
        const preferred = saved.find((entry) => entry.isDefault) || saved[0]

        setForm({
          fullName: preferred?.fullName || user?.name || "",
          email: user?.email || "",
          phone: preferred?.phone || user?.phone || "",
          address: preferred?.address || "",
          district: preferred?.district || "",
          thana: preferred?.thana || "",
        })
        // Nothing to re-save if it came from the address book.
        setSaveAddress(!preferred)
      })
      .catch((error) => {
        console.error("Could not prefill address:", error)
        if (!cancelled)
          setForm((prev) => ({
            ...prev,
            fullName: user?.name || "",
            email: user?.email || "",
            phone: user?.phone || "",
          }))
      })
      .finally(() => !cancelled && setAddressLoaded(true))

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user?.name, user?.email, user?.phone])

  const update = (field) => (event) => {
    const { value } = event.target
    setForm((prev) => ({ ...prev, [field]: value }))
    // Clear this field's error as soon as it's touched; re-validated on submit.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  const orderItems = useMemo(
    () =>
      lines.map((item) => {
        const line = readCartItem(item)
        return {
          product: line.productId,
          name: line.name,
          image: line.image,
          price: line.price,
          quantity: line.quantity,
          selectedSize: line.selectedSize,
          selectedColor: line.selectedColor,
        }
      }),
    [lines],
  )

  const handleSubmit = async (event) => {
    event.preventDefault()

    const found = validate(form, { requireEmail: !isAuthenticated })
    setErrors(found)

    if (Object.keys(found).length > 0) {
      setSubmitError("Please fix the highlighted fields.")
      // Move focus to the first problem rather than leaving the shopper to hunt.
      document.getElementById(`checkout-${Object.keys(found)[0]}`)?.focus()
      return
    }

    setSubmitting(true)
    setSubmitError("")

    try {
      const response = await ordersAPI.create({
        orderItems,
        shippingAddress: {
          fullName: form.fullName.trim(),
          address: form.address.trim(),
          district: form.district,
          thana: form.thana.trim(),
          country: "Bangladesh",
          phone: form.phone.replace(/\s+/g, ""),
        },
        // Ignored by the server when the request carries a token.
        ...(isAuthenticated
          ? {}
          : {
              guestInfo: {
                name: form.fullName.trim(),
                email: form.email.trim(),
                phone: form.phone.replace(/\s+/g, ""),
              },
            }),
        paymentMethod,
        itemsPrice: totals.subtotal,
        taxPrice: 0,
        shippingPrice: totals.shipping,
        totalPrice: totals.total,
      })

      const order = response.data
      setPlaced(true)

      // Best-effort: a failed address save must never lose a placed order.
      // Guests have no address book to save into.
      if (saveAddress && isAuthenticated) {
        addressesAPI
          .create({
            fullName: form.fullName.trim(),
            address: form.address.trim(),
            district: form.district,
            thana: form.thana.trim(),
            phone: form.phone.replace(/\s+/g, ""),
            country: "Bangladesh",
            isDefault: true,
          })
          .catch((error) => console.error("Could not save address for next time:", error))
      }

      // Empties whichever cart the shopper has — the server's, or the local
      // guest store.
      dispatch(clearCartAsync())

      navigate("/order-success", {
        replace: true,
        state: {
          // The confirmation page derives the reference from the id via
          // lib/orders, so it can't drift from what the admin table shows.
          orderId: order?._id,
          orderData: { ...order, totalPrice: totals.total, paymentMethod },
        },
      })
    } catch (error) {
      console.error("Order creation failed:", error)
      const message = error.response?.data?.message || "We couldn't place your order. Please try again."
      setSubmitError(message)
      toast.error("Order not placed", { description: message })
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Guards ───────────────────────────────────────────────── */

  if (!addressLoaded || (!initialized && cartLoading)) return <CheckoutSkeleton />

  if (lines.length === 0 && !placed) {
    return (
      <div className="bg-gray-50">
        <CheckoutHeader />
        <div className="page-container pb-16 pt-4">
          <EmptyState
            icon={<ShoppingBag />}
            title="There's nothing to check out"
            description="Your cart is empty."
            action={<Button to="/products" size="lg">Browse products</Button>}
            className="rounded-card border border-gray-100 bg-white shadow-card"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50">
      <CheckoutHeader />

      <form onSubmit={handleSubmit} noValidate className="page-container pb-8 pt-4 md:pb-14">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-8">
          {/* ── Left: details ──────────────────────────────── */}
          <div className="space-y-5 md:space-y-6">
            {/*
              Offered, not required. Signing in prefills the saved address and
              keeps the order in the shopper's history — a reason to do it,
              rather than a wall in front of the purchase.
            */}
            {!isAuthenticated && (
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-card border border-gray-100 bg-white px-5 py-3.5 shadow-card">
                <p className="text-sm font-medium text-gray-900">Checking out as a guest</p>
                <Button to="/auth/login?returnTo=%2Fcheckout" variant="outline" size="sm">
                  Sign in
                </Button>
              </div>
            )}

            <Panel icon={<MapPin />} title="Delivery details" step={1}>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Full name" required error={errors.fullName} htmlFor="checkout-fullName">
                  {(field) => (
                    <Input
                      {...field}
                      size="lg"
                      value={form.fullName}
                      onChange={update("fullName")}
                      autoComplete="name"
                      placeholder="e.g. Nusrat Jahan"
                    />
                  )}
                </FormField>

                <FormField
                  label="Phone number"
                  required
                  error={errors.phone}
                  hint="We'll call before delivery"
                  htmlFor="checkout-phone"
                >
                  {(field) => (
                    <Input
                      {...field}
                      size="lg"
                      type="tel"
                      inputMode="numeric"
                      value={form.phone}
                      onChange={update("phone")}
                      autoComplete="tel"
                      placeholder="01712345678"
                    />
                  )}
                </FormField>
              </div>

              {/*
                Guests only. It's the one thing checkout genuinely can't get
                from the form already — without it there's no way to send the
                confirmation or for them to look the order up later.
              */}
              {!isAuthenticated && (
                <FormField
                  label="Email address"
                  required
                  error={errors.email}
                  hint="For your order confirmation"
                  htmlFor="checkout-email"
                  className="mt-4"
                >
                  {(field) => (
                    <Input
                      {...field}
                      size="lg"
                      type="email"
                      value={form.email}
                      onChange={update("email")}
                      autoComplete="email"
                      placeholder="you@example.com"
                      leftIcon={<Mail />}
                    />
                  )}
                </FormField>
              )}

              <FormField
                label="Full address"
                required
                error={errors.address}
                htmlFor="checkout-address"
                className="mt-4"
              >
                {(field) => (
                  <Textarea
                    {...field}
                    rows={3}
                    value={form.address}
                    onChange={update("address")}
                    autoComplete="street-address"
                    placeholder="House / flat, road, area"
                  />
                )}
              </FormField>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField label="District" required error={errors.district} htmlFor="checkout-district">
                  {(field) => (
                    <Select
                      {...field}
                      size="lg"
                      value={form.district}
                      onChange={update("district")}
                      placeholder="Select district"
                      autoComplete="address-level1"
                    >
                      {DISTRICTS.map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </Select>
                  )}
                </FormField>

                <FormField label="Thana / upazila" required error={errors.thana} htmlFor="checkout-thana">
                  {(field) => (
                    <Input
                      {...field}
                      size="lg"
                      value={form.thana}
                      onChange={update("thana")}
                      autoComplete="address-level2"
                      placeholder="e.g. Dhanmondi"
                    />
                  )}
                </FormField>
              </div>

              {/* Delivery charge follows the district, so say so where it's chosen. */}
              <p className="mt-4 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-600">
                <Truck aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-400" />
                <span>
                  Dhaka {formatPrice(SHIPPING.insideDhaka)} &middot; outside{" "}
                  {formatPrice(SHIPPING.outsideDhaka)} &middot; free over {formatPrice(SHIPPING.freeThreshold)}
                </span>
              </p>

              {/* Checkbox spreads className onto the input, so the spacing
                  goes on a wrapper rather than the control itself. */}
              {isAuthenticated && (
                <div className="mt-4">
                  <Checkbox
                    checked={saveAddress}
                    onChange={(event) => setSaveAddress(event.target.checked)}
                    label="Save this address for next time"
                  />
                </div>
              )}
            </Panel>

            <Panel icon={<Banknote />} title="Payment" step={2}>
              <div className="space-y-3">
                <RadioCard
                  name="payment"
                  label="Cash on delivery"
                  description="Pay the courier when it arrives."
                  icon={<Banknote className="h-5 w-5" />}
                  checked={paymentMethod === "cash_on_delivery"}
                  onChange={() => setPaymentMethod("cash_on_delivery")}
                  badge={<Badge tone="success" size="sm">Available</Badge>}
                />

                <RadioCard
                  name="payment"
                  label="bKash"
                  icon={<Smartphone className="h-5 w-5" />}
                  checked={false}
                  disabled
                  badge={<Badge tone="neutral" size="sm">Coming soon</Badge>}
                />
              </div>
            </Panel>

            {/* Desktop submit lives under the form; mobile gets the sticky bar. */}
            <div className="hidden lg:block">
              <SubmitBlock
                total={totals.total}
                submitting={submitting}
                submitError={submitError}
                count={count}
              />
            </div>
          </div>

          {/* ── Right: summary ─────────────────────────────── */}
          <aside className="lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-card border border-gray-100 bg-white shadow-card">
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                  <Package aria-hidden="true" className="h-4 w-4 text-pink-600" />
                  Your order
                </h2>
                <Button to="/cart" variant="ghost" size="xs" className="text-gray-500">
                  Edit
                </Button>
              </div>

              <ul className="max-h-72 divide-y divide-gray-100 overflow-y-auto">
                {lines.map((item) => {
                  const line = readCartItem(item)
                  const variant = variantLabel(item)

                  return (
                    <li key={line.id} className="flex items-center gap-3 px-5 py-3">
                      <Image
                        src={line.image}
                        alt=""
                        aspect="square"
                        width={120}
                        sizes="48px"
                        rounded="rounded-md"
                        className="w-12 shrink-0"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium text-gray-900">{line.name}</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {variant && <>{variant} &middot; </>}Qty {line.quantity}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-semibold text-gray-900 tabular-nums">
                        {formatPrice(line.price * line.quantity)}
                      </p>
                    </li>
                  )
                })}
              </ul>

              <dl className="space-y-2.5 border-t border-gray-100 p-5 text-sm">
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

                {totals.estimated && (
                  <p className="pt-1 text-xs text-gray-500">Select a district for the exact charge.</p>
                )}
              </dl>

              <ul className="space-y-2 border-t border-gray-100 px-5 py-4 text-xs text-gray-600">
                <li className="flex items-center gap-2">
                  <ShieldCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-green-600" />
                  Pay on delivery
                </li>
                <li className="flex items-center gap-2">
                  <Lock aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-400" />
                  Details used for this delivery only
                </li>
              </ul>
            </div>
          </aside>
        </div>

        {/* ── Mobile submit bar ──────────────────────────────── */}
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-nav backdrop-blur-lg lg:hidden">
          {submitError && (
            <p role="alert" className="mb-2 flex items-start gap-1.5 text-xs font-medium text-red-600">
              <AlertCircle aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />
              {submitError}
            </p>
          )}

          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-[0.6875rem] uppercase tracking-wide text-gray-500">Total</p>
              <p className="text-lg font-bold leading-tight text-gray-900 tabular-nums">{formatPrice(totals.total)}</p>
            </div>
            <Button type="submit" size="lg" loading={submitting} className="ml-auto flex-1">
              Place order
            </Button>
          </div>
        </div>
        <div aria-hidden="true" className="h-24 lg:hidden" />
      </form>
    </div>
  )
}

/* ── Pieces ─────────────────────────────────────────────────── */

const CheckoutHeader = () => (
  <div className="border-b border-gray-100 bg-white">
    <div className="page-container py-4 md:py-5">
      <Breadcrumbs items={[{ label: "Cart", to: "/cart" }, { label: "Checkout" }]} className="mb-3" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900 md:text-2xl">Checkout</h1>

        <Button to="/cart" variant="ghost" size="sm" className="text-gray-500">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to cart
        </Button>
      </div>
    </div>
  </div>
)

/** One titled section of the form. */
const Panel = ({ icon, title, step, children }) => (
  <section className="overflow-hidden rounded-card border border-gray-100 bg-white shadow-card">
    <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-50 text-pink-600 [&_svg]:h-[1.125rem] [&_svg]:w-[1.125rem]"
      >
        {icon}
      </span>

      <h2 className="min-w-0 text-base font-semibold text-gray-900">
        {step && <span className="text-gray-400">{step}. </span>}
        {title}
      </h2>
    </div>

    <div className="p-5">{children}</div>
  </section>
)

const SubmitBlock = ({ total, submitting, submitError, count }) => (
  <div className="rounded-card border border-gray-100 bg-white p-5 shadow-card">
    {submitError && (
      <p role="alert" className="mb-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
        <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        {submitError}
      </p>
    )}

    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-sm text-gray-500">
          {count} {count === 1 ? "item" : "items"} &middot; cash on delivery
        </p>
        <p className="text-xl font-bold text-gray-900 tabular-nums">{formatPrice(total)}</p>
      </div>

      <Button type="submit" size="lg" loading={submitting} className="min-w-[12rem]">
        Place order
      </Button>
    </div>
  </div>
)

const CheckoutSkeleton = () => (
  <div className="bg-gray-50">
    <CheckoutHeader />

    <div className="page-container pb-14 pt-4">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-8">
        <div className="space-y-6">
          <Skeleton className="h-[26rem] w-full" rounded="rounded-card" />
          <Skeleton className="h-52 w-full" rounded="rounded-card" />
        </div>
        <Skeleton className="h-[30rem] w-full" rounded="rounded-card" />
      </div>
    </div>
  </div>
)

export default CheckoutPage
