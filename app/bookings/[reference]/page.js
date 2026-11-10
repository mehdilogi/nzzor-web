import { redirect } from "next/navigation";

// =============================================================================
// /bookings/NZR-XXXX-XXXX — the "View booking online" link in every email
// -----------------------------------------------------------------------------
// The emails have always linked here, but the page never existed, so every
// customer who clicked got Next.js's 404. This route looks the booking up and
// hands off to /booking/result, which already renders the outcome and, for a
// paid booking, the receipt from the database.
//
// It only reads the public status endpoint (reference, status, payment status,
// total). Nothing here can change a booking.
// =============================================================================

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

const REF_RE = /^NZR-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

async function fetchStatus(reference) {
  const base = process.env.NEXT_PUBLIC_API_URL || "https://api.nzzor.com";
  try {
    const res = await fetch(base + "/api/payments/satim/status/" + reference, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json && (json.data || json);
  } catch (err) {
    console.error("[bookings] status lookup failed for " + reference + ":", err.message);
    return null;
  }
}

export default async function BookingLinkPage({ params, searchParams }) {
  const reference = String(params?.reference || "").toUpperCase();
  const langRaw = String(searchParams?.lang || "fr").toLowerCase();
  const lang = ["fr", "en", "ar"].includes(langRaw) ? langRaw : "fr";

  if (!REF_RE.test(reference)) redirect("/");

  const b = await fetchStatus(reference);

  let status = "unknown";
  if (b) {
    const pay = String(b.paymentStatus || "").toUpperCase();
    const st = String(b.status || "").toUpperCase();
    if (pay === "PAID") status = "paid";
    else if (["CANCELLED", "EXPIRED", "PAYMENT_FAILED"].includes(st) || pay === "FAILED") status = "failed";
    else status = "pending";
  }

  redirect(
    "/booking/result?ref=" + encodeURIComponent(reference) +
      "&status=" + status +
      "&lang=" + lang
  );
}
