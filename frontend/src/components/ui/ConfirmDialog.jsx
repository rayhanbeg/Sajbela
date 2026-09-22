import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import { AlertTriangle, Trash2 } from "lucide-react"
import { cn } from "../../lib/cn"
import Modal from "./Modal"
import Button from "./Button"

/**
 * Promise-based confirmation dialog — replaces `window.confirm()`.
 *
 * Usage:
 *   const confirm = useConfirm()
 *   const ok = await confirm({
 *     title: "Delete product?",
 *     message: "This cannot be undone.",
 *     tone: "danger",
 *     confirmLabel: "Delete",
 *   })
 *   if (!ok) return
 *
 * Unlike window.confirm it doesn't block the main thread, it's styled, and
 * it's keyboard-accessible.
 */

const ConfirmContext = createContext(null)

const TONES = {
  danger: {
    icon: Trash2,
    iconWrap: "bg-red-50 text-red-600",
    confirmVariant: "danger",
  },
  warning: {
    icon: AlertTriangle,
    iconWrap: "bg-yellow-50 text-yellow-600",
    confirmVariant: "primary",
  },
  brand: {
    icon: AlertTriangle,
    iconWrap: "bg-pink-50 text-pink-600",
    confirmVariant: "primary",
  },
}

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)
  const [pending, setPending] = useState(false)
  const resolver = useRef(null)

  const confirm = useCallback((options = {}) => {
    setState({
      title: options.title || "Are you sure?",
      message: options.message || "",
      confirmLabel: options.confirmLabel || "Confirm",
      cancelLabel: options.cancelLabel || "Cancel",
      tone: options.tone || "brand",
      // When provided, we await it and keep the dialog in a loading state,
      // so the caller's async work is visible instead of the UI going dead.
      onConfirm: options.onConfirm,
    })
    return new Promise((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const settle = useCallback((result) => {
    resolver.current?.(result)
    resolver.current = null
    setState(null)
    setPending(false)
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!state?.onConfirm) {
      settle(true)
      return
    }

    setPending(true)
    try {
      await state.onConfirm()
      settle(true)
    } catch {
      // Let the caller surface the error via toast; just release the dialog.
      settle(false)
    }
  }, [state, settle])

  const api = useMemo(() => ({ confirm }), [confirm])

  const tone = TONES[state?.tone] || TONES.brand
  const ToneIcon = tone.icon

  return (
    <ConfirmContext.Provider value={api}>
      {children}

      <Modal
        open={Boolean(state)}
        onClose={() => !pending && settle(false)}
        size="sm"
        hideCloseButton
        closeOnBackdrop={!pending}
      >
        <div className="pt-1 text-center sm:pt-3">
          <span
            aria-hidden="true"
            className={cn("mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full", tone.iconWrap)}
          >
            <ToneIcon className="h-6 w-6" />
          </span>

          <h2 className="text-lg font-semibold text-gray-900">{state?.title}</h2>
          {state?.message && <p className="mt-2 text-sm leading-relaxed text-gray-600">{state.message}</p>}

          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row">
            <Button variant="outline" fullWidth disabled={pending} onClick={() => settle(false)}>
              {state?.cancelLabel}
            </Button>
            <Button variant={tone.confirmVariant} fullWidth loading={pending} onClick={handleConfirm}>
              {state?.confirmLabel}
            </Button>
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  )
}

/** Returns `confirm(options) => Promise<boolean>`. */
export function useConfirm() {
  const context = useContext(ConfirmContext)

  if (!context) {
    if (import.meta.env.DEV) {
      console.warn("useConfirm() called outside <ConfirmProvider>. Falling back to window.confirm.")
    }
    return (options = {}) => Promise.resolve(window.confirm(options.message || options.title || "Are you sure?"))
  }

  return context.confirm
}

export default ConfirmProvider
