import { useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { CheckCircle2, Clock, Package, Truck } from "lucide-react"
import { Button, EmptyState, Image } from "../components/ui"
import { addressLines, orderItemCount, orderNumber, paymentLabel } from "../lib/orders"
import { formatPrice } from "../lib/utils"

/**
 * Order confirmation.
 *
 * Two things this page used to do that it no longer does:
 *
 *  - Dispatch `clearCart()` on mount. Checkout already clears the cart on the
 *    server before navigating here, so this fired a second, redundant wipe —
 *    and it meant a shopper who reloaded this page (or reached it with the
 *    back button) had their live cart emptied again.
 *  - Invent an order number from `Date.now()` when the navigation state was
 *    missing. That produced a plausible-looking reference that matched nothing
 *    in the database, which is worse than showing none at all.
 */

const STEPS = [
  { icon: CheckCircle2, title: "Order received", body: "Confirmation email on its way." },
  { icon: Package, title: "Packing", body: "Each piece checked by hand." },
  { icon: Truck, title: "On the way", body: "2–3 working days." },
]

const OrderSuccessPage = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const { orderId, orderData } = location.state || {}
  const hasOrder = Boolean(orderId || orderData)
  // Guest orders have no account to track from, so the copy and the CTA below
  // point at the confirmation email and the lookup page instead.
  const isGuest = hasOrder && !orderData?.user

  // Landing here directly (a bookmark, a refresh that dropped router state)
  // means there's nothing to show — send them home rather than leave them on a
  // confirmation page for an order we can't name.
  useEffect(() => {
    if (hasOrder) return
    const timer = setTimeout(() => navigate("/", { replace: true }), 4000)
    return () => clearTimeout(timer)
  }, [hasOrder, navigate])

  if (!hasOrder) {
    return (
      <div className="page-container py-16">
        <EmptyState
          icon={<Package />}
          title="Nothing to show here"
          description="Taking you home…"
          action={
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Button to="/products" size="lg">
                Continue shopping
              </Button>
              <Button to="/account" variant="outline" size="lg">
                My orders
              </Button>
            </div>
          }
        />
      </div>
    )
  }

  const reference = orderNumber(orderId)
  const items = orderData?.orderItems || []
  const units = orderItemCount(orderData)
  const address = orderData?.shippingAddress

  return (
    <div className="bg-gray-50">
      <div className="page-container max-w-3xl py-10 sm:py-16">
        <div className="text-center">
          <span
            aria-hidden="true"
            className="mx-auto mb-5 grid h-16 w-16 animate-scale-in place-items-center rounded-full bg-green-100 text-green-600"
          >
            <CheckCircle2 className="h-9 w-9" />
          </span>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Thank you — order placed</h1>
          <p className="mx-auto mt-2 max-w-md text-gray-600">We'll call to confirm before dispatch.</p>

          <p className="mt-5 inline-flex items-baseline gap-2 rounded-full bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-gray-200">
            <span className="text-gray-600">Order</span>
            <span className="font-semibold tracking-tight text-pink-600">{reference}</span>
          </p>
        </div>

        <ol className="mt-8 grid gap-3 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-card border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <step.icon
                  aria-hidden="true"
                  className={index === 0 ? "h-4 w-4 text-green-600" : "h-4 w-4 text-gray-400"}
                />
                <h2 className="text-sm font-semibold text-gray-900">{step.title}</h2>
              </div>
              <p className="text-sm leading-relaxed text-gray-600">{step.body}</p>
            </li>
          ))}
        </ol>

        <section className="mt-6 overflow-hidden rounded-card border border-gray-200 bg-white">
          <h2 className="border-b border-gray-100 px-4 py-3.5 text-sm font-semibold text-gray-900 sm:px-5">
            Order summary
          </h2>

          {items.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {items.map((item, index) => (
                <li key={`${item.product || item.name}-${index}`} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <Image
                    src={item.image}
                    alt=""
                    aspect="square"
                    width={120}
                    sizes="48px"
                    className="h-12 w-12 shrink-0"
                    rounded="rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">Qty {item.quantity}</p>
                  </div>
                  <p className="shrink-0 text-sm font-medium text-gray-900">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <dl className="space-y-2 border-t border-gray-100 px-4 py-4 text-sm sm:px-5">
            {units > 0 && (
              <div className="flex justify-between">
                <dt className="text-gray-600">Items</dt>
                <dd className="font-medium text-gray-900">{units}</dd>
              </div>
            )}

            {orderData?.paymentMethod && (
              <div className="flex justify-between">
                <dt className="text-gray-600">Payment</dt>
                <dd className="font-medium text-gray-900">{paymentLabel(orderData.paymentMethod)}</dd>
              </div>
            )}

            {orderData?.totalPrice !== undefined && (
              <div className="flex justify-between border-t border-gray-100 pt-2.5 text-base">
                <dt className="font-semibold text-gray-900">Total</dt>
                <dd className="font-bold text-gray-900">{formatPrice(orderData.totalPrice)}</dd>
              </div>
            )}
          </dl>

          {address && (
            <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 sm:px-5">
              <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <Truck aria-hidden="true" className="h-3.5 w-3.5" />
                Delivering to
              </h3>
              <p className="text-sm font-medium text-gray-900">{address.fullName}</p>
              <div className="text-sm leading-relaxed text-gray-600">
                {addressLines(address).map((line) => (
                  <p key={line}>{line}</p>
                ))}
                {address.phone && <p className="mt-1">{address.phone}</p>}
              </div>
            </div>
          )}
        </section>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          {isGuest ? (
            <Button to="/auth/register" size="lg" fullWidth>
              Create an account
            </Button>
          ) : (
            <Button to="/account" size="lg" fullWidth>
              Track my order
            </Button>
          )}
          <Button to="/products" variant="outline" size="lg" fullWidth>
            Continue shopping
          </Button>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-sm text-gray-500">
          <Clock aria-hidden="true" className="h-4 w-4" />
          Need a change?{" "}
          <Link to="/contact" className="font-medium text-pink-600 underline-offset-2 hover:underline">
            Contact us
          </Link>
        </p>
      </div>
    </div>
  )
}

export default OrderSuccessPage
