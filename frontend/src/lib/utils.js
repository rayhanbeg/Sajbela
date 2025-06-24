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
