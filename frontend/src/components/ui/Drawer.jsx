import { createPortal } from "react-dom"
import { useCallback, useId } from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/cn"
import { useEscapeKey, useFocusTrap, useScrollLock } from "../../lib/hooks"
import IconButton from "./IconButton"

/**
 * Slide-in panel. Powers the cart drawer, the mobile menu, the mobile filter
 * sheet and the admin sidebar drawer.
 *
 * `side`:
 *   "right" / "left" — full-height side panel (menus, cart)
 *   "bottom"         — bottom sheet, the right pattern for mobile filters
 */

const SIDE_CLASSES = {
  right: "inset-y-0 right-0 h-full w-full max-w-sm animate-slide-in-right",
  left: "inset-y-0 left-0 h-full w-full max-w-sm animate-slide-in-left",
  bottom: "inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-sheet animate-slide-up",
}

const Drawer = ({
  open,
  onClose,
  side = "right",
  title,
  description,
  hideCloseButton = false,
  closeOnBackdrop = true,
  header,
  footer,
  className,
  panelClassName,
  bodyClassName,
  children,
}) => {
  const titleId = useId()
  const descriptionId = useId()

  const handleClose = useCallback(() => onClose?.(), [onClose])

  useScrollLock(open)
  useEscapeKey(open, handleClose)
  const trapRef = useFocusTrap(open)

  if (!open) return null

  const isBottom = side === "bottom"

  return createPortal(
    <div className={cn("fixed inset-0 z-drawer", className)}>
      <div
        className="absolute inset-0 animate-fade-in bg-gray-900/50 backdrop-blur-[2px]"
        onClick={closeOnBackdrop ? handleClose : undefined}
        aria-hidden="true"
      />

      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "absolute flex flex-col bg-white shadow-drawer",
          SIDE_CLASSES[side] || SIDE_CLASSES.right,
          panelClassName,
        )}
      >
        {isBottom && (
          <div aria-hidden="true" className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-gray-300" />
        )}

        {header || (title || !hideCloseButton) ? (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-3.5 sm:px-5">
            {header || (
              <div className="min-w-0">
                {title && (
                  <h2 id={titleId} className="truncate text-base font-semibold text-gray-900">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id={descriptionId} className="mt-0.5 truncate text-xs text-gray-600">
                    {description}
                  </p>
                )}
              </div>
            )}

            {!hideCloseButton && (
              <IconButton label="Close" onClick={handleClose} size="sm" className="-mr-1 shrink-0">
                <X />
              </IconButton>
            )}
          </div>
        ) : null}

        <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", bodyClassName)}>{children}</div>

        {footer && (
          <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-4 pb-safe sm:px-5">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  )
}

export default Drawer
