import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { Mail, Phone, User } from "lucide-react"

import { clearError, googleLogin, registerUser } from "../../lib/store/authSlice"
import { validateEmail, validatePhone } from "../../lib/utils"
import AuthLayout, { AuthDivider, AuthError, AuthNotice } from "../../components/auth/AuthLayout"
import GoogleSignIn from "../../components/auth/GoogleSignIn"
import PasswordField, { PasswordStrength } from "../../components/auth/PasswordField"
import { Button, Checkbox, FormField, Input } from "../../components/ui"

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
 */

const EMPTY = { name: "", email: "", phone: "", password: "", confirmPassword: "" }

function validate(form, agreed) {
  const errors = {}

  if (!form.name.trim()) errors.name = "Enter your name"
  else if (form.name.trim().length < 2) errors.name = "That name looks too short"

  if (!form.email.trim()) errors.email = "Enter your email address"
  else if (!validateEmail(form.email.trim())) errors.email = "That doesn't look like an email address"

  if (!form.phone.trim()) errors.phone = "Enter your phone number"
  else if (!validatePhone(form.phone)) errors.phone = "Enter an 11-digit number starting with 01"

  if (!form.password) errors.password = "Choose a password"
  else if (form.password.length < 6) errors.password = "Use at least 6 characters"

  if (!form.confirmPassword) errors.confirmPassword = "Re-enter your password"
  else if (form.password !== form.confirmPassword) errors.confirmPassword = "Passwords don't match"

  if (!agreed) errors.terms = "Please accept the terms to continue"

  return errors
}

const RegisterPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth)

  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [agreed, setAgreed] = useState(false)

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

    const found = validate(form, agreed)
    setErrors(found)

    const first = Object.keys(found)[0]
    if (first) {
      document.getElementById(first === "terms" ? "register-terms" : `register-${first}`)?.focus()
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
      title="Create your account"
      description="One account for orders, saved addresses and faster checkout."
      notice={returnTo ? <AuthNotice>Create an account to finish your purchase.</AuthNotice> : null}
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
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField label="Full name" htmlFor="register-name" error={errors.name} required>
          {(field) => (
            <Input
              {...field}
              size="lg"
              autoComplete="name"
              leftIcon={<User />}
              placeholder="e.g. Nusrat Jahan"
              value={form.name}
              onChange={update("name")}
            />
          )}
        </FormField>

        <FormField label="Email address" htmlFor="register-email" error={errors.email} required>
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

        <FormField
          label="Phone number"
          htmlFor="register-phone"
          error={errors.phone}
          hint="We only use this for delivery updates."
          required
        >
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

        <FormField label="Confirm password" htmlFor="register-confirmPassword" error={errors.confirmPassword} required>
          {(field) => (
            <PasswordField
              {...field}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={update("confirmPassword")}
            />
          )}
        </FormField>

        <div>
          <Checkbox
            id="register-terms"
            checked={agreed}
            onChange={(event) => {
              setAgreed(event.target.checked)
              setErrors((prev) => ({ ...prev, terms: undefined }))
            }}
            label={
              <>
                I agree to the{" "}
                <Link to="/terms" className="font-medium text-pink-600 underline-offset-2 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="font-medium text-pink-600 underline-offset-2 hover:underline">
                  Privacy Policy
                </Link>
              </>
            }
          />
          {errors.terms && (
            <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
              {errors.terms}
            </p>
          )}
        </div>

        <AuthError>{error}</AuthError>

        <Button type="submit" size="lg" fullWidth loading={loading} loadingText="Creating account…">
          Create account
        </Button>
      </form>

      {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
        <div className="mt-6 space-y-4">
          <AuthDivider />
          <GoogleSignIn text="signup_with" onCredential={(credential) => dispatch(googleLogin(credential))} />
        </div>
      )}
    </AuthLayout>
  )
}

export default RegisterPage
