import HeroSection from "../components/home/HeroSection"
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
 *
 * The trust-badge strip that used to sit under the hero is gone — free
 * delivery, cash on delivery and the WhatsApp hours are all still stated on the
 * cart, checkout and shipping pages, where a shopper actually needs them.
 */
const HomePage = () => {
  return (
    <>
      <HeroSection />
      <CategorySection />
      <NewArrivals />
      <ComboSection />
      <FeaturedProducts />
    </>
  )
}

export default HomePage
