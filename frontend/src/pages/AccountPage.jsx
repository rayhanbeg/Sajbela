import { useCallback, useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { LogOut, MapPin, Package, Star, User } from "lucide-react"
import { Button, EmptyState, Tabs, useConfirm, useToast } from "../components/ui"
import OrdersPanel from "../components/account/OrdersPanel"
import AddressesPanel from "../components/account/AddressesPanel"
import ProfilePanel from "../components/account/ProfilePanel"
import ReviewsPanel from "../components/account/ReviewsPanel"
import ReviewForm from "../components/ReviewForm"
import { logout } from "../lib/store/authSlice"
import { fetchMyOrders } from "../lib/store/orderSlice"
import { reviewsAPI } from "../lib/api"

/**
 * Account area.
 *
 * Was an 845-line file that held four sections, two modals, its own status
 * colour map, its own size-label map and its own address markup inline. Each
 * section is now a component under components/account/, and this file does
 * three things: the header, the tabs, and the review dialog that two of the
 * tabs can open.
 *
 * The left-hand nav became tabs. On a phone the old sidebar pushed every
 * section a full screen-height down, so the page opened on a column of links
 * with the content below the fold.
 */

const SectionLabel = ({ icon: Icon, children }) => (
  <span className="inline-flex items-center gap-2">
    <Icon aria-hidden="true" className="h-4 w-4" />
    {children}
  </span>
)

const AccountPage = () => {
  const dispatch = useDispatch()
  const toast = useToast()
  const confirm = useConfirm()

  const { user, isAuthenticated } = useSelector((state) => state.auth)

  const [reviewable, setReviewable] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [reviewsError, setReviewsError] = useState("")
  const [reviewing, setReviewing] = useState(null)

  const loadReviewable = useCallback(async () => {
    setReviewsLoading(true)
    setReviewsError("")

    try {
      const response = await reviewsAPI.getReviewableProducts()
      setReviewable(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error("Error fetching reviewable products:", error)
      setReviewsError(error.response?.data?.message || "Please check your connection and try again.")
    } finally {
      setReviewsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    dispatch(fetchMyOrders())
    loadReviewable()
  }, [isAuthenticated, dispatch, loadReviewable])

  const handleLogout = async () => {
    const ok = await confirm({
      title: "Sign out?",
      message: "Your cart stays saved to your account.",
      confirmLabel: "Sign out",
      cancelLabel: "Stay signed in",
    })

    if (!ok) return

    dispatch(logout())
    toast.success("Signed out")
  }

  if (!isAuthenticated) {
    return (
      <div className="page-container py-16">
        <EmptyState
          icon={<User />}
          title="Sign in to see your account"
          description="Orders, addresses and reviews live here."
          action={
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Button to="/auth/login" size="lg">
                Sign in
              </Button>
              <Button to="/auth/register" variant="outline" size="lg">
                Create an account
              </Button>
            </div>
          }
        />
      </div>
    )
  }

  const firstName = user?.name?.trim().split(" ")[0]

  const tabs = [
    {
      id: "orders",
      label: <SectionLabel icon={Package}>Orders</SectionLabel>,
      content: <OrdersPanel reviewable={reviewable} onReview={setReviewing} />,
    },
    {
      id: "reviews",
      label: <SectionLabel icon={Star}>Reviews</SectionLabel>,
      count: reviewable.length || undefined,
      content: (
        <ReviewsPanel
          items={reviewable}
          loading={reviewsLoading}
          error={reviewsError}
          onRetry={loadReviewable}
          onReview={setReviewing}
        />
      ),
    },
    {
      id: "addresses",
      label: <SectionLabel icon={MapPin}>Addresses</SectionLabel>,
      content: <AddressesPanel />,
    },
    {
      id: "profile",
      label: <SectionLabel icon={User}>Profile</SectionLabel>,
      content: <ProfilePanel />,
    },
  ]

  return (
    <div className="bg-gray-50">
      <div className="page-container py-6 sm:py-10">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <span
              aria-hidden="true"
              className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-pink-100 text-pink-600"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="h-7 w-7" />
              )}
            </span>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                {firstName ? `Hi, ${firstName}` : "My account"}
              </h1>
              <p className="truncate text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="md"
            className="shrink-0 text-red-600 hover:bg-red-50"
            leftIcon={<LogOut className="h-4 w-4" />}
            onClick={handleLogout}
          >
            Sign out
          </Button>
        </header>

        <Tabs
          tabs={tabs}
          className="rounded-card border border-gray-200 bg-white p-4 sm:p-6"
          panelClassName="pt-5 sm:pt-6"
        />
      </div>

      {reviewing && (
        <ReviewForm
          product={reviewing.product}
          orderId={reviewing.orderId}
          onClose={() => setReviewing(null)}
          onReviewSubmitted={loadReviewable}
        />
      )}
    </div>
  )
}

export default AccountPage
