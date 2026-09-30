import { Link } from "react-router-dom"
import { cn } from "../../lib/cn"
import { STORE } from "../../lib/navigation"

/**
 * Shared shell for every /auth/* page.
 *
 * The four auth pages previously each carried their own `min-h-screen ...
 * max-w-7xl ... flex items-center justify-center min-h-[80vh]` wrapper and
 * their own heading block, which is why they didn't line up: one centred on
 * 80vh, one on the full page, and the card padding differed. One shell here
 * means the wordmark, form and footer sit in exactly the same place as you move
 * between sign in, sign up and password reset — no jump.
 *
 * ── The card only exists above sm ─────────────────────────────────────────
 *
 * A card is a way of saying "this is a separate thing from the page around it".
 * On a phone there is no page around it — the form is the whole screen — so the
 * border, the shadow and the grey backdrop were drawing a box around the
 * viewport and then insetting the fields 24px from it for no reason. Below sm
 * it's now just a form on white, which is both calmer and 48px wider: on a
 * 360px screen that's the difference between a comfortable field and a cramped
 * one.
 *
 * From sm up there genuinely is a page around it, so the card comes back — a
 * hairline and a radius, no shadow. The lift was doing the same job as the
 * whitespace already surrounding it.
 *
 * The backdrop is white at every width. It used to go bg-gray-50 from sm so the
 * white card had something to sit on, but a hairline border is already an edge —
 * the grey was a second one, and it made a sign-in form look like a dialog
 * floating over an empty page. White throughout also means the card appearing at
 * sm is a change of one property, not two.
 *
 * The height budget is the shell's, not the viewport's: 4rem of sticky header
 * always, plus 4rem of mobile bottom nav below md. Centring on a plain 100vh
 * pushed the card down by half the nav and left the footer link under it.
 */

const WIDTHS = {
  sm: "max-w-sm",
  md: "max-w-md",
}

const AuthLayout = ({ title, description, notice, width = "md", children, footer }) => (
  <div
    className={cn(
      "flex flex-col justify-center bg-white px-5 py-8",
      "min-h-[calc(100dvh-8rem)] md:min-h-[calc(100dvh-4rem)]",
      "sm:px-6 sm:py-12",
    )}
  >
    <div className={cn("mx-auto w-full", WIDTHS[width] || WIDTHS.md)}>
      {/*
        One brand element, not three. This used to stack a 4xl serif wordmark
        above the card and a "← Back to store" link below it, on top of the
        form's own <h1> — so a sign-in screen opened with three competing
        headings. The wordmark is the link home now, without the back arrow
        that was restating what a logo already does.
      */}
      <div className="mb-8 text-center sm:mb-6">
        <Link
          to="/"
          className="rounded font-serif text-lg font-bold text-pink-600 transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
        >
          {STORE.name}
        </Link>
      </div>

      <div className="sm:rounded-card sm:border sm:border-gray-200 sm:bg-white sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-gray-600">{description}</p>}

        <div className="mt-6">
          {notice}
          {children}
        </div>
      </div>

      {footer && <p className="mt-6 text-center text-sm text-gray-600">{footer}</p>}
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
