import { Truck, Package, Clock, MapPin, Shield } from "lucide-react"

const ShippingPage = () => {
  const shippingOptions = [
    {
      title: "Standard Delivery",
      time: "2-3 Business Days",
      cost: "৳50 (Free on orders above ৳1000)",
      description: "Regular delivery to your doorstep",
    },
    {
      title: "Express Delivery",
      time: "1-2 Business Days",
      cost: "৳100",
      description: "Faster delivery for urgent orders",
    },
    {
      title: "Same Day Delivery",
      time: "Within 24 Hours",
      cost: "৳150",
      description: "Available in Dhaka city only",
    },
  ]

  const deliveryAreas = [
    { area: "Dhaka City", time: "1-2 Days", available: true },
    { area: "Dhaka Division", time: "2-3 Days", available: true },
    { area: "Chittagong", time: "3-4 Days", available: true },
    { area: "Sylhet", time: "3-4 Days", available: true },
    { area: "Rajshahi", time: "3-5 Days", available: true },
    { area: "Khulna", time: "3-5 Days", available: true },
    { area: "Barisal", time: "4-5 Days", available: true },
    { area: "Rangpur", time: "4-5 Days", available: true },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-pink-50 to-purple-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Shipping Information</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Fast, reliable delivery across Bangladesh with multiple shipping options to suit your needs.
            </p>
          </div>
        </div>
      </section>

      {/* Shipping Options */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Shipping Options</h2>
            <p className="text-gray-600">Choose the delivery option that works best for you</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {shippingOptions.map((option, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck className="h-8 w-8 text-pink-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{option.title}</h3>
                  <p className="text-pink-600 font-medium mb-2">{option.time}</p>
                  <p className="text-gray-900 font-semibold mb-3">{option.cost}</p>
                  <p className="text-gray-600 text-sm">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery Areas */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Delivery Coverage</h2>
            <p className="text-gray-600">We deliver nationwide across Bangladesh</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0">
                {deliveryAreas.map((area, index) => (
                  <div key={index} className="p-6 border-b md:border-r border-gray-200 last:border-b-0">
                    <div className="flex items-center mb-2">
                      <MapPin className="h-5 w-5 text-pink-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">{area.area}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{area.time}</p>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        area.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {area.available ? "Available" : "Coming Soon"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shipping Process */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600">Simple steps from order to delivery</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  icon: Package,
                  title: "Order Placed",
                  description: "You place your order and choose delivery option",
                },
                {
                  icon: Shield,
                  title: "Order Confirmed",
                  description: "We confirm your order and prepare for shipping",
                },
                {
                  icon: Truck,
                  title: "In Transit",
                  description: "Your order is on its way to your address",
                },
                {
                  icon: Clock,
                  title: "Delivered",
                  description: "Package delivered to your doorstep",
                },
              ].map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-8 w-8 text-pink-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Shipping Policy */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Shipping Policy</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Free Shipping</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Free delivery on orders above ৳1000</li>
                  <li>• Applies to all delivery areas</li>
                  <li>• No minimum quantity required</li>
                  <li>• Automatically applied at checkout</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Cash on Delivery</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Pay when you receive your order</li>
                  <li>• Available for all delivery areas</li>
                  <li>• No additional charges</li>
                  <li>• Inspect before payment</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Order Tracking</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• SMS updates on order status</li>
                  <li>• Track through your account</li>
                  <li>• Delivery confirmation</li>
                  <li>• Customer support available</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Special Handling</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Secure packaging for jewelry</li>
                  <li>• Fragile items handled with care</li>
                  <li>• Weather-resistant packaging</li>
                  <li>• Insurance on high-value items</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact for Shipping */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Need Help with Shipping?</h2>
            <p className="text-gray-600 mb-8">
              Have questions about delivery or need to track your order? Our customer service team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:+8801234567890"
                className="inline-flex items-center px-6 py-3 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors"
              >
                Call Us: +880-1234-567890
              </a>
              <a
                href="/contact"
                className="inline-flex items-center px-6 py-3 border border-pink-600 text-pink-600 font-medium rounded-lg hover:bg-pink-50 transition-colors"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ShippingPage
