import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { Mail, Phone, User } from "lucide-react"

import { clearError, googleLogin, registerUser } from "../../lib/store/authSlice"
import { validateEmail, validatePhone } from "../../lib/utils"
import AuthLayout, { AuthDivider, AuthError, AuthNotice } from "../../components/auth/AuthLayout"
import GoogleSignIn from "../../components/auth/GoogleSignIn"
import PasswordField, { PasswordStrength } from "../../components/auth/PasswordField"
import { Button, FormField, Input } from "../../components/ui"

/**
 * Create an account.
 *
 * The old form funnelled every problem — bad phone, mismatched passwords,
 * short password, server error — through a single `validationError` string in
 * one box, so you could only ever be told about one thing at a time and never
 * which field it belonged to. Errors are per-field now, and the phone field
 * keeps its live check (it's the one people get wrong).
 *
 * Phone is marked required because the User model requires it — the old form
 * labelled it optional and then let the request fail on the way in.
 *
 * Two controls were dropped to get this down to four fields:
 *  - "Confirm password". PasswordField has a show/hide toggle, so a typo is
 *    already recoverable by looking; a second identical field mostly produced
 *    a "Passwords don't match" error on a password that was fine.
 *  - The terms checkbox. Consent is now a sentence under the submit button,
 *    which is where Google, Shopify and Stripe put it. Same agreement, one
 *    less required interaction and one less error state in the form.
 */

const EMPTY = { name: "", email: "", phone: "", password: "" }

function validate(form) {
  const errors = {}

  if (!form.name.trim()) errors.name = "Enter your name"
  else if (form.name.trim().length < 2) errors.name = "Name is too short"

  if (!form.email.trim()) errors.email = "Enter your email"
  else if (!validateEmail(form.email.trim())) errors.email = "Enter a valid email"

  if (!form.phone.trim()) errors.phone = "Enter your phone number"
  else if (!validatePhone(form.phone)) errors.phone = "11 digits, starting 01"

  if (!form.password) errors.password = "Choose a password"
  else if (form.password.length < 6) errors.password = "Use at least 6 characters"

  return errors
}

const RegisterPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth)

  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  const returnTo = new URLSearchParams(location.search).get("returnTo")

  useEffect(() => {
    if (!isAuthenticated) return
    navigate(returnTo ? decodeURIComponent(returnTo) : "/account", { replace: true })
  }, [isAuthenticated, navigate, returnTo])

  useEffect(() => () => dispatch(clearError()), [dispatch])

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  /** Digits only, capped at 11 — matches the 01XXXXXXXXX format exactly. */
  const updatePhone = (event) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 11)
    setForm((prev) => ({ ...prev, phone: digits }))

    // Live feedback once the number is long enough to judge, so they don't
    // discover it's wrong only after filling in the whole form.
    setErrors((prev) => ({
      ...prev,
      phone: digits.length === 11 && !validatePhone(digits) ? "Enter a valid Bangladeshi number" : undefined,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const found = validate(form)
    setErrors(found)

    const first = Object.keys(found)[0]
    if (first) {
      document.getElementById(`register-${first}`)?.focus()
      return
    }

    dispatch(
      registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone,
        password: form.password,
      }),
    )
  }

  const loginHref = `/auth/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`

  return (
    <AuthLayout
      title="Create account"
      notice={returnTo ? <AuthNotice>Create an account to continue.</AuthNotice> : null}
      footer={
        <>
          Already have an account?{" "}
          <Link
            to={loginHref}
            className="font-semibold text-pink-600 underline-offset-2 hover:underline focus:outline-none focus-visible:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField label="Name" htmlFor="register-name" error={errors.name} required>
          {(field) => (
            <Input
              {...field}
              size="lg"
              autoComplete="name"
              leftIcon={<User />}
              value={form.name}
              onChange={update("name")}
            />
          )}
        </FormField>

        <FormField label="Email" htmlFor="register-email" error={errors.email} required>
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

        <FormField label="Phone" htmlFor="register-phone" error={errors.phone} hint="For delivery updates" required>
          {(field) => (
            <Input
              {...field}
              type="tel"
              size="lg"
              autoComplete="tel"
              inputMode="numeric"
              maxLength={11}
              leftIcon={<Phone />}
              placeholder="01XXXXXXXXX"
              value={form.phone}
              onChange={updatePhone}
            />
          )}
        </FormField>

        <FormField label="Password" htmlFor="register-password" error={errors.password} required>
          {(field) => (
            <>
              <PasswordField
                {...field}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={update("password")}
              />
              <PasswordStrength value={form.password} />
            </>
          )}
        </FormField>

        <AuthError>{error}</AuthError>

        <div className="space-y-3">
          <Button type="submit" size="lg" fullWidth loading={loading} loadingText="Creating account…">
            Create account
          </Button>

          <p className="text-center text-xs leading-relaxed text-gray-500">
            By creating an account you agree to our{" "}
            <Link to="/terms" className="text-pink-600 underline-offset-2 hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-pink-600 underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </form>

      {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
        <div className="mt-5 space-y-4">
          <AuthDivider />
          <GoogleSignIn text="signup_with" onCredential={(credential) => dispatch(googleLogin(credential))} />
        </div>
      )}
    </AuthLayout>
  )
}

export default RegisterPage
