// =============================================================================
// Nzzor — API Client
// One place that talks to the Nzzor backend API.
// If the API is unreachable (or NEXT_PUBLIC_API_URL is unset), it transparently
// falls back to mock data so the site always renders.
// =============================================================================

import { MOCK_HOTELS, MOCK_CITIES } from "./mockData";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Low-level fetch with a short timeout so a dead API never hangs the page
async function apiFetch(path, options = {}) {
  if (!API_URL) throw new Error("no-api");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      // Backend returns { error: "...", code: "..." } for structured errors.
      // We attach both to the thrown Error so callers can localize by code.
      const err = new Error(body.error || `API error ${res.status}`);
      if (body.code) err.code = body.code;
      err.status = res.status;
      throw err;
    }
    return res.json();
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// HOTELS
// ---------------------------------------------------------------------------

// Get all hotels, optionally filtered. Falls back to mock data.
export async function getHotels({ lang = "en", city, stars, q, featured, sort, maxPrice, minPrice } = {}) {
  try {
    const params = new URLSearchParams({ lang, limit: "50" });
    if (city) params.set("city", city);
    if (stars) params.set("stars", String(stars));
    if (q) params.set("q", q);
    if (featured) params.set("featured", "true");
    if (sort) params.set("sort", sort);
    if (maxPrice) params.set("maxPrice", String(maxPrice));
    if (minPrice) params.set("minPrice", String(minPrice));
    const json = await apiFetch(`/api/hotels?${params.toString()}`);
    return json.data || [];
  } catch {
    // ---- mock fallback ----
    let list = [...MOCK_HOTELS];
    if (city) list = list.filter((h) => h.city.toLowerCase() === city.toLowerCase());
    if (stars) list = list.filter((h) => h.stars >= Number(stars));
    if (featured) list = list.filter((h) => h.isFeatured);
    if (maxPrice) list = list.filter((h) => h.priceFrom <= Number(maxPrice));
    if (minPrice) list = list.filter((h) => h.priceFrom >= Number(minPrice));
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter(
        (h) => h.name.toLowerCase().includes(needle) || h.city.toLowerCase().includes(needle)
      );
    }
    if (sort === "price_asc") list.sort((a, b) => a.priceFrom - b.priceFrom);
    else if (sort === "price_desc") list.sort((a, b) => b.priceFrom - a.priceFrom);
    else if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    else if (sort === "stars") list.sort((a, b) => b.stars - a.stars);
    else list.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.reviewCount - a.reviewCount);
    return list;
  }
}

// Get featured hotels for the homepage
export async function getFeaturedHotels({ lang = "en" } = {}) {
  const all = await getHotels({ lang, featured: true, sort: "rating" });
  return all.slice(0, 6);
}

// Get a single hotel by slug. Falls back to mock data.
export async function getHotel(slug, { lang = "en" } = {}) {
  try {
    const json = await apiFetch(`/api/hotels/${slug}?lang=${lang}`);
    return json.data || null;
  } catch {
    return MOCK_HOTELS.find((h) => h.slug === slug) || null;
  }
}

// Get the list of cities. Falls back to mock data.
export async function getCities({ lang = "en" } = {}) {
  try {
    const json = await apiFetch(`/api/hotels/meta/cities?lang=${lang}`);
    return json.data || [];
  } catch {
    return MOCK_CITIES;
  }
}

// ---------------------------------------------------------------------------
// BOOKINGS
// ---------------------------------------------------------------------------

// Create a booking. Returns { ok, data?, error?, code? }.
// On API error, both `error` (message) and `code` (structured key) are
// returned so the UI can localize via the strings table.
export async function createBooking(payload) {
  try {
    const json = await apiFetch(`/api/bookings`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { ok: true, data: json.data };
  } catch (err) {
    if (err.message === "no-api") {
      // Demo mode: synthesize a confirmation so the flow is testable
      // locally without a backend running. This is the ONLY synthetic
      // booking reference path — when the API is reachable but returns
      // an error, we surface that error properly (never invent a ref).
      const ref =
        "NZR-" +
        Math.random().toString(36).slice(2, 6).toUpperCase() +
        "-" +
        Math.random().toString(36).slice(2, 6).toUpperCase();
      return { ok: true, data: { reference: ref, status: "CONFIRMED", demo: true } };
    }
    return { ok: false, error: err.message, code: err.code };
  }
}

// Look up a booking by reference
export async function getBooking(reference, { lang = "en" } = {}) {
  try {
    const json = await apiFetch(`/api/bookings/${reference}?lang=${lang}`);
    return json.data || null;
  } catch {
    return null;
  }
}

// Whether the real API is configured (useful for showing a demo-mode notice)
export const apiConfigured = Boolean(API_URL);
