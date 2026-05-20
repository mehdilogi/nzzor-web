// =============================================================================
// Nzzor — Partner API client
// Used by the hotel-facing portal at /partner. Tokens are kept under a
// separate key from the admin token so an admin can be logged into /admin and
// not collide with a partner test login on the same browser.
// =============================================================================

const API = process.env.NEXT_PUBLIC_API_URL || "";
const TOKEN_KEY = "nzzor_partner_token";

export function getPartnerToken() {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setPartnerToken(t) {
  try { window.localStorage.setItem(TOKEN_KEY, t); } catch {}
}
export function clearPartnerToken() {
  try { window.localStorage.removeItem(TOKEN_KEY); } catch {}
}

async function partnerFetch(path, init = {}) {
  const token = getPartnerToken();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

// ---- AUTH ---------------------------------------------------------------
// We reuse the existing /api/auth/login endpoint (same JWT mechanism).
export async function partnerLogin(email, password) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Login failed");
  if (!["HOTEL_MANAGER", "ADMIN", "SUPER_ADMIN"].includes(json.user?.role)) {
    throw new Error("This account is not a hotel partner");
  }
  setPartnerToken(json.accessToken);
  return json.user;
}

// ---- PARTNER ENDPOINTS --------------------------------------------------
export async function partnerMe() {
  const j = await partnerFetch("/api/partner/me");
  return j.data;
}
export async function partnerBookings(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const j = await partnerFetch(`/api/partner/bookings${qs ? `?${qs}` : ""}`);
  return j.data;
}
export async function partnerBookingDetail(id) {
  const j = await partnerFetch(`/api/partner/bookings/${id}`);
  return j.data;
}
export async function partnerConfirmBooking(id) {
  const j = await partnerFetch(`/api/partner/bookings/${id}/confirm`, { method: "POST" });
  return j.data;
}
export async function partnerRejectBooking(id, reason) {
  const j = await partnerFetch(`/api/partner/bookings/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  return j.data;
}
export async function partnerAvailability(hotelId, from, to) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  const j = await partnerFetch(`/api/partner/availability/${hotelId}${qs ? `?${qs}` : ""}`);
  return j.data;
}
export async function partnerSetAvailability(hotelId, { dates, isClosed, note }) {
  const j = await partnerFetch(`/api/partner/availability/${hotelId}`, {
    method: "POST",
    body: JSON.stringify({ dates, isClosed, note }),
  });
  return j;
}
