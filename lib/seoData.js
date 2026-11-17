// =============================================================================
// lib/seoData.js — server-side data for the SEO surfaces
// -----------------------------------------------------------------------------
// The interface follows the visitor's language on the client, but Google reads
// the server HTML, which is French. To rank for Arabic searches too
// ("فندق الهضاب سطيف"), the SEO blocks fetch the hotel in French AND Arabic and
// print both. Cached for an hour like the sitemap.
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

export async function getHotelLangs(slug) {
  const s = encodeURIComponent(slug);
  const [fr, ar, en] = await Promise.all([
    get(`/api/hotels/${s}?lang=fr`),
    get(`/api/hotels/${s}?lang=ar`),
    get(`/api/hotels/${s}?lang=en`),
  ]);
  if (!fr) return null;
  return { fr: fr.data, ar: ar ? ar.data : null, en: en ? en.data : null };
}

export async function getCities() {
  const j = await get(`/api/hotels/meta/cities?lang=fr`);
  return (j && j.data) || [];
}

// Match a hotel's localized French city name back to its city key.
export async function cityFor(cityNameFr) {
  const cities = await getCities();
  const norm = (v) => String(v || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  return cities.find((c) => norm(c.nameFr) === norm(cityNameFr) || norm(c.nameEn) === norm(cityNameFr) || norm(c.key) === norm(cityNameFr)) || null;
}

export async function getCityHotels(cityKey, lang = "fr") {
  const j = await get(`/api/hotels?city=${encodeURIComponent(cityKey)}&limit=200&lang=${lang}`);
  return (j && j.data) || [];
}

export const fmtDA = (n) =>
  new Intl.NumberFormat("fr-FR").format(Math.round(Number(n) || 0)).replace(/[  ]/g, " ");
