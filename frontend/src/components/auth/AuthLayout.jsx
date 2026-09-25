import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { cn } from "../../lib/cn"
import { STORE } from "../../lib/navigation"

/**
 * Shared shell for every /auth/* page.
 *
 * The four auth pages previously each carried their own `min-h-screen ...
 * max-w-7xl ... flex items-center justify-center min-h-[80vh]` wrapper and
 * their own heading block, which is why they didn't line up: one centred on
 * 80vh, one on the full page, and the card padding differed. One shell here
 * means the wordmark, card and footer sit in exactly the same place as you move
 * between sign in, sign up and password reset — no jump.
 */

const WIDTHS = {
  sm: "max-w-sm",
  md: "max-w-md",
}

const AuthLayout = ({ title, description, notice, width = "md", children, footer }) => (
  <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-gray-50 px-4 py-10 sm:py-14">
    <div className={cn("mx-auto w-full", WIDTHS[width] || WIDTHS.md)}>
      {/* Brand — also the escape hatch back to the store. */}
      <div className="mb-8 text-center">
        <Link
          to="/"
          aria-label="Sajbela home"
          className="inline-block rounded-lg font-serif text-4xl font-bold tracking-tight text-pink-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
        >
          Sajbela
        </Link>
      </div>

      <div className="rounded-card border border-gray-100 bg-white p-6 shadow-card sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
          {description && <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{description}</p>}
        </div>

        {notice}

        {children}
      </div>

      {footer && <div className="mt-6 text-center text-sm text-gray-600">{footer}</div>}

      <div className="mt-8 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900 focus:outline-none focus-visible:underline"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to store
        </Link>
      </div>
    </div>
  </div>
)

/**
 * Contextual banner shown when the shopper was sent here mid-task — e.g. they
 * hit "Buy now" while logged out. Replaces the 🛍️-emoji blue box the old pages
 * used, which read as an error to anyone skimming.
 */
export const AuthNotice = ({ children }) => (
  <div className="mb-6 rounded-lg border border-pink-100 bg-pink-50 px-4 py-3">
    <p className="text-sm text-pink-800">{children}</p>
  </div>
)

/** Submit-level failure. Sits directly above the button that caused it. */
export const AuthError = ({ children }) =>
  children ? (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
      <p className="text-sm font-medium text-red-700">{children}</p>
    </div>
  ) : null

/** "or" rule between the credential form and the social buttons. */
export const AuthDivider = ({ label = "or" }) => (
  <div className="relative py-1">
    <div aria-hidden="true" className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-200" />
    </div>
    <div className="relative flex justify-center">
      <span className="bg-white px-3 text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
    </div>
  </div>
)

export default AuthLayout
