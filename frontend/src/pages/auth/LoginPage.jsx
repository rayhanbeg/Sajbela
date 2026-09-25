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
    if (!form.email.trim()) found.email = "Enter your email"
    else if (!validateEmail(form.email.trim())) found.email = "Enter a valid email"
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
      title="Sign in"
      notice={
        expired ? (
          <AuthNotice>Your session timed out.</AuthNotice>
        ) : returnTo ? (
          <AuthNotice>Sign in to continue.</AuthNotice>
        ) : null
      }
      footer={
        <>
          No account?{" "}
          <Link
            to={registerHref}
            className="font-semibold text-pink-600 underline-offset-2 hover:underline focus:outline-none focus-visible:underline"
          >
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField label="Email" htmlFor="login-email" error={errors.email} required>
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

        {/*
          "Forgot password?" sits under the field rather than sharing a row
          with the label. Sharing the row meant hand-rolling the label —
          including its own required asterisk — so this field was the one
          place on the site where the label markup didn't come from FormField.
        */}
        <div>
          <FormField label="Password" htmlFor="login-password" error={errors.password} required>
            {(field) => (
              <PasswordField
                {...field}
                autoComplete="current-password"
                value={form.password}
                onChange={update("password")}
              />
            )}
          </FormField>

          <div className="mt-1.5 text-right">
            <Link
              to="/auth/forgot-password"
              className="text-sm text-pink-600 underline-offset-2 hover:underline focus:outline-none focus-visible:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <AuthError>{error}</AuthError>

        <Button type="submit" size="lg" fullWidth loading={loading} loadingText="Signing in…">
          Sign in
        </Button>
      </form>

      {/* Renders nothing until VITE_GOOGLE_CLIENT_ID is configured. */}
      {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
        <div className="mt-5 space-y-4">
          <AuthDivider />
          <GoogleSignIn text="signin_with" onCredential={(credential) => dispatch(googleLogin(credential))} />
        </div>
      )}
    </AuthLayout>
  )
}

export default LoginPage
