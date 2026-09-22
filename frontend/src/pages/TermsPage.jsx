import { FileText } from "lucide-react"
import PageHero from "../components/PageHero"
import { SHIPPING, STORE } from "../lib/navigation"
import { formatPrice } from "../lib/utils"

const SECTIONS = [
  {
    title: "Placing an order",
    body: [
      "Placing an order on Sajbela is an offer to buy. We confirm your order by phone or email before dispatch, and we may decline an order if an item turns out to be unavailable.",
      "You can order as a guest or with an account. Either way you'll receive a confirmation with your order number.",
    ],
  },
  {
    title: "Pricing and payment",
    body: [
      "All prices are shown in Bangladeshi Taka (৳) and include applicable taxes.",
      `Delivery is ${formatPrice(SHIPPING.insideDhaka)} inside Dhaka and ${formatPrice(SHIPPING.outsideDhaka)} outside Dhaka, and is free on orders over ${formatPrice(SHIPPING.freeThreshold)}.`,
      "Cash on Delivery is currently the available payment method. Please have the exact amount ready for the courier where possible.",
      "If a price is listed incorrectly due to an error, we will contact you before processing the order.",
    ],
  },
  {
    title: "Delivery",
    body: [
      "Orders are usually dispatched within 1–2 business days and arrive within 2–3 business days of dispatch.",
      "We call before delivery. If we can't reach you after repeated attempts, the parcel may be returned to us.",
      "Delivery times are estimates and can be affected by weather, holidays and courier capacity.",
    ],
  },
  {
    title: "Returns and cancellations",
    body: [
      "You can cancel an order yourself while it is still pending or processing — once it has shipped, please call us instead.",
      "If an item arrives damaged or is not what you ordered, contact us within 48 hours of delivery and we'll arrange a replacement or refund.",
      "For hygiene reasons, opened cosmetics cannot be returned unless faulty.",
    ],
  },
  {
    title: "Product information",
    body: [
      "We photograph products as accurately as we can, but screen colours vary between devices and handmade items have natural variation. Slight differences are not defects.",
      "Sizes and measurements listed on the product page are the best guide — if you're unsure, message us before ordering.",
    ],
  },
  {
    title: "Your account",
    body: [
      "You are responsible for keeping your password confidential and for activity on your account.",
      "Tell us immediately if you believe someone else has accessed your account.",
      "We may suspend accounts used for fraudulent or abusive activity.",
    ],
  },
  {
    title: "Contact",
    body: [
      `Questions about these terms? Call us on ${STORE.phone}. We're available ${STORE.hours}.`,
    ],
  },
]

const TermsPage = () => {
  return (
    <>
      <PageHero
        icon={<FileText />}
        title="Terms of Service"
        description="The terms that apply when you shop with Sajbela."
        breadcrumbs={[{ label: "Terms of Service" }]}
      />

      <div className="page-container py-10 md:py-14">
        <div className="mx-auto max-w-3xl">
          <p className="rounded-card border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
            By placing an order with Sajbela you agree to the terms below. They&rsquo;re written to be readable rather
            than to sound legal — if something is unclear, just ask.
          </p>

          <div className="mt-8 space-y-9">
            {SECTIONS.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-semibold text-gray-900 md:text-xl">{section.title}</h2>
                <div className="mt-3 space-y-3">
                  {section.body.map((paragraph, index) => (
                    <p key={index} className="text-sm leading-relaxed text-gray-600">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default TermsPage
