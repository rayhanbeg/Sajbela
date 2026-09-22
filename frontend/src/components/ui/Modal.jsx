import { createPortal } from "react-dom"
import { useCallback, useId } from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/cn"
import { useEscapeKey, useFocusTrap, useScrollLock } from "../../lib/hooks"
import IconButton from "./IconButton"

/**
 * Accessible modal dialog.
 *
 * Portals to <body>, traps focus, locks scroll, closes on Escape and backdrop
 * click, and restores focus to the trigger on close.
 */

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  "2xl": "max-w-4xl",
}

const Modal = ({
  open,
  onClose,
  title,
  description,
  size = "md",
  hideCloseButton = false,
  closeOnBackdrop = true,
  footer,
  className,
  children,
}) => {
  const titleId = useId()
  const descriptionId = useId()

  const handleClose = useCallback(() => onClose?.(), [onClose])

  useScrollLock(open)
  useEscapeKey(open, handleClose)
  const trapRef = useFocusTrap(open)

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-end justify-center p-0 sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-fade-in bg-gray-900/50 backdrop-blur-[2px]"
        onClick={closeOnBackdrop ? handleClose : undefined}
        aria-hidden="true"
      />

      {/* Panel — full-width sheet on mobile, centred card from sm up. */}
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "relative flex max-h-[90vh] w-full flex-col overflow-hidden bg-white shadow-drawer",
          "animate-slide-up rounded-t-sheet sm:animate-scale-in sm:rounded-sheet",
          SIZES[size] || SIZES.md,
          className,
        )}
      >
        {/* Drag affordance on mobile */}
        <div aria-hidden="true" className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-gray-300 sm:hidden" />

        {(title || !hideCloseButton) && (
          <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-4 pt-4 sm:px-6 sm:pt-5">
            <div className="min-w-0">
              {title && (
                <h2 id={titleId} className="text-lg font-semibold text-gray-900">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descriptionId} className="mt-1 text-sm text-gray-600">
                  {description}
                </p>
              )}
            </div>

            {!hideCloseButton && (
              <IconButton label="Close dialog" onClick={handleClose} size="sm" className="-mr-1 -mt-1 shrink-0">
                <X />
              </IconButton>
            )}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">{children}</div>

        {footer && (
          <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-5 py-4 pb-safe sm:px-6">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  )
}

export default Modal
