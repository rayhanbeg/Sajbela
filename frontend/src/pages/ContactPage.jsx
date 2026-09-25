import { useState } from "react"
import { Clock, MapPin, MessageCircle, Phone, Send } from "lucide-react"

import PageHero from "../components/PageHero"
import { STORE } from "../lib/navigation"
import { Button, FormField, Select, Textarea } from "../components/ui"

/**
 * Contact.
 *
 * The old form faked a submit with setTimeout and told people "we'll get back
 * to you soon" — nothing was ever sent, and there is no contact endpoint on the
 * backend. It now composes a WhatsApp message instead, which actually reaches
 * the store and needs no server.
 */

const SUBJECTS = ["Order support", "Product question", "Delivery", "Return or exchange", "Something else"]

const CHANNELS = [
  { icon: Phone, label: "Phone", value: STORE.phone, href: STORE.phoneHref },
  { icon: MessageCircle, label: "WhatsApp", value: STORE.phone, href: `https://wa.me/${STORE.whatsapp}` },
  { icon: Clock, label: "Hours", value: STORE.hours },
  { icon: MapPin, label: "Based in", value: STORE.location },
]

const ContactPage = () => {
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [message, setMessage] = useState("")

  const send = (event) => {
    event.preventDefault()
    const text = `${subject}: ${message.trim()}`
    window.open(`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener")
  }

  return (
    <>
      <PageHero
        icon={<MessageCircle />}
        title="Contact"
        description={`We answer ${STORE.hours}.`}
        breadcrumbs={[{ label: "Contact" }]}
      />

      <div className="page-container py-10 md:py-14">
        <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr_1.1fr]">
          {/* Channels */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Reach us</h2>

            <ul className="mt-3 space-y-2.5">
              {CHANNELS.map(({ icon: Icon, label, value, href }) => {
                const body = (
                  <>
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600"
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs text-gray-500">{label}</span>
                      <span className="block truncate text-sm font-semibold text-gray-900">{value}</span>
                    </span>
                  </>
                )

                return (
                  <li key={label}>
                    {href ? (
                      <a
                        href={href}
                        target={href.startsWith("http") ? "_blank" : undefined}
                        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="flex items-center gap-3 rounded-card border border-gray-200 bg-white p-4 shadow-card transition-colors duration-200 hover:border-pink-300 hover:bg-pink-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                      >
                        {body}
                      </a>
                    ) : (
                      <div className="flex items-center gap-3 rounded-card border border-gray-200 bg-white p-4 shadow-card">
                        {body}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>

            <Button to="/faq" variant="ghost" className="mt-3">
              Read the FAQ first
            </Button>
          </section>

          {/* Message */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Send a message</h2>

            <form
              onSubmit={send}
              className="mt-3 space-y-4 rounded-card border border-gray-200 bg-white p-5 shadow-card"
            >
              <FormField label="Topic" htmlFor="contact-subject">
                {(field) => (
                  <Select {...field} value={subject} onChange={(event) => setSubject(event.target.value)}>
                    {SUBJECTS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>

              <FormField label="Message" htmlFor="contact-message" hint="Opens in WhatsApp" required>
                {(field) => (
                  <Textarea
                    {...field}
                    required
                    rows={5}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Include your order number if you have one."
                  />
                )}
              </FormField>

              <Button type="submit" fullWidth size="lg" disabled={!message.trim()} leftIcon={<Send className="h-4 w-4" />}>
                Send on WhatsApp
              </Button>
            </form>
          </section>
        </div>
      </div>
    </>
  )
}

export default ContactPage
