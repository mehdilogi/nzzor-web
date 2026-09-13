import Nav from "../components/Nav";
import Footer from "../components/Footer";
import WhatsAppButton from "../components/WhatsAppButton";
import HomeHero from "../components/HomeHero";
import HomeSections from "../components/HomeSections";
import { getFeaturedHotels, getHotelsPaged, getCities } from "../lib/api";
import { Suspense } from "react";

export default async function HomePage() {
  // Counts are read from the API rather than written into copy. The homepage
  // previously claimed "10 hotels" and "9 wilayas" against a catalogue that had
  // grown to 215 across 47 — numbers baked into strings go stale silently and
  // nobody notices, because nothing breaks.
  //
  // limit=1 because only the pagination envelope is wanted here, not the rows.
  const [featured, count, cities] = await Promise.all([
    getFeaturedHotels({ lang: "en" }),
    getHotelsPaged({ lang: "en", page: 1, limit: 1 }),
    getCities({ lang: "en" }),
  ]);

  const hotelCount = count?.pagination?.total || 0;
  const wilayaCount = cities?.length || 0;

  return (
    <>
      <Nav overHero />
      <HomeHero />
      <Suspense fallback={null}>
        <HomeSections
          featured={featured}
          hotelCount={hotelCount}
          wilayaCount={wilayaCount}
        />
      </Suspense>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
