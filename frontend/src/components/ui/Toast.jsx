import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react"
import { cn } from "../../lib/cn"

/**
 * Toast notifications — replaces the app's raw `alert()` calls.
 *
 * Usage:
 *   const toast = useToast()
 *   toast.success("Added to cart")
 *   toast.error("Could not place order", { description: err.message })
 *
 * Positioned top-centre on mobile (the bottom nav owns the bottom edge) and
 * top-right from sm up. Announced via an aria-live region.
 */

const ToastContext = createContext(null)

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-green-600",
    accent: "bg-green-500",
  },
  error: {
    icon: XCircle,
    iconClass: "text-red-600",
    accent: "bg-red-500",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-yellow-600",
    accent: "bg-yellow-500",
  },
  info: {
    icon: Info,
    iconClass: "text-pink-600",
    accent: "bg-pink-600",
  },
}

const DEFAULT_DURATION = 4000

function ToastItem({ toast, onDismiss }) {
  const { icon: Icon, iconClass, accent } = VARIANTS[toast.variant] || VARIANTS.info
  const timerRef = useRef(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || toast.duration === Infinity) return

    timerRef.current = setTimeout(() => onDismiss(toast.id), toast.duration)
    return () => clearTimeout(timerRef.current)
  }, [paused, toast.id, toast.duration, onDismiss])

  return (
    <div
      className={cn(
        "pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden",
        "rounded-card border border-gray-100 bg-white p-3.5 pr-10 shadow-card-hover",
        "animate-fade-in-up",
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1", accent)} />

      <Icon aria-hidden="true" className={cn("mt-0.5 h-5 w-5 shrink-0", iconClass)} />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-xs leading-relaxed text-gray-600">{toast.description}</p>}

        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action.onClick()
              onDismiss(toast.id)
            }}
            className="mt-2 text-xs font-semibold text-pink-600 underline-offset-2 hover:text-pink-700 hover:underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="absolute right-2 top-2 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ToastProvider({ children, max = 4 }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (variant, title, options = {}) => {
      // Guard against an object being passed where a string is expected.
      const resolvedTitle = typeof title === "string" ? title : String(title ?? "")
      const id = `toast-${counter.current++}`

      setToasts((prev) => {
        const next = [
          ...prev,
          {
            id,
            variant,
            title: resolvedTitle,
            description: options.description,
            action: options.action,
            duration: options.duration ?? DEFAULT_DURATION,
          },
        ]
        // Keep the newest `max`, so a burst of errors can't fill the screen.
        return next.slice(-max)
      })

      return id
    },
    [max],
  )

  const api = useMemo(
    () => ({
      success: (title, options) => push("success", title, options),
      error: (title, options) => push("error", title, options),
      warning: (title, options) => push("warning", title, options),
      info: (title, options) => push("info", title, options),
      dismiss,
      dismissAll: () => setToasts([]),
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}

      {typeof document !== "undefined" &&
        createPortal(
          <div
            role="region"
            aria-label="Notifications"
            className={cn(
              "pointer-events-none fixed z-toast flex flex-col gap-2",
              "inset-x-3 top-3 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-full sm:max-w-sm",
            )}
          >
            <div aria-live="polite" aria-atomic="false" className="contents">
              {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
              ))}
            </div>
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  )
}

/**
 * Returns the toast API. Falls back to a console-logging no-op if the provider
 * is missing, so a stray call can never crash a page.
 */
export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    if (import.meta.env.DEV) {
      console.warn("useToast() called outside <ToastProvider>. Falling back to console.")
    }
    return {
      success: (t) => console.log("[toast:success]", t),
      error: (t) => console.error("[toast:error]", t),
      warning: (t) => console.warn("[toast:warning]", t),
      info: (t) => console.info("[toast:info]", t),
      dismiss: () => {},
      dismissAll: () => {},
    }
  }

  return context
}

export default ToastProvider
