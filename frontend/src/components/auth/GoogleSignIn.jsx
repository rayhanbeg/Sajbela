import { useEffect, useRef, useState } from "react"

/**
 * Google Sign-In button, rendered by Google Identity Services.
 *
 * GIS is loaded from a <script> on demand rather than through an npm wrapper:
 * it keeps the vendor bundle unchanged, and Google requires their own iframe to
 * render the button anyway, so a React wrapper buys nothing here.
 *
 * If `VITE_GOOGLE_CLIENT_ID` isn't set this component renders NOTHING. That's
 * deliberate — a sign-in button that can't sign anyone in is worse than no
 * button, and it means the auth pages are safe to ship before the client ID
 * lands in .env.
 *
 * The parent gets the Google ID token (a JWT) via `onCredential`; verifying it
 * is the backend's job (POST /auth/google).
 */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const GSI_SRC = "https://accounts.google.com/gsi/client"

/** Module-level so two auth pages in one session share a single script load. */
let scriptPromise = null

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve()

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script")
      script.src = GSI_SRC
      script.async = true
      script.defer = true
      script.onload = resolve
      script.onerror = () => {
        // Clear the cache so a later mount can retry (flaky network, blocked
        // by an extension, offline first paint).
        scriptPromise = null
        reject(new Error("Google sign-in script failed to load"))
      }
      document.head.appendChild(script)
    })
  }

  return scriptPromise
}

/** GIS only accepts a pixel width, and only within 200–400. */
const clampWidth = (px) => Math.min(400, Math.max(200, Math.round(px || 320)))

const GoogleSignIn = ({ text = "signin_with", onCredential }) => {
  const holder = useRef(null)
  const [failed, setFailed] = useState(false)

  // Held in a ref so a new inline callback on every render doesn't re-render
  // Google's button (which would flash and lose its iframe).
  const handler = useRef(onCredential)
  handler.current = onCredential

  useEffect(() => {
    if (!CLIENT_ID) return undefined

    let cancelled = false

    loadGoogleScript()
      .then(() => {
        if (cancelled || !holder.current) return

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => handler.current?.(response?.credential),
          // Popup keeps us on the page, so redux state and any `returnTo`
          // query param survive the round trip.
          ux_mode: "popup",
        })

        window.google.accounts.id.renderButton(holder.current, {
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text,
          logo_alignment: "center",
          width: clampWidth(holder.current.offsetWidth),
        })
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [text])

  if (!CLIENT_ID) return null

  if (failed) {
    return (
      <p className="text-center text-xs text-gray-500">
        Google sign-in is unavailable right now. Use your email and password instead.
      </p>
    )
  }

  // min-h matches GIS's large button so the form doesn't shift when it mounts.
  return <div ref={holder} className="flex min-h-[2.5rem] justify-center" />
}

export default GoogleSignIn
