import { BadgeCheck, Hand, MessageCircle, Phone, Sparkles, Truck, Wallet } from "lucide-react"

import PageHero from "../components/PageHero"
import { CATEGORIES, SHIPPING, STORE, categoryPath } from "../lib/navigation"
import { formatPrice } from "../lib/utils"
import { Button } from "../components/ui"

const VALUES = [
  { icon: Hand, title: "Handmade", text: "Made in small batches by local artisans." },
  { icon: BadgeCheck, title: "Checked", text: "Every piece inspected before it ships." },
  { icon: Wallet, title: "Pay on delivery", text: "Cash on delivery, nationwide." },
  { icon: Truck, title: "Free over " + formatPrice(SHIPPING.freeThreshold), text: "Delivered to all 64 districts." },
]

const AboutPage = () => {
  return (
    <>
      <PageHero
        icon={<Sparkles />}
        title={`About ${STORE.nameBn} — ${STORE.name}`}
        description="Handmade bangles, jewellery and cosmetics, delivered across Bangladesh."
        breadcrumbs={[{ label: "About" }]}
      />

      <div className="page-container py-10 md:py-14">
        <div className="mx-auto max-w-3xl space-y-12">
          {/* Story */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 md:text-xl">Our story</h2>

            <div className="mt-3 space-y-3 text-sm leading-relaxed text-gray-600">
              <p>
                Sajbela started in 2020 with one shelf of glass bangles and a phone for taking orders. We now ship
                handmade jewellery and cosmetics to shoppers in every district.
              </p>
              <p>
                &ldquo;{STORE.nameBn}&rdquo; means <em>adorning time</em> — the few quiet minutes before you head out.
                That&rsquo;s what we make things for.
              </p>
            </div>
          </section>

          {/* Values */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">What you can count on</h2>

            <ul className="mt-3 grid gap-4 sm:grid-cols-2">
              {VALUES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3 rounded-card border border-gray-200 bg-white p-4 shadow-card">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{title}</p>
                    <p className="mt-0.5 text-sm text-gray-600">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Categories */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">What we sell</h2>

            <ul className="mt-3 flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <li key={category.slug}>
                  <Button to={categoryPath(category.slug)} variant="outline" size="sm">
                    {category.label}
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-col gap-2.5 rounded-card border border-pink-100 bg-pink-50 p-6 sm:flex-row sm:items-center">
            <p className="flex-1 text-sm font-medium text-gray-900">
              Questions before you order? We answer {STORE.hours}.
            </p>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Button href={STORE.phoneHref} leftIcon={<Phone className="h-4 w-4" />}>
                Call
              </Button>
              <Button
                href={`https://wa.me/${STORE.whatsapp}`}
                variant="outline"
                leftIcon={<MessageCircle className="h-4 w-4" />}
              >
                WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AboutPage
