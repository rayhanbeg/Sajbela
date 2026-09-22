import { forwardRef } from "react"
import { cn } from "../../lib/cn"
import { controlBase, controlState } from "./Input"

const Textarea = forwardRef(function Textarea({ invalid = false, rows = 4, className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(controlBase, controlState(invalid), "resize-y px-3.5 py-2.5 text-sm leading-relaxed", className)}
      {...props}
    />
  )
})

export default Textarea
