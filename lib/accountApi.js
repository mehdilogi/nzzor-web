// =============================================================================
// Nzzor — Account API client
// Customer auth + profile + my-bookings. Token under its own key so it
// doesn't collide with admin or partner sessions on the same browser.
// =============================================================================

const API = process.env.NEXT_PUBLIC_API_URL || "";
const TOKEN_KEY = "nzzor_user_token";

export function getUserToken() {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setUserToken(t) {
  try { window.localStorage.setItem(TOKEN_KEY, t); } catch {}
}
export function clearUserToken() {
  try { window.localStorage.removeItem(TOKEN_KEY); } catch {}
}

async function accountFetch(path, init = {}) {
  const token = getUserToken();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Attach the backend's structured error fields so callers can switch
    // on `.code` (e.g. WITHIN_CANCELLATION_WINDOW) or `.status` instead of
    // string-matching on the message.
    const err = new Error(formatErr(json.error) || `Request failed (${res.status})`);
    if (json.code) err.code = json.code;
    err.status = res.status;
    // Preserve any extra context fields the route returns (e.g.
    // hoursUntilCheckIn) so the UI can show specific copy.
    err.details = json;
    throw err;
  }
  return json;
}

function formatErr(err) {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (Array.isArray(err)) {
    return err.map((it) => {
      if (typeof it === "string") return it;
      const path = Array.isArray(it.path) && it.path.length ? `${it.path.join(".")}: ` : "";
      return `${path}${it.message || "Invalid value"}`;
    }).join(" · ");
  }
  if (typeof err === "object" && err.message) return err.message;
  try { return JSON.stringify(err); } catch { return "Request failed"; }
}

// ---- AUTH ---------------------------------------------------------------
export async function userRegister(payload) {
  const res = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatErr(json.error) || "Sign-up failed");
  setUserToken(json.data.accessToken);
  return json.data.user;
}

export async function userLogin(email, password) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatErr(json.error) || "Sign-in failed");
  setUserToken(json.data.accessToken);
  return json.data.user;
}

export async function userMe() {
  const j = await accountFetch("/api/auth/me");
  return j.data;
}

export async function userUpdateProfile(payload) {
  const j = await accountFetch("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return j.data;
}

export async function userChangePassword(currentPassword, newPassword) {
  return accountFetch("/api/auth/me/password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// ---- PASSWORD RESET (two-step) ------------------------------------------
// Step 1: request a reset link by email. Always returns 200 from the
// backend regardless of whether the email is registered (prevents
// enumeration). The UI shows the same "check your email" message either
// way.
export async function userRequestPasswordReset(email, lang = "fr") {
  const res = await fetch(`${API}/api/auth/password-reset/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, lang }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatErr(json.error) || "Request failed");
  return json;
}

// Step 2: confirm the reset by submitting the token from the email link
// plus the new password. The backend returns the same shape on any
// failure (invalid/expired token, etc.) so we don't leak state.
export async function userConfirmPasswordReset(token, newPassword) {
  const res = await fetch(`${API}/api/auth/password-reset/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(formatErr(json.error) || "Request failed");
    err.code = json.code;
    throw err;
  }
  return json;
}

// ---- MY BOOKINGS --------------------------------------------------------
export async function myBookings(lang = "en") {
  const j = await accountFetch(`/api/account/bookings?lang=${lang}`);
  return j.data;
}

export async function myBookingDetail(id, lang = "en") {
  const j = await accountFetch(`/api/account/bookings/${id}?lang=${lang}`);
  return j.data;
}

// Customer self-cancellation. Backend enforces:
//   - ownership (booking belongs to current user OR same email)
//   - cancellable state (PENDING or CONFIRMED only)
//   - 48-hour window before check-in
// On failure, the thrown Error has `.code` (e.g. "WITHIN_CANCELLATION_WINDOW")
// and `.details` (e.g. { hoursUntilCheckIn: 12.3 }) so the UI can render a
// specific message + support-contact CTA.
export async function cancelMyBooking(id, reason) {
  const j = await accountFetch(`/api/account/bookings/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify(reason ? { reason } : {}),
  });
  return j.data;
}
