import { useSelector } from "react-redux"
import { Navigate, useLocation } from "react-router-dom"
import { Spinner } from "./ui"

/**
 * Route guard.
 *
 * Two details that used to bite:
 *
 * 1. A signed-out visitor sent to /auth/login lost where they were going. The
 *    intended path rides along as `?returnTo=`, which is the same parameter the
 *    login page already reads, so it sends them back afterwards.
 * 2. `isAuthenticated` is `!!token`, but `user` is a separate localStorage
 *    entry. Clear the `user` key and keep the token — which is also the state
 *    during the very first profile fetch on a cold load — and `adminOnly`
 *    redirected a real admin to the homepage. It waits for the profile now.
 */
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const location = useLocation()
  const { isAuthenticated, user, token } = useSelector((state) => state.auth)

  if (!isAuthenticated) {
    const returnTo = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/auth/login?returnTo=${returnTo}`} replace />
  }

  if (token && !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" className="text-pink-600" label="Checking your account" />
      </div>
    )
  }

  if (adminOnly && user?.role !== "admin") {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
