// =============================================================================
// Nzzor — formatting helpers
// =============================================================================

export function formatPrice(amount) {
  return Number(amount || 0).toLocaleString("en") + " DZD";
}

export function formatPriceShort(amount) {
  return Number(amount || 0).toLocaleString("en");
}

export function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  const diff = Math.ceil((b - a) / 86400000);
  return diff > 0 ? diff : 0;
}

export function ratingLabel(rating) {
  if (rating >= 9) return "Exceptional";
  if (rating >= 8.5) return "Excellent";
  if (rating >= 8) return "Very good";
  if (rating >= 7) return "Good";
  return "Pleasant";
}
