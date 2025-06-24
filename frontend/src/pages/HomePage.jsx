import HeroSection from "../components/home/HeroSection"
import CategorySection from "../components/home/CategorySection"
import FeaturedProducts from "../components/home/FeaturedProducts"
import ComboSection from "../components/home/ComboSection"
import NewArrivals from "../components/home/NewArrivals"

const HomePage = () => {
  return (
    <div>
      <HeroSection />
      <CategorySection />
      <NewArrivals />
      <ComboSection />
      <FeaturedProducts />
    </div>
  )
}

export default HomePage
