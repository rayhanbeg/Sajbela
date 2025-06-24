import { Award, Users, Truck, Shield } from "lucide-react"

const AboutPage = () => {
  const features = [
    {
      icon: Award,
      title: "Premium Quality",
      description: "We source only the finest materials and work with skilled artisans to create beautiful jewelry.",
    },
    {
      icon: Users,
      title: "Customer Focused",
      description: "Your satisfaction is our priority. We provide excellent customer service and support.",
    },
    {
      icon: Truck,
      title: "Fast Delivery",
      description: "Quick and reliable delivery across Bangladesh with cash on delivery option.",
    },
    {
      icon: Shield,
      title: "Secure Shopping",
      description: "Shop with confidence knowing your personal information and payments are secure.",
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-pink-50 to-purple-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">About সাজবেলা – Sajbela</h1>
            <p className="text-lg text-gray-600 mb-8">
              We are passionate about creating beautiful jewelry and cosmetics that celebrate the elegance and grace of
              modern women. Our mission is to provide premium quality products that make every woman feel confident and
              beautiful.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Founded in 2020, সাজবেলা – Sajbela began as a dream to bring authentic, high-quality jewelry and
                  cosmetics to women across Bangladesh. What started as a small venture has grown into a trusted brand
                  known for its commitment to quality and customer satisfaction.
                </p>
                <p>
                  Our name "সাজবেলা" reflects our Bengali heritage and means "time to get dressed up" or "adorning time."
                  We believe that every moment is an opportunity for a woman to express her unique style and personality
                  through beautiful accessories and cosmetics.
                </p>
                <p>
                  Today, we serve thousands of customers across Bangladesh, offering a carefully curated selection of
                  bangles, earrings, and premium metal cosmetics. Each product in our collection is chosen for its
                  quality, craftsmanship, and ability to enhance natural beauty.
                </p>
              </div>
            </div>
            <div>
              <img
                src="/placeholder.svg?height=400&width=400"
                alt="Our Story"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Us</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We're committed to providing an exceptional shopping experience with products and services that exceed
              expectations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-pink-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-600 mb-8">
              To empower women by providing them with beautiful, high-quality jewelry and cosmetics that enhance their
              natural beauty and boost their confidence. We strive to make luxury accessible and celebrate the unique
              style of every woman.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-pink-600 mb-2">500+</h3>
                <p className="text-gray-600">Happy Customers</p>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-pink-600 mb-2">100+</h3>
                <p className="text-gray-600">Premium Products</p>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-pink-600 mb-2">4.8/5</h3>
                <p className="text-gray-600">Customer Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our dedicated team works tirelessly to curate the best products and provide exceptional customer service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { name: "Fatima Khan", role: "Founder & CEO", image: "/placeholder.svg?height=300&width=300" },
              { name: "Rashida Ahmed", role: "Head of Design", image: "/placeholder.svg?height=300&width=300" },
              { name: "Sadia Rahman", role: "Customer Relations", image: "/placeholder.svg?height=300&width=300" },
            ].map((member, index) => (
              <div key={index} className="text-center">
                <img
                  src={member.image || "/placeholder.svg"}
                  alt={member.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage
