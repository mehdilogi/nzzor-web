import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import WhatsAppButton from "../../components/WhatsAppButton";
import SearchResults from "../../components/SearchResults";
import { getHotelsPaged, getCities } from "../../lib/api";

export const metadata = {
  title: "Hotels in Algeria — Nzzor",
  // No hotel count here. The old description said "Browse 10 verified hotels"
  // while the platform carried 135 — a number embedded in copy goes stale
  // silently, and this string is what Google indexes.
  description: "Browse verified hotels across Algeria. Filter by wilaya, price, and rating.",
};

// 24 = six clean rows at four across.
const PER_PAGE = 24;

export default async function HotelsPage({ searchParams }) {
  const q = searchParams?.q || "";
  const city = searchParams?.city || "";
  const stars = searchParams?.stars || "";
  const sort = searchParams?.sort || "";
  const maxPrice = searchParams?.maxPrice || "";
  const minPrice = searchParams?.minPrice || "";
  const tags = searchParams?.tags || "";
  const ai = searchParams?.ai === "1";

  // `page` stays a real server-rendered URL even though the UI uses a "show
  // more" button. Google crawls /hotels?page=4; it does not click buttons. If
  // this became client-only, pages 2+ would leave the index entirely.
  const page = Math.max(1, parseInt(searchParams?.page, 10) || 1);

  // Every filter now goes to the API. Previously this page fetched a fixed 50
  // rows and SearchResults filtered that array in the browser, so any hotel
  // outside the top 50 by popularity could not be reached at all — not by
  // city, not by stars, not by search. routes/hotels.js already supported all
  // of this server-side; it simply was never asked.
  const [result, cities] = await Promise.all([
    getHotelsPaged({
      lang: "en",
      q: ai ? "" : q,
      city, stars, sort, maxPrice, minPrice, tags,
      page,
      limit: PER_PAGE,
    }),
    getCities({ lang: "en" }),
  ]);

  return (
    <>
      <Nav />
      <SearchResults
        hotels={result.hotels}
        pagination={result.pagination}
        loadError={Boolean(result.error)}
        cities={cities}
        perPage={PER_PAGE}
        initialFilters={{ q, city, stars, sort, maxPrice, minPrice, tags, ai, page }}
      />
      <Footer />
      <WhatsAppButton />
    </>
  );
}
