import { forwardRef } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/cn"
import { controlBase, controlState, controlSizes } from "./Input"

/**
 * Native <select> with the platform arrow replaced by a consistent chevron.
 * Native is deliberate: it gives us the OS picker on mobile for free, which
 * beats any custom dropdown for the 63-district checkout field.
 */
const Select = forwardRef(function Select(
  { size = "md", invalid = false, placeholder, children, className, containerClassName, ...props },
  ref,
) {
  return (
    <div className={cn("relative", containerClassName)}>
      <select
        ref={ref}
        className={cn(
          controlBase,
          controlState(invalid),
          controlSizes[size] || controlSizes.md,
          "cursor-pointer appearance-none pr-10",
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>

      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
      />
    </div>
  )
})

export default Select
