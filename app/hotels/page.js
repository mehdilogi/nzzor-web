import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import WhatsAppButton from "../../components/WhatsAppButton";
import SearchResults from "../../components/SearchResults";
import { getHotelsPaged, getCities } from "../../lib/api";

const SITE = "https://nzzor.com";

// French, like the rest of the indexed site. No hotel count in the copy: a
// number embedded here goes stale silently, and this string is what Google
// indexes.
//
// Indexing rules, so Google sees one page per intent instead of thousands of
// filter combinations:
//   /hotels (and ?page=N)  → indexed, canonical to itself
//   /hotels?city=setif     → canonical to /hotels/ville/setif, the city page
//                            built for that search
//   any other filter/sort  → noindex, follow (links to hotels still count)
export async function generateMetadata({ searchParams }) {
  const sp = searchParams || {};
  const filterKeys = ["q", "stars", "sort", "maxPrice", "minPrice", "tags", "ai", "checkIn", "checkOut", "adults", "rooms", "children", "guests", "occ"];
  const hasFilters = filterKeys.some((k) => sp[k]);
  const city = sp.city ? String(sp.city).toLowerCase() : "";
  const page = Math.max(1, parseInt(sp.page, 10) || 1);

  const base = {
    title: "Hôtels en Algérie — réservation en ligne, paiement CIB et Edahabia | Nzzor",
    description:
      "Hôtels vérifiés dans toute l'Algérie : comparez les prix par wilaya, réservez en ligne par carte CIB ou Edahabia avec confirmation immédiate. Nzzor, agence de voyage agréée.",
    openGraph: { type: "website", siteName: "Nzzor", locale: "fr_DZ", images: [`${SITE}/og.jpg`] },
  };

  if (city && !hasFilters) {
    const slug = city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return { ...base, alternates: { canonical: `${SITE}/hotels/ville/${slug}` } };
  }
  if (city || hasFilters) {
    return { ...base, robots: { index: false, follow: true } };
  }
  return { ...base, alternates: { canonical: page > 1 ? `${SITE}/hotels?page=${page}` : `${SITE}/hotels` } };
}

// 24 = eight clean rows at three across.
const PER_PAGE = 24;

// Counts for every filter option, for the current filter set. Fetched here
// rather than in the client so the sidebar renders with its numbers already
// in place — a column of options that acquires counts a moment after paint
// looks broken, and it would be a second waterfall on a slow connection.
//
// A failure must never blank the page: the sidebar degrades to showing no
// counts, which is exactly how it behaved before this endpoint existed.
async function fetchFacets(searchParams) {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  if (!base) {
    console.error("[hotels] NEXT_PUBLIC_API_URL is not set — no facet counts");
    return null;
  }
  const params = new URLSearchParams();
  for (const key of ["q", "city", "stars", "minPrice", "maxPrice", "tags"]) {
    if (searchParams?.[key]) params.set(key, String(searchParams[key]));
  }
  try {
    const res = await fetch(`${base}/api/hotels/meta/facets?${params.toString()}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json", "User-Agent": "nzzor-web/hotels" },
    });
    if (!res.ok) {
      console.error(`[hotels] facets returned HTTP ${res.status}`);
      return null;
    }
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error("[hotels] facets fetch failed:", err.message);
    return null;
  }
}

export default async function HotelsPage({ searchParams }) {
  const q = searchParams?.q || "";
  const city = searchParams?.city || "";
  const stars = searchParams?.stars || "";
  const sort = searchParams?.sort || "";
  const maxPrice = searchParams?.maxPrice || "";
  const minPrice = searchParams?.minPrice || "";
  const tags = searchParams?.tags || "";
  const ai = searchParams?.ai === "1";

  // Booking context. Not filters — getHotelsPaged takes no dates — but the
  // listing now lets the guest see and change them, and HotelCard forwards
  // them to the hotel page so occupancy and dates survive through to booking.
  const checkIn = searchParams?.checkIn || "";
  const checkOut = searchParams?.checkOut || "";
  const adultsParam = searchParams?.adults || "";
  const roomsParam = searchParams?.rooms || "";

  // `page` stays a real server-rendered URL even though the UI uses a "show
  // more" button. Google crawls /hotels?page=4; it does not click buttons.
  const page = Math.max(1, parseInt(searchParams?.page, 10) || 1);

  // Every filter goes to the API. This page previously fetched a fixed 50 rows
  // and SearchResults filtered that array in the browser, so any hotel outside
  // the top 50 by popularity could not be reached at all.
  const [result, cities, facets] = await Promise.all([
    getHotelsPaged({
      lang: "en",
      q: ai ? "" : q,
      city, stars, sort, maxPrice, minPrice, tags,
      page,
      limit: PER_PAGE,
    }),
    getCities({ lang: "en" }),
    fetchFacets(searchParams),
  ]);

  return (
    <>
      <Nav />
      <SearchResults
        hotels={result.hotels}
        pagination={result.pagination}
        loadError={Boolean(result.error)}
        cities={cities}
        facets={facets}
        perPage={PER_PAGE}
        initialFilters={{
          q, city, stars, sort, maxPrice, minPrice, tags, ai, page,
          checkIn, checkOut, adults: adultsParam, rooms: roomsParam,
        }}
      />
      <Footer />
      <WhatsAppButton />
    </>
  );
}
