import { RotateCcw, Shield, Clock, CheckCircle } from "lucide-react"

const ReturnsPage = () => {
  const returnSteps = [
    {
      step: "1",
      title: "Contact Us",
      description: "Call or email us within 7 days of delivery to initiate a return",
    },
    {
      step: "2",
      title: "Get Approval",
      description: "We'll review your request and provide return instructions",
    },
    {
      step: "3",
      title: "Pack & Ship",
      description: "Pack the item securely and send it back using our provided label",
    },
    {
      step: "4",
      title: "Refund/Exchange",
      description: "Once we receive the item, we'll process your refund or exchange",
    },
  ]

  const returnConditions = [
    "Item must be in original condition",
    "Original packaging and tags must be intact",
    "Return initiated within 7 days of delivery",
    "Item must not be damaged or used",
    "Jewelry items must be unworn",
    "Cosmetics must be unopened and unused",
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-pink-50 to-purple-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Returns & Exchanges</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Not satisfied with your purchase? We offer easy returns and exchanges within 7 days of delivery.
            </p>
          </div>
        </div>
      </section>

      {/* Return Policy Overview */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-pink-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">7-Day Return</h3>
                <p className="text-gray-600">Return or exchange within 7 days of delivery</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-pink-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality Guarantee</h3>
                <p className="text-gray-600">Full refund if item doesn't match description</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RotateCcw className="h-8 w-8 text-pink-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Process</h3>
                <p className="text-gray-600">Simple return process with customer support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Return Process */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How to Return</h2>
            <p className="text-gray-600">Follow these simple steps to return your item</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {returnSteps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-pink-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Return Conditions */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Return Conditions</h2>
                <p className="text-gray-600 mb-6">
                  To ensure a smooth return process, please make sure your item meets the following conditions:
                </p>

                <div className="space-y-3">
                  {returnConditions.map((condition, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{condition}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Important Notes</h3>
                <div className="space-y-4 text-gray-600">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Refund Timeline</h4>
                    <p className="text-sm">
                      Refunds are processed within 5-7 business days after we receive the returned item.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Return Shipping</h4>
                    <p className="text-sm">
                      We provide a prepaid return label for defective items. For other returns, customer pays return
                      shipping.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Exchange Policy</h4>
                    <p className="text-sm">
                      Exchanges are subject to availability. If the desired item is not available, we'll process a full
                      refund.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Custom Orders</h4>
                    <p className="text-sm">
                      Custom or personalized items cannot be returned unless they are defective.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Refund Methods */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Refund Methods</h2>
            <p className="text-gray-600">Choose how you'd like to receive your refund</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 font-bold">bK</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">bKash</h3>
                <p className="text-gray-600 text-sm">Instant refund to your bKash account</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold">Bank</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Bank Transfer</h3>
                <p className="text-gray-600 text-sm">Direct transfer to your bank account</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 font-bold">SC</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Store Credit</h3>
                <p className="text-gray-600 text-sm">Credit for future purchases with bonus</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">Common questions about returns and exchanges</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                question: "Can I return jewelry items?",
                answer:
                  "Yes, jewelry items can be returned within 7 days if they are unworn and in original condition with all packaging and tags intact.",
              },
              {
                question: "What if I received a damaged item?",
                answer:
                  "If you received a damaged item, please contact us immediately. We'll provide a prepaid return label and process a full refund or replacement.",
              },
              {
                question: "Can I exchange for a different size or color?",
                answer:
                  "Yes, exchanges are available subject to stock availability. If the desired item is not available, we'll process a full refund.",
              },
              {
                question: "How long does the refund process take?",
                answer:
                  "Once we receive your returned item, refunds are processed within 5-7 business days. The time to reflect in your account depends on your payment method.",
              },
              {
                question: "Do I need to pay for return shipping?",
                answer:
                  "For defective items, we provide prepaid return labels. For other returns, customers are responsible for return shipping costs.",
              },
            ].map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Need Help with Returns?</h2>
            <p className="text-gray-600 mb-8">
              Our customer service team is ready to assist you with your return or exchange request.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:+8801234567890"
                className="inline-flex items-center px-6 py-3 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors"
              >
                Call: +880-1234-567890
              </a>
              <a
                href="mailto:returns@sajbela.com"
                className="inline-flex items-center px-6 py-3 border border-pink-600 text-pink-600 font-medium rounded-lg hover:bg-pink-50 transition-colors"
              >
                Email: returns@sajbela.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ReturnsPage
