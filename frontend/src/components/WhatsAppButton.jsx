
import { MessageCircle } from "lucide-react"

const WhatsAppButton = () => {
  const handleWhatsAppClick = () => {
    // Replace with your actual WhatsApp number (include country code without + sign)
    const phoneNumber = "8801782723804" // Example: Bangladesh number
    const message = "Hello! I'm interested in your jewelry products."
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  return (
    <button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50"
      title="Chat with us on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  )
}

export default WhatsAppButton
