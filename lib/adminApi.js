// =============================================================================
// Nzzor — Admin API Client
// Authenticated calls for the /admin dashboard. Token stored in memory + a
// short-lived cookie-free approach: we keep it in localStorage on the client.
// =============================================================================

"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const TOKEN_KEY = "nzzor_admin_token";

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(t) {
  if (typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY);
}

// authenticated fetch
async function authFetch(path, options = {}) {
  if (!API_URL) throw new Error("API not configured. Set NEXT_PUBLIC_API_URL.");
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(body.error || `Error ${res.status}`);
    e.status = res.status;
    e.details = body.details;
    throw e;
  }
  return body;
}

// ---- AUTH ----
export async function adminLogin(email, password) {
  const json = await authFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const { user, accessToken } = json.data;
  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    throw new Error("This account does not have admin access.");
  }
  setToken(accessToken);
  return user;
}

export async function adminMe() {
  const json = await authFetch("/api/auth/me");
  return json.data;
}

// ---- DASHBOARD ----
export async function adminDashboard() {
  const json = await authFetch("/api/admin/dashboard");
  return json.data;
}

// ---- BOOKINGS ----
export async function adminBookings(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const json = await authFetch(`/api/admin/bookings${qs ? `?${qs}` : ""}`);
  return json;
}
export async function adminBookingDetail(id) {
  const json = await authFetch(`/api/admin/bookings/${id}`);
  return json.data;
}
export async function adminUpdateBookingStatus(id, status) {
  const json = await authFetch(`/api/admin/bookings/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return json.data;
}

// ---- HOTEL PARTNER USERS (managed from admin) ----
export async function adminHotelManagers(hotelId) {
  const json = await authFetch(`/api/admin/hotels/${hotelId}/managers`);
  return json.data;
}
export async function adminAddHotelManager(hotelId, payload) {
  const json = await authFetch(`/api/admin/hotels/${hotelId}/managers`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return json.data;
}
export async function adminRemoveHotelManager(hotelId, userId) {
  const json = await authFetch(`/api/admin/hotels/${hotelId}/managers/${userId}`, {
    method: "DELETE",
  });
  return json;
}

// ---- HOTELS ----
export async function adminHotels() {
  const json = await authFetch("/api/admin/hotels");
  return json.data;
}
export async function adminHotel(id) {
  const json = await authFetch(`/api/admin/hotels/${id}`);
  return json.data;
}
export async function adminCreateHotel(data) {
  const json = await authFetch("/api/admin/hotels", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return json.data;
}
export async function adminUpdateHotel(id, data) {
  const json = await authFetch(`/api/admin/hotels/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return json.data;
}
export async function adminDeleteHotel(id) {
  return authFetch(`/api/admin/hotels/${id}`, { method: "DELETE" });
}

// ---- ROOMS ----
export async function adminAddRoom(hotelId, data) {
  const json = await authFetch(`/api/admin/hotels/${hotelId}/rooms`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return json.data;
}
export async function adminUpdateRoom(roomId, data) {
  const json = await authFetch(`/api/admin/rooms/${roomId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return json.data;
}
export async function adminDeleteRoom(roomId) {
  return authFetch(`/api/admin/rooms/${roomId}`, { method: "DELETE" });
}

// ---- PHOTOS ----
export async function adminAddPhoto(hotelId, url, isPrimary = false) {
  const json = await authFetch(`/api/admin/hotels/${hotelId}/photos`, {
    method: "POST",
    body: JSON.stringify({ url, isPrimary }),
  });
  return json.data;
}
export async function adminDeletePhoto(photoId) {
  return authFetch(`/api/admin/photos/${photoId}`, { method: "DELETE" });
}

// ---- AMENITIES ----
export async function adminAmenities() {
  const json = await authFetch("/api/admin/amenities");
  return json.data;
}
export async function adminSetHotelAmenities(hotelId, keys) {
  return authFetch(`/api/admin/hotels/${hotelId}/amenities`, {
    method: "PUT",
    body: JSON.stringify({ keys }),
  });
}
