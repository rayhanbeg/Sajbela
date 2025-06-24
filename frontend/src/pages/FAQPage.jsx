import { useState } from "react"
import { ChevronDown, ChevronUp, Search } from "lucide-react"

const FAQPage = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [openItems, setOpenItems] = useState({})

  const faqCategories = [
    {
      category: "Orders & Payment",
      questions: [
        {
          question: "How do I place an order?",
          answer:
            "You can place an order by browsing our products, adding items to your cart, and proceeding to checkout. Fill in your shipping details and choose your payment method to complete the order.",
        },
        {
          question: "What payment methods do you accept?",
          answer:
            "We accept Cash on Delivery (COD) and bKash payments. COD is available for all areas we deliver to, and there are no additional charges for COD.",
        },
        {
          question: "Can I modify or cancel my order?",
          answer:
            "You can modify or cancel your order within 2 hours of placing it. After that, the order goes into processing and cannot be changed. Please contact us immediately if you need to make changes.",
        },
        {
          question: "Do you offer installment payments?",
          answer:
            "Currently, we only accept full payment through COD or bKash. We're working on introducing installment options in the future.",
        },
      ],
    },
    {
      category: "Shipping & Delivery",
      questions: [
        {
          question: "What are your delivery charges?",
          answer:
            "We offer free delivery on orders above ৳1000. For orders below ৳1000, delivery charge is ৳50. Express delivery is available for ৳100, and same-day delivery in Dhaka for ৳150.",
        },
        {
          question: "How long does delivery take?",
          answer:
            "Standard delivery takes 2-3 business days within Dhaka and 3-5 business days outside Dhaka. Express delivery takes 1-2 business days, and same-day delivery is available in Dhaka city.",
        },
        {
          question: "Do you deliver nationwide?",
          answer:
            "Yes, we deliver to all divisions in Bangladesh including Dhaka, Chittagong, Sylhet, Rajshahi, Khulna, Barisal, and Rangpur.",
        },
        {
          question: "Can I track my order?",
          answer:
            "Yes, you'll receive SMS updates about your order status. You can also track your order by logging into your account and viewing your order history.",
        },
      ],
    },
    {
      category: "Products & Quality",
      questions: [
        {
          question: "Are your jewelry items genuine?",
          answer:
            "Yes, all our jewelry items are made with genuine materials. We provide detailed product descriptions and specifications for each item. We stand behind the quality of our products.",
        },
        {
          question: "What materials are used in your bangles?",
          answer:
            "Our bangles are made from various materials including gold-plated metal, silver-plated metal, and rose gold-plated metal. Each product page contains detailed material information.",
        },
        {
          question: "Are your cosmetics safe to use?",
          answer:
            "Yes, all our cosmetics are tested and safe for use. They are made from quality ingredients and meet safety standards. However, we recommend doing a patch test before full use.",
        },
        {
          question: "Do you have size guides for jewelry?",
          answer:
            "Yes, we provide size guides for our jewelry items. You can find sizing information on each product page. If you're unsure about sizing, please contact our customer service.",
        },
      ],
    },
    {
      category: "Returns & Exchanges",
      questions: [
        {
          question: "What is your return policy?",
          answer:
            "We accept returns within 7 days of delivery. Items must be in original condition with tags and packaging intact. Jewelry must be unworn and cosmetics must be unopened.",
        },
        {
          question: "How do I return an item?",
          answer:
            "Contact us within 7 days of delivery to initiate a return. We'll provide return instructions and, for defective items, a prepaid return label.",
        },
        {
          question: "Can I exchange for a different size or color?",
          answer:
            "Yes, exchanges are available subject to stock availability. If the desired item is not available, we'll process a full refund instead.",
        },
        {
          question: "How long does refund processing take?",
          answer:
            "Refunds are processed within 5-7 business days after we receive the returned item. The time to reflect in your account depends on your payment method.",
        },
      ],
    },
    {
      category: "Account & Support",
      questions: [
        {
          question: "Do I need to create an account to shop?",
          answer:
            "No, you can shop as a guest. However, creating an account allows you to track orders, save addresses, view order history, and get faster checkout.",
        },
        {
          question: "How do I reset my password?",
          answer:
            "Click on 'Forgot Password' on the login page and enter your email address. We'll send you a password reset link to your email.",
        },
        {
          question: "How can I contact customer support?",
          answer:
            "You can contact us by phone at +880-1234-567890, email at info@sajbela.com, or through our contact form. Our support hours are Monday-Friday 9 AM-8 PM, Saturday 10 AM-6 PM.",
        },
        {
          question: "Do you have a physical store?",
          answer:
            "Currently, we operate online only. However, we're planning to open physical stores in major cities. Follow us on social media for updates.",
        },
      ],
    },
  ]

  const toggleItem = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const filteredFAQs = faqCategories.map((category) => ({
    ...category,
    questions: category.questions.filter(
      (q) =>
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchTerm.toLowerCase()),
    ),
  }))

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-pink-50 to-purple-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Find answers to common questions about our products, shipping, returns, and more.
            </p>

            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {filteredFAQs.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-12">
                {category.questions.length > 0 && (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">{category.category}</h2>
                    <div className="space-y-4">
                      {category.questions.map((faq, questionIndex) => {
                        const isOpen = openItems[`${categoryIndex}-${questionIndex}`]
                        return (
                          <div key={questionIndex} className="bg-white rounded-lg shadow-md overflow-hidden">
                            <button
                              onClick={() => toggleItem(categoryIndex, questionIndex)}
                              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                              <span className="font-semibold text-gray-900">{faq.question}</span>
                              {isOpen ? (
                                <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                              )}
                            </button>
                            {isOpen && (
                              <div className="px-6 pb-4">
                                <p className="text-gray-600">{faq.answer}</p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* No Results */}
            {searchTerm && filteredFAQs.every((category) => category.questions.length === 0) && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No FAQs found matching your search.</p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 text-pink-600 hover:text-pink-700 font-medium"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Still Need Help Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Still Need Help?</h2>
            <p className="text-gray-600 mb-8">
              Can't find the answer you're looking for? Our customer support team is here to help you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:+8801234567890"
                className="inline-flex items-center px-6 py-3 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors"
              >
                Call: +880-1234-567890
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

export default FAQPage
