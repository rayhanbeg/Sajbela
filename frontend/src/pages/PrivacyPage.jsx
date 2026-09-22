import { ShieldCheck } from "lucide-react"
import PageHero from "../components/PageHero"
import { STORE } from "../lib/navigation"

const SECTIONS = [
  {
    title: "Information we collect",
    body: [
      "When you place an order we collect the details needed to fulfil it: your name, phone number, delivery address and, if you provide one, your email address.",
      "If you create an account we also store your password in hashed form — we never store it in a readable format and nobody at Sajbela can see it.",
      "We collect basic usage analytics (pages viewed, device type) to understand how the store is used and to improve it.",
    ],
  },
  {
    title: "How we use your information",
    body: [
      "To process, pack and deliver your orders, and to contact you about them by phone or email.",
      "To provide customer support when you reach out to us.",
      "To improve our product range, site performance and delivery coverage.",
      "We do not sell your personal information to anyone.",
    ],
  },
  {
    title: "Sharing with third parties",
    body: [
      "We share your name, phone number and address with the courier handling your delivery — this is required to get your parcel to you.",
      "Product images are hosted on Cloudinary and emails are sent through our email provider. These services process data only on our instructions.",
      "We may disclose information where required by law.",
    ],
  },
  {
    title: "Cookies and analytics",
    body: [
      "We use cookies and browser storage to keep you signed in and to remember your cart between visits.",
      "We use Google Analytics and the Meta Pixel to measure traffic and advertising performance. You can block these through your browser settings or an ad blocker without affecting your ability to shop.",
    ],
  },
  {
    title: "Data retention",
    body: [
      "Order records are retained for accounting and warranty purposes. Account data is retained until you ask us to delete it.",
      "Password reset links expire within 30 minutes and are invalidated after a single use.",
    ],
  },
  {
    title: "Your rights",
    body: [
      "You can ask us to correct or delete your personal information, or request a copy of what we hold, at any time.",
      `To make a request, call us on ${STORE.phone} — we'll verify your identity before acting on it.`,
    ],
  },
]

const PrivacyPage = () => {
  return (
    <>
      <PageHero
        icon={<ShieldCheck />}
        title="Privacy Policy"
        description="How Sajbela collects, uses and protects your personal information."
        breadcrumbs={[{ label: "Privacy Policy" }]}
      />

      <div className="page-container py-10 md:py-14">
        <div className="mx-auto max-w-3xl">
          <p className="rounded-card border border-pink-100 bg-pink-50 p-4 text-sm leading-relaxed text-gray-700">
            This policy explains what we collect and why. If anything here is unclear, call us on{" "}
            <a href={STORE.phoneHref} className="font-semibold text-pink-700 hover:underline">
              {STORE.phone}
            </a>{" "}
            and we&rsquo;ll explain it properly.
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

export default PrivacyPage
