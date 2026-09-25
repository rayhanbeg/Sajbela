import { SHIPPING, STORE } from "./navigation"
import { formatPrice } from "./utils"

/**
 * The single source of FAQ copy.
 *
 * Contact, Shipping and Returns each used to carry their own near-duplicate
 * FAQ blocks, and the numbers in them had drifted away from what checkout
 * actually charges. Everything now reads from SHIPPING / STORE and lives here;
 * other pages link to /faq instead of repeating it.
 */

const inside = formatPrice(SHIPPING.insideDhaka)
const outside = formatPrice(SHIPPING.outsideDhaka)
const free = formatPrice(SHIPPING.freeThreshold)

export const FAQ_GROUPS = [
  {
    id: "orders",
    title: "Orders & payment",
    items: [
      {
        id: "how-to-order",
        q: "How do I place an order?",
        a: "Add items to your cart, go to checkout and fill in your delivery details. No account needed.",
      },
      {
        id: "payment",
        q: "What payment methods do you accept?",
        a: "Cash on delivery, everywhere we deliver. No extra charge.",
      },
      {
        id: "cancel",
        q: "Can I cancel my order?",
        a: `Yes — cancel it yourself from your account while it is still pending or processing. Once it ships, call ${STORE.phone}.`,
      },
      {
        id: "confirm",
        q: "Will you confirm my order?",
        a: "We call or email to confirm before dispatch, so keep your phone reachable.",
      },
    ],
  },
  {
    id: "delivery",
    title: "Delivery",
    items: [
      {
        id: "charges",
        q: "What are the delivery charges?",
        a: `${inside} inside Dhaka, ${outside} outside Dhaka. Free over ${free}.`,
      },
      {
        id: "time",
        q: "How long does delivery take?",
        a: "We dispatch in 1–2 business days. Parcels arrive 2–3 business days after that.",
      },
      {
        id: "coverage",
        q: "Do you deliver nationwide?",
        a: "Yes, to all 64 districts.",
      },
      {
        id: "track",
        q: "Can I track my order?",
        a: "Sign in and open your account — every order shows its current stage.",
      },
    ],
  },
  {
    id: "products",
    title: "Products",
    items: [
      {
        id: "materials",
        q: "What are the bangles made of?",
        a: "Glass, resin and plated metal, depending on the design. The exact material is on each product page.",
      },
      {
        id: "handmade",
        q: "Why does my item look slightly different?",
        a: "Handmade pieces vary a little, and screen colours differ between devices. Small differences are not defects.",
      },
      {
        id: "cosmetics-safe",
        q: "Are your cosmetics safe?",
        a: "Yes. We still recommend a patch test before first use.",
      },
      {
        id: "sizing",
        q: "How do I pick a size?",
        a: "Sizes are listed on the product page. Unsure? Message us before ordering.",
      },
    ],
  },
  {
    id: "returns",
    title: "Returns",
    items: [
      {
        id: "window",
        q: "What is your return policy?",
        a: "Report a damaged or wrong item within 3 days of delivery and we replace it free.",
      },
      {
        id: "how-return",
        q: "How do I start a return?",
        a: `Call ${STORE.phone} with your order number and a photo of the item.`,
      },
      {
        id: "cosmetics-return",
        q: "Can I return cosmetics?",
        a: "Only unopened. Opened cosmetics can't be returned for hygiene reasons.",
      },
      {
        id: "inspect",
        q: "Can I check the parcel before paying?",
        a: "Yes — open it in front of the rider.",
      },
    ],
  },
  {
    id: "account",
    title: "Account",
    items: [
      {
        id: "need-account",
        q: "Do I need an account?",
        a: "No. An account just saves your addresses and keeps your order history.",
      },
      {
        id: "password",
        q: "I forgot my password.",
        a: "Use Forgot password on the sign-in page. The link works once and expires in 30 minutes.",
      },
      {
        id: "support",
        q: "How do I reach you?",
        a: `Call or WhatsApp ${STORE.phone}, ${STORE.hours}.`,
      },
    ],
  },
]

/** Case-insensitive search across questions and answers. */
export function searchFaq(term) {
  const query = term.trim().toLowerCase()
  if (!query) return FAQ_GROUPS

  return FAQ_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query),
    ),
  })).filter((group) => group.items.length > 0)
}
