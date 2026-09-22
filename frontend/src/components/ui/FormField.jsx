import { useId } from "react"
import { cn } from "../../lib/cn"

/**
 * Label + hint + error wrapper shared by every form control.
 *
 * Uses the render-prop form so it can hand the control the generated ids it
 * needs for `aria-describedby` / `aria-invalid` without the caller wiring them
 * up by hand:
 *
 *   <FormField label="Email" error={errors.email}>
 *     {(f) => <Input {...f} value={email} onChange={...} />}
 *   </FormField>
 */
const FormField = ({ label, hint, error, required = false, htmlFor, className, children }) => {
  const generatedId = useId()
  const id = htmlFor || generatedId
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  const describedBy = cn(hint && hintId, error && errorId) || undefined

  const fieldProps = {
    id,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
    "aria-required": required || undefined,
    invalid: Boolean(error),
  }

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
          {required && (
            <span className="ml-0.5 text-red-500" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {typeof children === "function" ? children(fieldProps) : children}

      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-gray-500">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="mt-1.5 flex items-start gap-1 text-xs font-medium text-red-600">
          <svg aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10A8 8 0 112 10a8 8 0 0116 0zm-8-4a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

export default FormField
