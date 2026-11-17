// =============================================================================
// lib/seoData.js — server-side data for the SEO surfaces (city pages, the
// practical-info block under each hotel, the sitemap)
// -----------------------------------------------------------------------------
// Cached for an hour like the sitemap.
//
// CITY GROUPS. The cities endpoint groups hotels by (key, cityEn, cityFr,
// cityAr), so one wilaya typed two ways in the admin ("Setif" / "Sétif",
// "Béni Abbès" / "Beni Abbes") comes back as two rows, and showed up twice in
// "Hôtels dans les autres villes". Here rows are merged by the slug of their
// French name: one entry per wilaya, its hotel counts added up, the most used
// spelling kept, and every database key remembered so the city page lists the
// hotels of all the variants.
// =============================================================================

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.nzzor.com";
const HOUR = { next: { revalidate: 3600 } };

async function get(path) {
  try {
    const res = await fetch(API + path, HOUR);
    if (!res.ok) return null;
    const j = await res.json();
    return j && j.data !== undefined ? j : null;
  } catch {
    return null;
  }
}

// "tizi ouzou" → "tizi-ouzou", "Béjaïa" → "bejaia". Spaces are not valid in a
// sitemap URL, and Google rejected the whole file over one.
export const citySlug = (v) =>
  String(v || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const cityPath = (g) => `/hotels/ville/${g.slug}`;

export const fmtDA = (n) =>
  new Intl.NumberFormat("fr-FR").format(Math.round(Number(n) || 0)).replace(/[  ]/g, " ");

export async function getHotelLangs(slug) {
  const s = encodeURIComponent(slug);
  const [fr, ar, en] = await Promise.all([
    get(`/api/hotels/${s}?lang=fr`),
    get(`/api/hotels/${s}?lang=ar`),
    get(`/api/hotels/${s}?lang=en`),
  ]);
  if (!fr) return null;
  return { fr: fr.data, ar: ar ? ar.data : fr.data, en: en ? en.data : fr.data };
}

// One entry per wilaya: { slug, keys[], nameFr, nameAr, nameEn, hotelCount }
export async function getCityGroups() {
  const j = await get(`/api/hotels/meta/cities?lang=fr`);
  const rows = (j && j.data) || [];
  const groups = new Map();
  for (const r of rows) {
    if (!r || !r.key || !(r.hotelCount > 0)) continue;
    const slug = citySlug(r.nameFr || r.key);
    if (!slug) continue;
    const g = groups.get(slug) || { slug, keys: [], hotelCount: 0, best: -1 };
    if (!g.keys.includes(r.key)) g.keys.push(r.key);
    g.hotelCount += r.hotelCount;
    if (r.hotelCount > g.best) {
      g.best = r.hotelCount;
      g.nameFr = r.nameFr || r.nameEn || r.key;
      g.nameEn = r.nameEn || g.nameFr;
      g.nameAr = r.nameAr || g.nameFr;
    }
    groups.set(slug, g);
  }
  return [...groups.values()]
    .map(({ best, ...g }) => g)
    .sort((a, b) => b.hotelCount - a.hotelCount);
}

// Find a wilaya from a URL segment, a database key or a city name in any form.
export async function findCityGroup(value) {
  let v = String(value || "");
  try { v = decodeURIComponent(v); } catch {}
  const want = citySlug(v);
  if (!want) return null;
  const groups = await getCityGroups();
  return (
    groups.find((g) => g.slug === want) ||
    groups.find((g) => g.keys.some((k) => citySlug(k) === want)) ||
    groups.find((g) => citySlug(g.nameEn) === want) ||
    null
  );
}

// All hotels of a wilaya, across every key it was saved under.
export async function getGroupHotels(group, lang = "fr") {
  const lists = await Promise.all(
    group.keys.map((k) => get(`/api/hotels?city=${encodeURIComponent(k)}&limit=200&lang=${lang}`))
  );
  const seen = new Set();
  const out = [];
  for (const j of lists) {
    for (const h of (j && j.data) || []) {
      if (!h || seen.has(h.slug)) continue;
      seen.add(h.slug);
      out.push(h);
    }
  }
  return out;
}

// Hotels of a wilaya with their name in each language, for the city page and
// the "other hotels" links: [{ slug, name: {fr, ar, en}, stars, priceFrom, … }]
export async function getGroupHotelsAllLangs(group) {
  const [fr, ar, en] = await Promise.all([
    getGroupHotels(group, "fr"),
    getGroupHotels(group, "ar"),
    getGroupHotels(group, "en"),
  ]);
  const arBy = Object.fromEntries(ar.map((h) => [h.slug, h.name]));
  const enBy = Object.fromEntries(en.map((h) => [h.slug, h.name]));
  return fr.map((h) => ({
    slug: h.slug,
    name: { fr: h.name, ar: arBy[h.slug] || h.name, en: enBy[h.slug] || h.name },
    stars: h.stars,
    priceFrom: h.priceFrom,
    onlineBooking: h.onlineBooking !== false,
    primaryPhoto: h.primaryPhoto || null,
  }));
}
