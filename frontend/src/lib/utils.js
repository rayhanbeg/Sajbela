export const formatPrice = (price) => {
  return `৳${Number(price).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

export const formatCurrency = (price) => {
  return `৳${Number(price).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

export const formatDate = (date) => {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}

export const generateId = () => {
  return Math.random().toString(36).substr(2, 9)
}

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validatePhone = (phone) => {
  // Strict Bangladeshi phone number validation - must start with 01
  const cleanPhone = phone.replace(/[\s-]/g, "") // Remove spaces and dashes

  // Must be exactly 11 digits and start with 01[3-9]
  const phoneRegex = /^01[3-9]\d{8}$/
  return phoneRegex.test(cleanPhone)
}

/**
 * Maps the ways people actually write a Bangladeshi mobile number onto the one
 * shape `validatePhone` accepts — `01XXXXXXXXX`.
 *
 * `+880 1712-345678`, `8801712345678` and `1712345678` are all the same number
 * as `01712345678`, and all three fail the validator. Telling someone their own
 * number is invalid when it's only punctuated differently is an error they can
 * stare at without ever seeing — so normalise first, then validate.
 *
 * Hands the input straight back when it can't be recognised, which keeps the
 * validator as the only thing that decides: this canonicalises, it doesn't
 * approve. `01012345678` still comes out the far side and is still rejected,
 * because 010 isn't a real operator prefix.
 */
export const normalizePhone = (phone) => {
  const national = String(phone ?? "")
    .replace(/[^\d+]/g, "") // spaces, dashes, brackets, dots
    .replace(/^\+/, "") //     +8801…   → 8801…
    .replace(/^00/, "") //     008801…  → 8801…
    .replace(/^880/, "") //    8801…    → 1…
    .replace(/^0/, "") //      01…      → 1…

  return /^1\d{9}$/.test(national) ? `0${national}` : String(phone ?? "")
}

export const formatPhoneNumber = (phone) => {
  // Format phone number for display
  const cleanPhone = phone.replace(/[\s-]/g, "")

  // If it's a valid 11-digit number starting with 01, format it
  if (/^01\d{9}$/.test(cleanPhone)) {
    return cleanPhone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")
  }

  return phone
}

export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text
  return text.substr(0, maxLength) + "..."
}
