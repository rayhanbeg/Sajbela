import { AlertCircle, MessageCircle, Phone, RotateCcw } from "lucide-react"

import PageHero from "../components/PageHero"
import { STORE } from "../lib/navigation"
import { Button } from "../components/ui"

/**
 * Window and conditions match the product page's shipping panel and the Terms
 * page — previously this page promised 7 days and prepaid return labels that
 * don't exist.
 */
const STEPS = [
  { title: "Call us", text: `Ring ${STORE.phone} within 3 days of delivery.` },
  { title: "Send a photo", text: "WhatsApp your order number and a photo of the item." },
  { title: "We collect it", text: "Our rider picks it up at no cost to you." },
  { title: "Replaced or refunded", text: "Usually within 5 business days." },
]

const COVERED = [
  "Damaged or broken on arrival",
  "Wrong item or wrong colour sent",
  "Missing pieces from a combo",
  "Faulty clasp, stone or fitting",
]

const NOT_COVERED = [
  "Opened or used cosmetics",
  "Worn jewellery",
  "Reported more than 3 days after delivery",
  "Slight colour variation on handmade pieces",
]

const ReturnsPage = () => {
  return (
    <>
      <PageHero
        icon={<RotateCcw />}
        title="Returns"
        description="Damaged or wrong item? We replace it free."
        breadcrumbs={[{ label: "Returns" }]}
      />

      <div className="page-container py-10 md:py-14">
        <div className="mx-auto max-w-3xl space-y-12">
          <div className="flex items-start gap-3 rounded-card border border-pink-100 bg-pink-50 p-4">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-pink-600" />
            <p className="text-sm text-gray-700">
              Open your parcel in front of the rider. Anything wrong, tell us within{" "}
              <strong className="font-semibold text-gray-900">3 days</strong>.
            </p>
          </div>

          {/* Process */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">How it works</h2>

            <ol className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, index) => (
                <li key={step.title}>
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-600 text-sm font-bold text-white"
                  >
                    {index + 1}
                  </span>
                  <p className="mt-3 text-sm font-semibold text-gray-900">{step.title}</p>
                  <p className="mt-0.5 text-sm text-gray-600">{step.text}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* What qualifies */}
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-card border border-gray-200 bg-white p-5 shadow-card">
              <h2 className="text-sm font-semibold text-green-700">We&rsquo;ll replace</h2>
              <ul className="mt-3 space-y-2">
                {COVERED.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-card border border-gray-200 bg-white p-5 shadow-card">
              <h2 className="text-sm font-semibold text-gray-700">We can&rsquo;t</h2>
              <ul className="mt-3 space-y-2">
                {NOT_COVERED.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                    <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
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

export default ReturnsPage
