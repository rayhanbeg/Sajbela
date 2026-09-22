import { STORE } from "../lib/navigation"

/**
 * Floating WhatsApp contact button.
 *
 * Positioned above the mobile bottom nav (bottom-[calc(4rem+...)]) so the two
 * never overlap, and below the drawer/modal z-layers so overlays cover it.
 *
 * The icon is an inline SVG rather than a hotlinked Wikipedia image — that
 * removed a third-party request on every page load and a dependency on an
 * external host staying up.
 */
const WhatsAppButton = () => {
  const message = "Hello! I'm interested in your jewelry products."
  const href = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(message)}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
      className={[
        "group fixed right-4 z-header flex h-12 w-12 items-center justify-center rounded-full",
        "bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-6 md:right-6 md:h-14 md:w-14",
        "bg-[#25D366] text-white shadow-lg",
        "transition-transform duration-300 ease-out-expo hover:scale-110 active:scale-95",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2",
      ].join(" ")}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 md:h-7 md:w-7">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.945c0 2.096.549 4.14 1.595 5.945L0 24l6.305-1.654a11.9 11.9 0 0 0 5.683 1.448h.005c6.585 0 11.946-5.359 11.949-11.945a11.87 11.87 0 0 0-3.497-8.4" />
      </svg>
    </a>
  )
}

export default WhatsAppButton
