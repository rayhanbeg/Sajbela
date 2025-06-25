import { Link } from "react-router-dom"

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold text-pink-400 mb-4">সাজবেলা - Sajbela</h3>
            <p className="text-gray-300 mb-4">
              Premium quality bangles and cosmetics for the modern woman. Elegance and beauty in every piece.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-pink-400 transition-colors">
                📘
              </a>
              <a href="#" className="text-gray-300 hover:text-pink-400 transition-colors">
                📷
              </a>
              <a href="#" className="text-gray-300 hover:text-pink-400 transition-colors">
                🐦
              </a>
              <a href="#" className="text-gray-300 hover:text-pink-400 transition-colors">
                📺
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-300 hover:text-pink-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Returns
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-300 hover:text-pink-400 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Categories</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/products?category=bangles" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Bangles
                </Link>
              </li>
              <li>
                <Link to="/products?category=earrings" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Earrings
                </Link>
              </li>
              <li>
                <Link to="/products?category=cosmetics" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Cosmetics
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-300 hover:text-pink-400 transition-colors">
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <div className="space-y-2 text-gray-300">
              <p>📍 Dhaka, Bangladesh</p>
              <p>📞 +8801782-723804</p>
              {/* <p>✉️ info@sajbela.com</p> */}
              <p>🕒 24/7</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300">
            © 2024 Sajbela. All rights reserved. |
            <Link to="/privacy" className="text-pink-400 hover:text-pink-300 ml-1">
              Privacy Policy
            </Link>{" "}
            |
            <Link to="/terms" className="text-pink-400 hover:text-pink-300 ml-1">
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
