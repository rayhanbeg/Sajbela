/**
 * Tiny className joiner.
 *
 * Accepts strings, arrays, and condition objects, drops falsy values:
 *   cn("a", cond && "b", ["c", "d"], { e: isActive })  ->  "a c d e"
 *
 * Note: this does NOT resolve conflicting Tailwind utilities the way
 * `tailwind-merge` does. Components in components/ui therefore expose explicit
 * props (variant / size / fullWidth) for anything you'd want to change, and
 * reserve `className` for layout concerns (margin, width, position) that don't
 * collide with their own base styles.
 */
export function cn(...inputs) {
  const out = []

  for (const input of inputs) {
    if (!input) continue

    if (typeof input === "string" || typeof input === "number") {
      out.push(String(input))
    } else if (Array.isArray(input)) {
      const nested = cn(...input)
      if (nested) out.push(nested)
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) out.push(key)
      }
    }
  }

  return out.join(" ")
}

export default cn
