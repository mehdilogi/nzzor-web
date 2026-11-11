import Nav from "../components/Nav";
import Footer from "../components/Footer";
import WhatsAppButton from "../components/WhatsAppButton";
import HomeHero from "../components/HomeHero";
import HomeSections from "../components/HomeSections";
import { getFeaturedHotels, getHotelsPaged, getCities } from "../lib/api";
import { Suspense } from "react";

export const metadata = {
  title: "Nzzor — Réservez votre hôtel en Algérie | CIB et Edahabia",
  description:
    "Hôtels vérifiés dans toutes les wilayas d'Algérie, de Djanet à la côte. Réservation en ligne, paiement par carte CIB ou Edahabia, assistance WhatsApp. Agence de voyage agréée.",
  alternates: { canonical: "https://nzzor.com/" },
};

// Who runs the site, for Google's knowledge panel. Facts only: the agency,
// its address, its phone and email, the payment it accepts.
const ORG_LD = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: "Nzzor",
  legalName: "ALLOUNI TRAVEL AGENCY",
  url: "https://nzzor.com",
  logo: "https://nzzor.com/icon.png",
  image: "https://nzzor.com/og.jpg",
  email: "contact@nzzor.com",
  telephone: "+213770080830",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Cité 300 Logements Les Tours, Bât. A2",
    addressLocality: "Sétif",
    addressCountry: "DZ",
  },
  areaServed: { "@type": "Country", name: "Algeria" },
  currenciesAccepted: "DZD",
  paymentAccepted: "CIB, Edahabia",
};

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_LD) }} />
      <Nav overHero />
      <HomeHero />
      <Suspense fallback={null}>
        <HomeSections
          featured={featured}
          cities={cities}
          hotelCount={hotelCount}
          wilayaCount={wilayaCount}
        />
      </Suspense>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
