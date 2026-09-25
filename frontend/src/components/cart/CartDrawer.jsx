import { useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { ShoppingBag, Trash2, Truck } from "lucide-react"
import { cn } from "../../lib/cn"
import { formatPrice } from "../../lib/utils"
import { productImageUrl } from "../../lib/cloudinary"
import { SHIPPING } from "../../lib/navigation"
import { removeFromCartAsync, updateCartItemAsync } from "../../lib/store/cartSlice"
import { Button, Drawer, EmptyState, IconButton, Image, QuantityStepper, Spinner, useToast } from "../ui"

/**
 * Slide-in cart.
 *
 * Reads entirely from the `cart` redux slice, so it works for guests and
 * signed-in shoppers alike — the slice resolves against localStorage or the
 * API, and this component never branches on auth.
 */
const CartDrawer = ({ open, onClose }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const toast = useToast()

  const { items, totalAmount, totalItems, loading } = useSelector((state) => state.cart)

  const subtotal = Number(totalAmount) || 0
  const amountToFreeShipping = Math.max(0, SHIPPING.freeThreshold - subtotal)
  const freeShippingProgress = Math.min(100, (subtotal / SHIPPING.freeThreshold) * 100)

  const goTo = (path) => {
    onClose?.()
    navigate(path)
  }

  const handleQuantityChange = async (item, quantity) => {
    try {
      await dispatch(updateCartItemAsync({ itemId: item._id, quantity })).unwrap()
    } catch (error) {
      toast.error("Could not update quantity", { description: String(error) })
    }
  }

  const handleRemove = async (item, name) => {
    try {
      await dispatch(removeFromCartAsync(item._id)).unwrap()
      toast.success("Removed from cart", { description: name })
    } catch (error) {
      toast.error("Could not remove item", { description: String(error) })
    }
  }

  const isEmpty = !items || items.length === 0

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title="Your cart"
      description={totalItems > 0 ? `${totalItems} ${totalItems === 1 ? "item" : "items"}` : undefined}
      bodyClassName="flex flex-col"
      footer={
        isEmpty ? null : (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="text-lg font-bold text-gray-900">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-gray-500">Delivery calculated at checkout.</p>

            <Button fullWidth size="lg" onClick={() => goTo("/checkout")}>
              Checkout
            </Button>
            <Button fullWidth variant="outline" onClick={() => goTo("/cart")}>
              View full cart
            </Button>
          </div>
        )
      }
    >
      {isEmpty ? (
        <EmptyState
          icon={<ShoppingBag />}
          title="Your cart is empty"
          description="Nothing here yet."
          action={<Button onClick={() => goTo("/products")}>Start shopping</Button>}
          className="flex-1"
        />
      ) : (
        <>
          {/* Free-shipping progress */}
          <div className="border-b border-gray-100 bg-pink-50/60 px-4 py-3">
            {amountToFreeShipping > 0 ? (
              <p className="text-xs text-gray-700">
                Add <span className="font-semibold text-pink-700">{formatPrice(amountToFreeShipping)}</span> more for
                free delivery
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-green-700">
                <Truck aria-hidden="true" className="h-3.5 w-3.5" />
                You&rsquo;ve unlocked free delivery
              </p>
            )}

            <div
              role="progressbar"
              aria-valuenow={Math.round(freeShippingProgress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progress towards free delivery"
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-pink-100"
            >
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-500 ease-out-expo",
                  amountToFreeShipping > 0 ? "bg-pink-600" : "bg-green-500",
                )}
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          <ul className="divide-y divide-gray-100">
            {items.map((item) => {
              const product = item.product || item
              const name = product.name || item.name || "Product"
              const price = product.price ?? item.price ?? 0
              const productId = product._id || item.productId

              return (
                <li key={item._id || `${productId}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-3 p-4">
                  <button
                    type="button"
                    onClick={() => productId && goTo(`/products/${productId}`)}
                    className="shrink-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                    aria-label={`View ${name}`}
                  >
                    <Image
                      src={productImageUrl(product)}
                      alt=""
                      aspect="square"
                      width={160}
                      sizes="80px"
                      rounded="rounded-lg"
                      className="w-20"
                    />
                  </button>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => productId && goTo(`/products/${productId}`)}
                        className="min-w-0 text-left"
                      >
                        <span className="line-clamp-2 text-sm font-medium text-gray-900 transition-colors hover:text-pink-600">
                          {name}
                        </span>
                      </button>

                      <IconButton
                        label={`Remove ${name} from cart`}
                        variant="danger"
                        size="xs"
                        onClick={() => handleRemove(item, name)}
                        className="-mr-1 -mt-0.5 shrink-0"
                      >
                        <Trash2 />
                      </IconButton>
                    </div>

                    {(item.selectedSize || item.selectedColor) && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        {[item.selectedColor, item.selectedSize].filter(Boolean).join(" · ")}
                      </p>
                    )}

                    <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                      <QuantityStepper
                        size="sm"
                        value={item.quantity}
                        min={1}
                        max={99}
                        disabled={loading}
                        onChange={(quantity) => handleQuantityChange(item, quantity)}
                      />
                      <span className="text-sm font-semibold text-gray-900">{formatPrice(price * item.quantity)}</span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          {loading && (
            <div className="flex justify-center py-4">
              <Spinner size="sm" className="text-pink-600" />
            </div>
          )}
        </>
      )}
    </Drawer>
  )
}

export default CartDrawer
