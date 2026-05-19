// =============================================================================
// Nzzor — Coupons  (Delivery 1: starter list)
//
// A simple coupon list so the promo-code field works end to end and is
// testable now. In Delivery 3 this is replaced by a managed coupon system
// in the admin dashboard (create/expire codes, usage limits, loyalty codes).
//
// Two discount types are supported:
//   { type: "percent", value: 10 }  -> 10% off
//   { type: "fixed",   value: 2000 } -> 2000 DZD off
// =============================================================================

const COUPONS = {
  WELCOME10:  { type: "percent", value: 10, label: "Welcome -10%" },
  NZZOR15:    { type: "percent", value: 15, label: "Nzzor -15%" },
  SUMMER2000: { type: "fixed",   value: 2000, label: "Summer -2000 DZD" },
  ALLOUNI5:   { type: "percent", value: 5,  label: "Allouni -5%" },
};

// Validate a code. Returns the coupon object, or null if unknown.
export function validateCoupon(code) {
  if (!code) return null;
  const key = String(code).trim().toUpperCase();
  const coupon = COUPONS[key];
  return coupon ? { code: key, ...coupon } : null;
}

// Compute the discount amount (in DZD) a coupon applies to a subtotal.
export function couponDiscount(coupon, subtotal) {
  if (!coupon || !subtotal) return 0;
  let amount = 0;
  if (coupon.type === "percent") {
    amount = Math.round((subtotal * coupon.value) / 100);
  } else if (coupon.type === "fixed") {
    amount = coupon.value;
  }
  // never discount below zero
  return Math.min(amount, subtotal);
}
