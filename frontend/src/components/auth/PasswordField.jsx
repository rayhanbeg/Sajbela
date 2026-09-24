import { forwardRef, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "../../lib/cn"
import { IconButton, Input } from "../ui"

/**
 * Password input with a show/hide toggle.
 *
 * Every auth page had its own copy of this: a bare <input> plus an absolutely
 * positioned button at `top-2.5`, which drifted off-centre the moment the field
 * height changed and had no accessible name at all — screen readers announced
 * "button". The toggle here is a real IconButton with a label that flips with
 * state, and it lives in Input's `rightElement` slot so it stays centred at any
 * size.
 */
const PasswordField = forwardRef(function PasswordField({ className, ...props }, ref) {
  const [visible, setVisible] = useState(false)

  return (
    <Input
      ref={ref}
      type={visible ? "text" : "password"}
      size="lg"
      autoComplete={props.autoComplete || "current-password"}
      className={className}
      rightElement={
        <IconButton
          label={visible ? "Hide password" : "Show password"}
          size="sm"
          variant="ghost"
          onClick={() => setVisible((v) => !v)}
          // The toggle is a convenience, not a form control — keep it out of
          // the tab order between the field and the submit button.
          tabIndex={-1}
        >
          {visible ? <EyeOff /> : <Eye />}
        </IconButton>
      }
      {...props}
    />
  )
})

/* ── Strength meter ─────────────────────────────────────────── */

const LEVELS = [
  { label: "Too short", bar: "bg-red-500", text: "text-red-600" },
  { label: "Weak", bar: "bg-red-500", text: "text-red-600" },
  { label: "Fair", bar: "bg-yellow-500", text: "text-yellow-700" },
  { label: "Good", bar: "bg-green-500", text: "text-green-600" },
  { label: "Strong", bar: "bg-green-600", text: "text-green-700" },
]

/**
 * Heuristic score 0–4. Deliberately simple and local: the backend's only real
 * rule is `minlength: 6`, so this exists to nudge, never to block.
 */
export function passwordScore(value = "") {
  if (!value) return 0

  let score = value.length >= 6 ? 1 : 0
  if (value.length >= 10) score += 1
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1

  return Math.min(score, 4)
}

export const PasswordStrength = ({ value = "" }) => {
  if (!value) return null

  const score = passwordScore(value)
  const level = LEVELS[score]

  return (
    <div className="mt-2">
      <div aria-hidden="true" className="flex gap-1.5">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              step <= score ? level.bar : "bg-gray-200",
            )}
          />
        ))}
      </div>

      {/* Polite, not assertive: this updates on every keystroke. */}
      <p aria-live="polite" className={cn("mt-1.5 text-xs font-medium", level.text)}>
        {level.label}
        {score < 2 && <span className="font-normal text-gray-500"> — use 8+ characters with a number</span>}
      </p>
    </div>
  )
}

export default PasswordField
