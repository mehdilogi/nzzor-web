import Nav from "../../../components/Nav";
import Footer from "../../../components/Footer";
import PaymentReceipt from "../../../components/PaymentReceipt";

// =============================================================================
// /booking/result — where the customer lands after a SATIM payment attempt
// -----------------------------------------------------------------------------
// The API's return/fail handlers confirm the payment server-side and THEN
// redirect here with the settled outcome:
//
//   /booking/result?ref=NZR-XXXX-XXXX&status=paid|failed|pending|unknown
//                  &msg=...&rc=TRANSACTION_REJECTED&lang=fr
//
// This page only reports. It never contacts SATIM and never decides anything:
// by the time the browser arrives, the money question is already answered in
// the database. Do not add gateway calls here — the whole point of the design
// is that a page whose URL the customer can edit has no authority over payment
// state.
//
// It does fetch the receipt from our own API, server-side, so the eight fields
// SATIM grades come from the database rather than from the query string. A
// customer editing ?status=paid gets the "paid" heading with no receipt body,
// because there is no PAID payment row to render.
// =============================================================================

export const metadata = {
  title: "Payment result — Nzzor",
  robots: { index: false, follow: false },
};

// Always render fresh: a receipt cached at the edge could show one customer's
// transaction to another, and a "pending" page must reflect the current state
// on every refresh.
export const dynamic = "force-dynamic";

async function fetchReceipt(reference) {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  if (!base || !reference) return null;
  try {
    const res = await fetch(`${base}/api/payments/satim/receipt/${reference}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    // A receipt we cannot load must not blank the page — the customer still
    // needs to see the outcome and their reference.
    return null;
  }
}

export default async function BookingResultPage({ searchParams }) {
  const rawStatus = String(searchParams?.status || "unknown").toLowerCase();
  const status = ["paid", "failed", "pending", "unknown"].includes(rawStatus)
    ? rawStatus
    : "unknown";
  const reference = searchParams?.ref ? String(searchParams.ref).toUpperCase() : null;

  const langParam = String(searchParams?.lang || "fr").toLowerCase();
  const lang = ["ar", "fr", "en"].includes(langParam) ? langParam : "fr";

  const message = searchParams?.msg ? String(searchParams.msg).slice(0, 300) : null;
  const rejectionCode = searchParams?.rc ? String(searchParams.rc).slice(0, 40) : null;

  // Only load the receipt when the payment actually went through. Trust the
  // database, not the query string: if `paid` is not true server-side, the
  // receipt body simply does not render.
  const receiptData = status === "paid" ? await fetchReceipt(reference) : null;
  const receipt = receiptData && receiptData.paid ? receiptData : null;

  return (
    <>
      <div className="no-print">
        <Nav />
      </div>
      <PaymentReceipt
        status={status}
        reference={reference}
        message={message}
        rejectionCode={rejectionCode}
        lang={lang}
        receipt={receipt}
      />
      <div className="no-print">
        <Footer />
      </div>
    </>
  );
}
