import HeroSection from "../components/home/HeroSection"
import TrustBadges from "../components/home/TrustBadges"
import CategorySection from "../components/home/CategorySection"
import NewArrivals from "../components/home/NewArrivals"
import ComboSection from "../components/home/ComboSection"
import FeaturedProducts from "../components/home/FeaturedProducts"

/**
 * Home page composition.
 *
 * Section backgrounds alternate white / gray-50 so each block reads as its own
 * band without needing dividers. Each product section fetches independently and
 * renders nothing when its endpoint returns no products, so the page still
 * reads correctly on a store with, say, no combos configured.
 */
const HomePage = () => {
  return (
    <>
      <HeroSection />
      <TrustBadges />
      <CategorySection />
      <NewArrivals />
      <ComboSection />
      <FeaturedProducts />
    </>
  )
}

export default HomePage
