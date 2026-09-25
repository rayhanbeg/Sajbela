import { Suspense, lazy, useEffect } from "react"
import { Route, Routes, useLocation } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"

import StorefrontLayout from "./components/layout/StorefrontLayout"
import { AdminLayout } from "./components/admin"
import ProtectedRoute from "./components/ProtectedRoute"
import { ConfirmProvider, Spinner, ToastProvider } from "./components/ui"
import { fetchUserProfile } from "./lib/store/authSlice"
import { fetchCart, mergeGuestCart } from "./lib/store/cartSlice"
import { hasGuestCart } from "./lib/guestCart"

// Storefront pages — eagerly loaded; these are the hot path.
import HomePage from "./pages/HomePage"
import ProductsPage from "./pages/ProductsPage"
import ProductDetailPage from "./pages/ProductDetailPage"
import CategoryPage from "./pages/CategoryPage"
import CartPage from "./pages/CartPage"
import CheckoutPage from "./pages/CheckoutPage"
import OrderSuccessPage from "./pages/OrderSuccessPage"
import AccountPage from "./pages/AccountPage"
import LoginPage from "./pages/auth/LoginPage"
import RegisterPage from "./pages/auth/RegisterPage"
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage"
import ResetPasswordPage from "./pages/auth/ResetPasswordPage"
import NotFoundPage from "./pages/NotFoundPage"

// Informational pages — split out, they're rarely the entry point.
const AboutPage = lazy(() => import("./pages/AboutPage"))
const ContactPage = lazy(() => import("./pages/ContactPage"))
const FAQPage = lazy(() => import("./pages/FAQPage"))
const ShippingPage = lazy(() => import("./pages/ShippingPage"))
const ReturnsPage = lazy(() => import("./pages/ReturnsPage"))
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"))
const TermsPage = lazy(() => import("./pages/TermsPage"))

// Admin — lazy-loaded so shoppers never download the admin panel.
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"))
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"))
const AdminProductForm = lazy(() => import("./pages/admin/AdminProductForm"))
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"))
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"))

/** Scrolls to the top on every route change. */
const ScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" })
  }, [pathname])

  return null
}

/** Fallback shown while a lazy chunk downloads. */
const RouteFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <Spinner size="lg" className="text-pink-600" label="Loading page" />
  </div>
)

function App() {
  const dispatch = useDispatch()
  const { token } = useSelector((state) => state.auth)

  // Re-hydrate the session from the token on every load.
  //
  // This used to be gated on `&& !isAuthenticated`, which could never be true:
  // the slice initialises `isAuthenticated` to `!!token`. So the profile was
  // never fetched, and the cached `user` from login — which omits `_id` and
  // `createdAt` — was all the app ever had.
  useEffect(() => {
    if (token) {
      dispatch(fetchUserProfile())
    }
  }, [dispatch, token])

  /*
   * Load the cart, from whichever side owns it.
   *
   * Signed in with items still sitting in the guest store means the shopper
   * built a cart and then logged in, so the lines are replayed onto the account
   * first; `mergeGuestCart` refetches the server cart when it's done. This used
   * to live in Header and only ran when authenticated, which is why a guest's
   * badge stayed at zero across a reload.
   */
  useEffect(() => {
    if (token && hasGuestCart()) dispatch(mergeGuestCart())
    else dispatch(fetchCart())
  }, [dispatch, token])

  return (
    <ToastProvider>
      <ConfirmProvider>
        <ScrollToTop />

        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<StorefrontLayout />}>
              {/* Shop */}
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/category/:slug" element={<CategoryPage />} />

              {/* Purchase flow */}
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-success" element={<OrderSuccessPage />} />

              {/* Account */}
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <AccountPage />
                  </ProtectedRoute>
                }
              />

              {/* Auth */}
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />
              <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
              {/* Landed on from the emailed link: /auth/reset-password?token=… */}
              <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

              {/* Info — these were previously commented out, leaving dead footer links. */}
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/shipping" element={<ShippingPage />} />
              <Route path="/returns" element={<ReturnsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />

              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/*
              Admin lives outside the storefront shell: its own sidebar layout,
              and one guard on the parent instead of the same check repeated on
              five pages.
            */}
            <Route
              element={
                <ProtectedRoute adminOnly>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/products/new" element={<AdminProductForm />} />
              <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>
          </Routes>
        </Suspense>
      </ConfirmProvider>
    </ToastProvider>
  )
}

export default App
