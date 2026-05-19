import Nav from "../components/Nav";
import Footer from "../components/Footer";
import WhatsAppButton from "../components/WhatsAppButton";
import HomeHero from "../components/HomeHero";
import HomeSections from "../components/HomeSections";
import { getFeaturedHotels } from "../lib/api";
import { Suspense } from "react";

export default async function HomePage() {
  const featured = await getFeaturedHotels({ lang: "en" });

  return (
    <>
      <Nav overHero />
      <HomeHero />
      <Suspense fallback={null}>
        <HomeSections featured={featured} />
      </Suspense>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
