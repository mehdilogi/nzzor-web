import Nav from "../components/Nav";
import Footer from "../components/Footer";
import WhatsAppButton from "../components/WhatsAppButton";
import HomeHero from "../components/HomeHero";
import HomeSections from "../components/HomeSections";
import { getFeaturedHotels } from "../lib/api";

export default async function HomePage() {
  const featured = await getFeaturedHotels({ lang: "en" });

  return (
    <>
      <Nav overHero />
      <HomeHero />
      <HomeSections featured={featured} />
      <Footer />
      <WhatsAppButton />
    </>
  );
}
