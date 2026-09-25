import { Link } from "react-router-dom"
import { Facebook, Instagram, Mail, MapPin, Phone, Clock, ShieldCheck, Truck, Youtube, BadgeCheck } from "lucide-react"
import { cn } from "../../lib/cn"
import { CATEGORIES, LEGAL_NAV, SECONDARY_NAV, SHIPPING, STORE, categoryPath } from "../../lib/navigation"
import { formatPrice } from "../../lib/utils"

/**
 * Storefront footer.
 *
 * Carries `pb-bottom-nav` on mobile because it is the last element on the
 * page — without it the mobile bottom nav would cover the copyright row.
 */
const Footer = () => {
  const year = new Date().getFullYear()

  const trustItems = [
    { icon: Truck, text: `Free delivery over ${formatPrice(SHIPPING.freeThreshold)}` },
    { icon: ShieldCheck, text: "Cash on delivery" },
    { icon: BadgeCheck, text: "100% handmade" },
    { icon: Clock, text: "24/7 support" },
  ]

  const socials = [
    { label: "Facebook", href: "https://facebook.com", icon: Facebook },
    { label: "Instagram", href: "https://instagram.com", icon: Instagram },
    { label: "YouTube", href: "https://youtube.com", icon: Youtube },
  ]

  const columnLinkClass =
    "inline-block rounded text-sm text-gray-400 transition-colors duration-200 hover:text-pink-400 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"

  return (
    <footer className="mt-auto bg-gray-900 pb-bottom-nav text-white md:pb-0">
      {/* Trust strip */}
      <div className="border-b border-white/10">
        <div className="page-container grid grid-cols-2 gap-x-4 gap-y-4 py-7 lg:grid-cols-4">
          {trustItems.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-600/15 text-pink-400"
              >
                <Icon className="h-4 w-4" />
              </span>
              <p className="min-w-0 text-sm font-medium text-white">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main columns */}
      <div className="page-container grid grid-cols-2 gap-x-6 gap-y-10 py-12 lg:grid-cols-4 lg:py-14">
        {/* Brand */}
        <div className="col-span-2 lg:col-span-1">
          <p className="mb-3 font-serif text-3xl font-bold tracking-tight text-white">Sajbela</p>

          <p className="text-sm font-semibold text-pink-400">
            {STORE.nameBn}
          </p>
          <p className="mt-2 max-w-xs text-sm text-gray-400">
            Handmade bangles, jewelry and cosmetics.
          </p>

          <ul className="mt-5 flex items-center gap-2">
            {socials.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${STORE.name} on ${label}`}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-gray-300",
                    "transition-colors duration-200 hover:bg-pink-600 hover:text-white",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900",
                  )}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Shop */}
        <nav aria-labelledby="footer-shop">
          <h2 id="footer-shop" className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            Shop
          </h2>
          <ul className="space-y-2.5">
            {CATEGORIES.map((category) => (
              <li key={category.slug}>
                <Link to={categoryPath(category.slug)} className={columnLinkClass}>
                  {category.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/products" className={cn(columnLinkClass, "font-medium text-pink-400 hover:text-pink-300")}>
                All Products
              </Link>
            </li>
          </ul>
        </nav>

        {/* Help */}
        <nav aria-labelledby="footer-help">
          <h2 id="footer-help" className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            Help &amp; Info
          </h2>
          <ul className="space-y-2.5">
            {SECONDARY_NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className={columnLinkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact */}
        <div className="col-span-2 lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Get in touch</h2>

          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-start gap-2.5">
              <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-pink-400" />
              <span>{STORE.location}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Phone aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-pink-400" />
              <a href={STORE.phoneHref} className="transition-colors hover:text-pink-400">
                {STORE.phone}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-pink-400" />
              <span>Open {STORE.hours}</span>
            </li>
          </ul>

          <div className="mt-6 rounded-card border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">Need help?</p>
            <a
              href={`https://wa.me/${STORE.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "mt-3 inline-flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white",
                "transition-colors duration-200 hover:bg-pink-700",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900",
              )}
            >
              <Mail aria-hidden="true" className="h-4 w-4" />
              Chat with us
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="page-container flex flex-col items-center justify-between gap-3 py-5 sm:flex-row">
          <p className="text-xs text-gray-500">
            &copy; {year} {STORE.name}. All rights reserved.
          </p>

          <ul className="flex items-center gap-4">
            {LEGAL_NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-xs text-gray-500 transition-colors hover:text-pink-400">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}

export default Footer
