import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { Mail } from "lucide-react"

import { clearError, googleLogin, loginUser } from "../../lib/store/authSlice"
import { validateEmail } from "../../lib/utils"
import AuthLayout, { AuthDivider, AuthError, AuthNotice } from "../../components/auth/AuthLayout"
import GoogleSignIn from "../../components/auth/GoogleSignIn"
import PasswordField from "../../components/auth/PasswordField"
import { Button, FormField, Input } from "../../components/ui"

/**
 * Sign in.
 *
 * Changes from the old page beyond the visuals:
 *  - The "Remember me" checkbox is gone. It had no state bound to it and no
 *    effect on anything: the JWT is stored in localStorage with a 30-day
 *    expiry whether it was ticked or not. A control that does nothing is worse
 *    than no control.
 *  - Validation is per-field with a focus jump, instead of relying on the
 *    browser's `required` bubble plus one red bar at the top of the card.
 *  - `?expired=1` (set by the axios 401 interceptor) explains *why* the shopper
 *    is suddenly looking at a login form.
 */

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth)

  const [form, setForm] = useState({ email: "", password: "" })
  const [errors, setErrors] = useState({})

  const params = new URLSearchParams(location.search)
  const returnTo = params.get("returnTo")
  const expired = params.get("expired") === "1"

  useEffect(() => {
    if (!isAuthenticated) return

    // A pending "buy now" selection is replayed by the product page itself —
    // all this page has to do is land back on it.
    const target = returnTo ? decodeURIComponent(returnTo) : "/account"
    navigate(target, { replace: true })
  }, [isAuthenticated, navigate, returnTo])

  // Drop a stale "Invalid credentials" when leaving the page.
  useEffect(() => () => dispatch(clearError()), [dispatch])

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const found = {}
    if (!form.email.trim()) found.email = "Enter your email address"
    else if (!validateEmail(form.email.trim())) found.email = "That doesn't look like an email address"
    if (!form.password) found.password = "Enter your password"

    setErrors(found)

    if (Object.keys(found).length > 0) {
      document.getElementById(`login-${Object.keys(found)[0]}`)?.focus()
      return
    }

    dispatch(loginUser({ email: form.email.trim(), password: form.password }))
  }

  const registerHref = `/auth/register${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to track orders, save addresses and keep your cart in sync."
      notice={
        expired ? (
          <AuthNotice>Your session timed out. Sign in again to pick up where you left off.</AuthNotice>
        ) : returnTo ? (
          <AuthNotice>Sign in to continue with your purchase — your selection is saved.</AuthNotice>
        ) : null
      }
      footer={
        <>
          New to Sajbela?{" "}
          <Link
            to={registerHref}
            className="font-semibold text-pink-600 underline-offset-2 hover:underline focus:outline-none focus-visible:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField label="Email address" htmlFor="login-email" error={errors.email} required>
          {(field) => (
            <Input
              {...field}
              type="email"
              size="lg"
              autoComplete="email"
              inputMode="email"
              leftIcon={<Mail />}
              placeholder="you@example.com"
              value={form.email}
              onChange={update("email")}
            />
          )}
        </FormField>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
              Password
              <span className="ml-0.5 text-red-500" aria-hidden="true">
                *
              </span>
            </label>
            <Link
              to="/auth/forgot-password"
              className="text-sm font-medium text-pink-600 underline-offset-2 hover:underline focus:outline-none focus-visible:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* The label sits above so it can share a row with the reset link,
              so FormField is used here for its error slot only. */}
          <FormField htmlFor="login-password" error={errors.password}>
            {(field) => (
              <PasswordField
                {...field}
                autoComplete="current-password"
                placeholder="Your password"
                value={form.password}
                onChange={update("password")}
              />
            )}
          </FormField>
        </div>

        <AuthError>{error}</AuthError>

        <Button type="submit" size="lg" fullWidth loading={loading} loadingText="Signing in…">
          Sign in
        </Button>
      </form>

      {/* Renders nothing until VITE_GOOGLE_CLIENT_ID is configured. */}
      {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
        <div className="mt-6 space-y-4">
          <AuthDivider />
          <GoogleSignIn text="signin_with" onCredential={(credential) => dispatch(googleLogin(credential))} />
        </div>
      )}
    </AuthLayout>
  )
}

export default LoginPage
