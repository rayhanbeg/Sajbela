import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { CheckCircle2, LinkIcon, ShieldCheck } from "lucide-react"

import { authAPI } from "../../lib/api"
import AuthLayout, { AuthError } from "../../components/auth/AuthLayout"
import PasswordField, { PasswordStrength } from "../../components/auth/PasswordField"
import { Button, FormField, Skeleton } from "../../components/ui"

/**
 * Set a new password from an emailed link: /auth/reset-password?token=…
 *
 * The token is checked against the server before the form renders. That costs
 * one request, and it buys the difference between "this link expired, here's a
 * new one" shown immediately, and the shopper carefully choosing a password,
 * typing it twice, and only then being told the link was dead the whole time.
 *
 * Four states, all reachable: verifying, invalid (expired / already used /
 * malformed / missing), form, done.
 */

const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get("token") || ""

  // "verifying" | "invalid" | "form" | "done"
  const [stage, setStage] = useState(token ? "verifying" : "invalid")
  const [invalidReason, setInvalidReason] = useState("")
  const [email, setEmail] = useState("")

  const [form, setForm] = useState({ password: "", confirmPassword: "" })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  useEffect(() => {
    if (!token) {
      setInvalidReason("This page needs a reset link.")
      return
    }

    let cancelled = false

    authAPI
      .verifyResetToken(token)
      .then((response) => {
        if (cancelled) return
        setEmail(response.data?.email || "")
        setStage("form")
      })
      .catch((error) => {
        if (cancelled) return
        setInvalidReason(
          error.response?.data?.message || "This link has expired or has already been used.",
        )
        setStage("invalid")
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const found = {}
    if (!form.password) found.password = "Choose a new password"
    else if (form.password.length < 6) found.password = "Use at least 6 characters"
    if (!form.confirmPassword) found.confirmPassword = "Re-enter your new password"
    else if (form.password !== form.confirmPassword) found.confirmPassword = "Passwords don't match"

    setErrors(found)

    const first = Object.keys(found)[0]
    if (first) {
      document.getElementById(`reset-${first}`)?.focus()
      return
    }

    setSubmitError("")
    setSubmitting(true)

    try {
      await authAPI.resetPassword({ token, password: form.password })
      setStage("done")
    } catch (error) {
      const status = error.response?.status
      const message = error.response?.data?.message

      // A 400 here means the token died between the pre-flight check and the
      // submit — send them back to the invalid state rather than showing an
      // error above a form that can no longer work.
      if (status === 400) {
        setInvalidReason(message || "This reset link is no longer valid. Request a new one.")
        setStage("invalid")
      } else {
        setSubmitError(message || "We couldn't reset your password. Please try again.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Verifying ────────────────────────────────────────────── */
  if (stage === "verifying") {
    return (
      <AuthLayout title="Checking your link">
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-4 w-1/3" rounded="rounded" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-1/3" rounded="rounded" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </AuthLayout>
    )
  }

  /* ── Invalid / expired / used ─────────────────────────────── */
  if (stage === "invalid") {
    return (
      <AuthLayout
        title="This link doesn't work"
        footer={
          <Link
            to="/auth/login"
            className="font-semibold text-pink-600 underline-offset-2 hover:underline focus:outline-none focus-visible:underline"
          >
            Back to sign in
          </Link>
        }
      >
        <div className="text-center">
          <div
            aria-hidden="true"
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600"
          >
            <LinkIcon className="h-7 w-7" />
          </div>

          <p role="alert" className="text-sm leading-relaxed text-gray-600">
            {invalidReason}
          </p>

          <Button to="/auth/forgot-password" size="lg" fullWidth className="mt-6">
            Request a new link
          </Button>
        </div>
      </AuthLayout>
    )
  }

  /* ── Done ─────────────────────────────────────────────────── */
  if (stage === "done") {
    return (
      <AuthLayout title="Password updated" description="You can now sign in with your new password.">
        <div className="text-center">
          <div
            aria-hidden="true"
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600"
          >
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <p className="text-sm text-gray-600">We&rsquo;ve emailed you a confirmation.</p>

          <Button size="lg" fullWidth className="mt-6" onClick={() => navigate("/auth/login", { replace: true })}>
            Go to sign in
          </Button>
        </div>
      </AuthLayout>
    )
  }

  /* ── Form ─────────────────────────────────────────────────── */
  return (
    <AuthLayout
      title="Set a new password"
      description={email || undefined}
      footer={
        <Link
          to="/auth/login"
          className="font-semibold text-pink-600 underline-offset-2 hover:underline focus:outline-none focus-visible:underline"
        >
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField label="New password" htmlFor="reset-password" error={errors.password} required>
          {(field) => (
            <>
              <PasswordField
                {...field}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                autoFocus
                value={form.password}
                onChange={update("password")}
              />
              <PasswordStrength value={form.password} />
            </>
          )}
        </FormField>

        <FormField label="Confirm new password" htmlFor="reset-confirmPassword" error={errors.confirmPassword} required>
          {(field) => (
            <PasswordField
              {...field}
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              value={form.confirmPassword}
              onChange={update("confirmPassword")}
            />
          )}
        </FormField>

        <AuthError>{submitError}</AuthError>

        <Button type="submit" size="lg" fullWidth loading={submitting} loadingText="Updating…">
          Update password
        </Button>

        <p className="flex items-center gap-2 text-xs text-gray-500">
          <ShieldCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-400" />
          This link stops working once your password is updated.
        </p>
      </form>
    </AuthLayout>
  )
}

export default ResetPasswordPage
