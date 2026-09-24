import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Package } from "lucide-react"
import { Button, EmptyState, ErrorState, Skeleton, useConfirm, useToast } from "../ui"
import OrderCard from "./OrderCard"
import OrderDetailModal from "./OrderDetailModal"
import { cancelOrder, fetchMyOrders } from "../../lib/store/orderSlice"
import { orderNumber } from "../../lib/orders"

/**
 * Order history.
 *
 * `window.confirm` + `alert("Order cancelled successfully!")` are gone: the
 * confirm dialog is now keyboard-accessible and stays in a loading state while
 * the request is in flight, and the result arrives as a toast instead of a
 * modal the shopper has to dismiss.
 */

const OrdersSkeleton = () => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading your orders">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="rounded-card border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5 sm:px-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" rounded="rounded" />
            <Skeleton className="h-3 w-32" rounded="rounded" />
          </div>
          <Skeleton className="h-6 w-20" rounded="rounded-full" />
        </div>
        <div className="flex items-center gap-4 px-4 py-4 sm:px-5">
          <Skeleton className="h-12 w-12 sm:h-14 sm:w-14" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" rounded="rounded" />
            <Skeleton className="h-3 w-1/3" rounded="rounded" />
          </div>
          <Skeleton className="h-5 w-16" rounded="rounded" />
        </div>
        <div className="flex justify-end border-t border-gray-100 px-4 py-3 sm:px-5">
          <Skeleton className="h-9 w-32" rounded="rounded-lg" />
        </div>
      </div>
    ))}
  </div>
)

const OrdersPanel = ({ reviewable = [], onReview }) => {
  const dispatch = useDispatch()
  const toast = useToast()
  const confirm = useConfirm()

  const { orders, loading, error } = useSelector((state) => state.orders)
  const [selected, setSelected] = useState(null)

  const list = orders || []

  const handleCancel = async (order) => {
    const ok = await confirm({
      title: `Cancel order ${orderNumber(order._id)}?`,
      message: "We'll stop the order right away. You can place it again at any time.",
      confirmLabel: "Cancel order",
      cancelLabel: "Keep order",
      tone: "danger",
      onConfirm: () => dispatch(cancelOrder(order._id)).unwrap(),
    })

    if (!ok) return

    toast.success("Order cancelled")
    // The reducer patches the order in place; this re-syncs anything the
    // cancel response didn't carry back (stock, timestamps).
    dispatch(fetchMyOrders())
  }

  // Cancelling flips `loading` too — only stand in for content on first load,
  // otherwise the whole list would blink to skeletons mid-action.
  if (loading && list.length === 0) return <OrdersSkeleton />

  if (error && list.length === 0) {
    return (
      <ErrorState
        title="We couldn't load your orders"
        description={error}
        onRetry={() => dispatch(fetchMyOrders())}
      />
    )
  }

  if (list.length === 0) {
    return (
      <EmptyState
        icon={<Package />}
        title="No orders yet"
        description="When you place an order it'll show up here, with live delivery status."
        action={
          <Button to="/products" size="lg">
            Start shopping
          </Button>
        }
      />
    )
  }

  return (
    <>
      <ul className="space-y-4">
        {list.map((order) => (
          <OrderCard key={order._id} order={order} onView={setSelected} onCancel={handleCancel} />
        ))}
      </ul>

      <OrderDetailModal
        order={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        reviewable={reviewable}
        onReview={(entry) => {
          setSelected(null)
          onReview(entry)
        }}
        onCancel={handleCancel}
      />
    </>
  )
}

export default OrdersPanel
