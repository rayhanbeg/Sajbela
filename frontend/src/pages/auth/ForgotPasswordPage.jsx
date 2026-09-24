import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Mail, MailCheck } from "lucide-react"

import { authAPI } from "../../lib/api"
import { validateEmail } from "../../lib/utils"
import AuthLayout, { AuthError } from "../../components/auth/AuthLayout"
import { Button, FormField, Input } from "../../components/ui"

/**
 * Request a password reset link.
 *
 * This replaces a two-step 6-digit verification-code flow that asked the
 * shopper to copy a code out of their inbox and type it back alongside a new
 * password, all on one page. A link is fewer steps, can't be mistyped, and
 * doesn't leave a short-lived shared secret sitting in an email thread that
 * also works for anyone reading over a shoulder.
 *
 * The page never reveals whether an email is registered — the backend answers
 * the same way either way, and so does this UI. The old version rendered the
 * API's literal "User not found with this email address", which turned the
 * reset form into an account-existence oracle.
 */

const RESEND_SECONDS = 45

/** "nu***@gmail.com" — enough to confirm which inbox, not enough to leak one. */
function maskEmail(email = "") {
  const [name, domain] = email.split("@")
  if (!domain) return email
  const head = name.slice(0, 2)
  return `${head}${"*".repeat(Math.max(3, name.length - 2))}@${domain}`
}

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("")
  const [fieldError, setFieldError] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const timer = useRef(null)

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current)
    },
    [],
  )

  const startCooldown = () => {
    setCooldown(RESEND_SECONDS)
    if (timer.current) clearInterval(timer.current)
    timer.current = setInterval(() => {
      setCooldown((seconds) => {
        if (seconds <= 1) {
          clearInterval(timer.current)
          timer.current = null
          return 0
        }
        return seconds - 1
      })
    }, 1000)
  }

  const send = async (address) => {
    setSubmitError("")
    setLoading(true)

    try {
      await authAPI.forgotPassword(address)
      setSent(true)
      startCooldown()
    } catch (error) {
      // Only genuine transport/server failures land here now.
      setSubmitError(error.response?.data?.message || "We couldn't send the email. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const address = email.trim()
    if (!address) {
      setFieldError("Enter the email address on your account")
      document.getElementById("forgot-email")?.focus()
      return
    }
    if (!validateEmail(address)) {
      setFieldError("That doesn't look like an email address")
      document.getElementById("forgot-email")?.focus()
      return
    }

    setFieldError("")
    send(address)
  }

  /* ── Sent ─────────────────────────────────────────────────── */
  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        description={`If an account exists for ${maskEmail(email.trim())}, a reset link is on its way.`}
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
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600"
          >
            <MailCheck className="h-7 w-7" />
          </div>

          <ol className="mx-auto max-w-xs space-y-2.5 text-left text-sm text-gray-600">
            <li className="flex gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[0.6875rem] font-semibold text-gray-600">
                1
              </span>
              Open the email from Sajbela.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[0.6875rem] font-semibold text-gray-600">
                2
              </span>
              Tap <span className="font-medium text-gray-900">Reset password</span> — the link works once and expires
              in 30 minutes.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[0.6875rem] font-semibold text-gray-600">
                3
              </span>
              Choose a new password and sign in.
            </li>
          </ol>

          <p className="mt-6 text-xs leading-relaxed text-gray-500">
            Nothing yet? Check your spam or promotions folder — it can take a minute to arrive.
          </p>

          <div className="mt-5 space-y-2.5">
            <AuthError>{submitError}</AuthError>

            <Button
              variant="secondary"
              size="lg"
              fullWidth
              loading={loading}
              loadingText="Sending…"
              disabled={cooldown > 0}
              onClick={() => send(email.trim())}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
            </Button>

            <Button
              variant="ghost"
              fullWidth
              className="text-gray-600"
              onClick={() => {
                setSent(false)
                setSubmitError("")
              }}
            >
              Use a different email
            </Button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  /* ── Request ──────────────────────────────────────────────── */
  return (
    <AuthLayout
      title="Forgot your password?"
      description="Enter the email on your account and we'll send you a link to set a new one."
      footer={
        <>
          Remembered it?{" "}
          <Link
            to="/auth/login"
            className="font-semibold text-pink-600 underline-offset-2 hover:underline focus:outline-none focus-visible:underline"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField label="Email address" htmlFor="forgot-email" error={fieldError} required>
          {(field) => (
            <Input
              {...field}
              type="email"
              size="lg"
              autoComplete="email"
              inputMode="email"
              autoFocus
              leftIcon={<Mail />}
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (fieldError) setFieldError("")
              }}
            />
          )}
        </FormField>

        <AuthError>{submitError}</AuthError>

        <Button type="submit" size="lg" fullWidth loading={loading} loadingText="Sending link…">
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  )
}

export default ForgotPasswordPage
