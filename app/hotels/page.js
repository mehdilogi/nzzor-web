import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import WhatsAppButton from "../../components/WhatsAppButton";
import SearchResults from "../../components/SearchResults";
import { getHotels, getCities } from "../../lib/api";

export const metadata = {
  title: "Hotels in Algeria — Nzzor",
  description: "Browse 10 verified hotels across Algeria. Filter by city, price, and rating.",
};

export default async function HotelsPage({ searchParams }) {
  const q = searchParams?.q || "";
  const city = searchParams?.city || "";
  const stars = searchParams?.stars || "";
  const sort = searchParams?.sort || "";

  const [hotels, cities] = await Promise.all([
    getHotels({ lang: "en", q, city, stars, sort }),
    getCities({ lang: "en" }),
  ]);

  return (
    <>
      <Nav />
      <SearchResults
        initialHotels={hotels}
        cities={cities}
        initialFilters={{ q, city, stars, sort }}
      />
      <Footer />
      <WhatsAppButton />
    </>
  );
}
