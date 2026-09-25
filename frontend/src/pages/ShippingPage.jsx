import { BadgeCheck, MessageCircle, Package, Phone, Truck, Wallet } from "lucide-react"

import PageHero from "../components/PageHero"
import { SHIPPING, STORE } from "../lib/navigation"
import { formatPrice } from "../lib/utils"
import { Button } from "../components/ui"

/**
 * Rates come from lib/navigation SHIPPING so this page can never disagree with
 * what checkout actually charges — it used to advertise express and same-day
 * tiers that checkout has no way to select.
 */
const RATES = [
  { area: "Inside Dhaka", cost: formatPrice(SHIPPING.insideDhaka), time: "1–2 days" },
  { area: "Outside Dhaka", cost: formatPrice(SHIPPING.outsideDhaka), time: "2–3 days" },
  { area: `Over ${formatPrice(SHIPPING.freeThreshold)}`, cost: "Free", time: "Anywhere", highlight: true },
]

const STEPS = [
  { icon: Package, title: "Ordered", text: "We call to confirm." },
  { icon: BadgeCheck, title: "Packed", text: "Dispatched in 1–2 days." },
  { icon: Truck, title: "On the way", text: "The rider calls before arriving." },
  { icon: Wallet, title: "Delivered", text: "Check it, then pay." },
]

const NOTES = [
  "We deliver to all 64 districts.",
  "Cash on delivery everywhere, no extra charge.",
  "Open the parcel in front of the rider.",
  "Jewellery ships in padded, weather-resistant packaging.",
  "Estimates shift during holidays and heavy rain.",
]

const ShippingPage = () => {
  return (
    <>
      <PageHero
        icon={<Truck />}
        title="Delivery"
        description="Cash on delivery, nationwide."
        breadcrumbs={[{ label: "Delivery" }]}
      />

      <div className="page-container py-10 md:py-14">
        <div className="mx-auto max-w-3xl space-y-12">
          {/* Rates */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Charges</h2>

            <ul className="mt-3 grid gap-3 sm:grid-cols-3">
              {RATES.map((rate) => (
                <li
                  key={rate.area}
                  className={
                    rate.highlight
                      ? "rounded-card border border-pink-200 bg-pink-50 p-4"
                      : "rounded-card border border-gray-200 bg-white p-4 shadow-card"
                  }
                >
                  <p className="text-sm font-medium text-gray-600">{rate.area}</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{rate.cost}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{rate.time}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Process */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">How it works</h2>

            <ol className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(({ icon: Icon, title, text }, index) => (
                <li key={title} className="relative">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-pink-600"
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  <p className="mt-3 text-sm font-semibold text-gray-900">
                    <span className="text-pink-600">{index + 1}.</span> {title}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-600">{text}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Good to know */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Good to know</h2>

            <ul className="mt-3 space-y-2.5 rounded-card border border-gray-200 bg-white p-5 shadow-card">
              {NOTES.map((note) => (
                <li key={note} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <BadgeCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-pink-600" />
                  {note}
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Button href={STORE.phoneHref} leftIcon={<Phone className="h-4 w-4" />}>
              {STORE.phone}
            </Button>
            <Button
              href={`https://wa.me/${STORE.whatsapp}`}
              variant="outline"
              leftIcon={<MessageCircle className="h-4 w-4" />}
            >
              WhatsApp
            </Button>
            <Button to="/faq" variant="ghost">
              Read the FAQ
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ShippingPage
