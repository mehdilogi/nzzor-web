// app/sitemap.js — served at https://nzzor.com/sitemap.xml
// Lists the homepage, /hotels, /terms and every hotel page.
// Rebuilt at most once an hour, so new hotels appear without a redeploy.

export const revalidate = 3600;

const SITE = "https://nzzor.com";
const API = process.env.NEXT_PUBLIC_API_URL || "https://api.nzzor.com";

async function fetchAllHotels() {
  const hotels = [];
  let page = 1;
  let totalPages = 1;
  do {
    try {
      const res = await fetch(API + "/api/hotels?limit=200&page=" + page, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) break;
      const json = await res.json();
      hotels.push(...(json.data || []));
      totalPages = (json.pagination && json.pagination.totalPages) || 1;
    } catch (e) {
      break;
    }
    page += 1;
  } while (page <= totalPages && page <= 20);
  return hotels;
}

export default async function sitemap() {
  const now = new Date();
  const hotels = await fetchAllHotels();

  const staticPages = [
    { url: SITE + "/", changeFrequency: "daily", priority: 1 },
    { url: SITE + "/hotels", changeFrequency: "daily", priority: 0.9 },
    { url: SITE + "/terms", changeFrequency: "yearly", priority: 0.2 },
    { url: SITE + "/faq", changeFrequency: "monthly", priority: 0.4 },
    { url: SITE + "/contact", changeFrequency: "yearly", priority: 0.4 },
    { url: SITE + "/privacy", changeFrequency: "yearly", priority: 0.2 },
  ].map((p) => ({ ...p, lastModified: now }));

  const hotelPages = hotels
    .filter((h) => h && h.slug)
    .map((h) => ({
      url: SITE + "/hotels/" + h.slug,
      lastModified: h.updatedAt ? new Date(h.updatedAt) : now,
      changeFrequency: "weekly",
      // Bookable hotels first in Google's eyes
      priority: h.priceFrom != null ? 0.8 : 0.5,
    }));

  return [...staticPages, ...hotelPages];
}
