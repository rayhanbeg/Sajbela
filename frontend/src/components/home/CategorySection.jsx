import { Link } from "react-router-dom"

const CategorySection = () => {
  const categories = [
    {
      name: "Bangles",
      icon: "💍",
      link: "/products?category=bangles",
      color: "from-pink-500 to-rose-500",
    },
    {
      name: "Earrings",
      icon: "✨",
      link: "/products?category=earrings",
      color: "from-purple-500 to-indigo-500",
    },
    {
      name: "Cosmetics",
      icon: "💄",
      link: "/products?category=cosmetics",
      color: "from-blue-500 to-cyan-500",
    },
    {
      name: "Necklaces",
      icon: "📿",
      link: "/products?category=necklaces",
      color: "from-emerald-500 to-teal-500",
    },
    {
      name: "Rings",
      icon: "💎",
      link: "/products?category=rings",
      color: "from-orange-500 to-red-500",
    },
    {
      name: "Alna",
      icon: "🌟",
      link: "/products?category=alna",
      color: "from-yellow-500 to-amber-500",
    },
    {
      name: "Combo",
      icon: "🎁",
      link: "/products?category=combo",
      color: "from-violet-500 to-purple-500",
    },
  ]

  return (
    <section className="py-8 md:py-12 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Shop by Category</h2>
          <p className="text-gray-600">Explore our curated collections</p>
        </div>

        {/* Grid Layout - Responsive for 7 items */}
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4 max-w-5xl mx-auto">
          {categories.map((category, index) => (
            <Link
              key={index}
              to={category.link}
              className="group flex flex-col items-center p-3 md:p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
            >
              <div
                className={`w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-r ${category.color} flex items-center justify-center text-lg md:text-2xl mb-2 md:mb-3 group-hover:scale-110 transition-transform duration-300`}
              >
                {category.icon}
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-900 text-center leading-tight">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-6 md:mt-8">
          <Link
            to="/products"
            className="inline-flex items-center px-6 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors duration-300 text-sm font-medium"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  )
}

export default CategorySection
