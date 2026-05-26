// =============================================================================
// Nzzor — Date helpers (Algeria-local, client side)
// -----------------------------------------------------------------------------
// Mirror of api/src/utils/dates.js so the frontend can validate using the
// same reference timezone as the backend. Without this, a user in Brazil
// with a clock 5 hours behind Algeria could see "today" differently from
// the server and get confusing "date is in the past" errors for what their
// local calendar still calls today.
//
// Same contract as the backend module: work in YYYY-MM-DD strings, never
// raw Date objects. ISO strings sort the right way and sidestep every
// timezone bug.
// =============================================================================

const ALGIERS_ZONE = "Africa/Algiers";

// Lazy formatter — only built once, on first call, so SSR doesn't pay for it
// during pages that don't use date validation.
let _fmt = null;
function getFmt() {
  if (_fmt) return _fmt;
  _fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: ALGIERS_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return _fmt;
}

/** Today in Algiers as "YYYY-MM-DD". */
export function todayInAlgiers() {
  return getFmt().format(new Date());
}

/** True iff `dateStr` is strictly earlier than today in Algiers. */
export function isPastDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return false;
  return dateStr < todayInAlgiers();
}

/**
 * Validate check-in / check-out. Returns null if OK, or a structured
 * { code, message } error matching the backend's contract.
 */
export function validateBookingDates(checkIn, checkOut, { maxNights = 30 } = {}) {
  if (isPastDate(checkIn)) {
    return { code: "CHECKIN_IN_PAST", message: "Check-in date is in the past." };
  }
  if (!checkOut || checkOut <= checkIn) {
    return { code: "CHECKOUT_NOT_AFTER_CHECKIN", message: "Check-out must be after check-in." };
  }
  const nights = Math.ceil(
    (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
  );
  if (nights > maxNights) {
    return { code: "STAY_TOO_LONG", message: `Maximum stay is ${maxNights} nights.` };
  }
  return null;
}

/**
 * Convert an error CODE from the backend or local validator into a localized
 * string. The frontend uses this when displaying errors so the user sees
 * messages in their selected language.
 *
 * Pass the t() function from your LangContext as the second arg; it will look
 * up `errors.dates.<code>` from the strings table. If the key is missing,
 * we fall back to the English message that came with the error.
 */
export function localizeDateError(error, t) {
  if (!error) return "";
  const key = `errors.dates.${error.code}`;
  const localized = t ? t(key) : null;
  // Defensive: t() returning the key itself means "not found in strings table"
  if (!localized || localized === key) return error.message;
  return localized;
}
