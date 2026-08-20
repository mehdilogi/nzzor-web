import Link from "next/link";
import Nav from "../../../components/Nav";
import Footer from "../../../components/Footer";

// =============================================================================
// /booking/result — where the customer lands after a SATIM payment attempt
// -----------------------------------------------------------------------------
// The API's return/fail handlers confirm the payment server-side and THEN
// redirect here with the settled outcome:
//
//   /booking/result?ref=NZR-XXXX-XXXX&status=paid|failed|pending|unknown&msg=...
//
// This page therefore only reports. It never contacts SATIM and never decides
// anything: by the time the browser arrives, the money question is already
// answered in the database. Do not add gateway calls here — the whole point of
// the design is that a page the customer can edit the URL of has no authority
// over payment state.
//
// Deliberately a server component with no styled-jsx: this is the single page
// a customer sees immediately after being charged, so it has the fewest moving
// parts of anything in the app. Colours are literal design-system hex values
// rather than CSS variables so it renders correctly even if a stylesheet fails.
// =============================================================================

const INK = "#16161A";
const CREAM = "#FAF8F4";
const RED = "#E63946";
const TEAL = "#1B8A5A";
const AMBER = "#B4801A";
const GRAY = "#6B6B75";

export const metadata = {
  title: "Payment result — Nzzor",
  robots: { index: false, follow: false },
};

const STRINGS = {
  en: {
    paid_title: "Payment confirmed",
    paid_sub: "Your booking is confirmed. A confirmation email and voucher are on their way.",
    failed_title: "Payment not completed",
    failed_sub: "Your card was not charged. You can try again with a different card.",
    pending_title: "Confirming your payment",
    pending_sub: "We haven't received a final answer from the bank yet. This usually resolves within a few minutes, and we'll email you as soon as it does.",
    unknown_title: "We couldn't identify this payment",
    unknown_sub: "If you were charged, contact us with your booking reference and we'll sort it out.",
    reference: "Booking reference",
    view_booking: "View my booking",
    try_again: "Try again",
    browse: "Browse hotels",
    contact: "Contact us",
    refresh: "Check again",
    dir: "ltr",
  },
  fr: {
    paid_title: "Paiement confirmé",
    paid_sub: "Votre réservation est confirmée. Un e-mail de confirmation et votre bon sont en route.",
    failed_title: "Paiement non abouti",
    failed_sub: "Votre carte n'a pas été débitée. Vous pouvez réessayer avec une autre carte.",
    pending_title: "Confirmation en cours",
    pending_sub: "Nous n'avons pas encore reçu de réponse définitive de la banque. Cela se résout généralement en quelques minutes, et nous vous enverrons un e-mail dès que ce sera fait.",
    unknown_title: "Paiement introuvable",
    unknown_sub: "Si vous avez été débité, contactez-nous avec votre référence de réservation.",
    reference: "Référence de réservation",
    view_booking: "Voir ma réservation",
    try_again: "Réessayer",
    browse: "Voir les hôtels",
    contact: "Nous contacter",
    refresh: "Vérifier à nouveau",
    dir: "ltr",
  },
  ar: {
    paid_title: "تم تأكيد الدفع",
    paid_sub: "تم تأكيد حجزك. سيصلك بريد التأكيد والقسيمة قريباً.",
    failed_title: "لم يكتمل الدفع",
    failed_sub: "لم يتم خصم أي مبلغ من بطاقتك. يمكنك المحاولة مرة أخرى ببطاقة أخرى.",
    pending_title: "جارٍ تأكيد الدفع",
    pending_sub: "لم نتلقَّ رداً نهائياً من البنك بعد. عادةً ما يتم ذلك خلال دقائق، وسنرسل لك بريداً إلكترونياً فور اكتماله.",
    unknown_title: "تعذّر التعرف على هذه العملية",
    unknown_sub: "إذا تم خصم المبلغ، يرجى التواصل معنا مع رقم الحجز.",
    reference: "رقم الحجز",
    view_booking: "عرض حجزي",
    try_again: "إعادة المحاولة",
    browse: "تصفح الفنادق",
    contact: "اتصل بنا",
    refresh: "تحقق مرة أخرى",
    dir: "rtl",
  },
};

const OUTCOMES = {
  paid: { color: TEAL, glyph: "✓" },
  failed: { color: RED, glyph: "✕" },
  pending: { color: AMBER, glyph: "⋯" },
  unknown: { color: GRAY, glyph: "?" },
};

export default function BookingResultPage({ searchParams }) {
  const rawStatus = String(searchParams?.status || "unknown").toLowerCase();
  const status = OUTCOMES[rawStatus] ? rawStatus : "unknown";
  const reference = searchParams?.ref ? String(searchParams.ref).toUpperCase() : null;

  const langParam = String(searchParams?.lang || "fr").toLowerCase();
  const lang = STRINGS[langParam] ? langParam : "fr";
  const s = STRINGS[lang];

  // SATIM's own actionCodeDescription arrives here already localised to the
  // language we sent. Prefer it over our generic line when present, since it
  // tells the customer the actual reason (expired card, insufficient funds).
  const gatewayMessage = searchParams?.msg ? String(searchParams.msg).slice(0, 300) : null;

  const outcome = OUTCOMES[status];
  const title = s[`${status}_title`];
  const subtitle = status === "failed" && gatewayMessage ? gatewayMessage : s[`${status}_sub`];

  return (
    <>
      <Nav />
      <main
        dir={s.dir}
        style={{
          minHeight: "60vh",
          background: CREAM,
          padding: "72px 24px 96px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: 520 }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: "48px 32px",
              textAlign: "center",
              boxShadow: "0 1px 3px rgba(22,22,26,0.06), 0 12px 32px rgba(22,22,26,0.05)",
            }}
          >
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: "50%",
                background: outcome.color,
                color: "#fff",
                fontSize: 34,
                lineHeight: "76px",
                margin: "0 auto 24px",
                fontWeight: 600,
              }}
            >
              {outcome.glyph}
            </div>

            <h1
              className="display"
              style={{ fontSize: 28, fontWeight: 600, color: INK, margin: "0 0 12px" }}
            >
              {title}
            </h1>

            <p style={{ color: GRAY, fontSize: 15, lineHeight: 1.6, margin: "0 0 28px" }}>
              {subtitle}
            </p>

            {reference && (
              <div
                style={{
                  border: "1px dashed #D8D4CC",
                  borderRadius: 12,
                  padding: "16px 20px",
                  marginBottom: 28,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: GRAY,
                    marginBottom: 6,
                  }}
                >
                  {s.reference}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: INK, letterSpacing: "0.04em" }}>
                  {reference}
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {status === "paid" && reference && (
                <Link
                  href={`/booking/${reference}`}
                  style={{
                    background: INK,
                    color: "#fff",
                    padding: "14px 26px",
                    borderRadius: 980,
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: "none",
                  }}
                >
                  {s.view_booking}
                </Link>
              )}

              {status === "failed" && (
                <Link
                  href="/hotels"
                  style={{
                    background: INK,
                    color: "#fff",
                    padding: "14px 26px",
                    borderRadius: 980,
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: "none",
                  }}
                >
                  {s.try_again}
                </Link>
              )}

              {status === "pending" && reference && (
                // A plain link, not a poller. The reconciliation cron settles
                // this within minutes whether or not the customer is watching,
                // and the confirmation email fires either way.
                <Link
                  href={`/booking/result?ref=${reference}&status=pending&lang=${lang}`}
                  style={{
                    background: INK,
                    color: "#fff",
                    padding: "14px 26px",
                    borderRadius: 980,
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: "none",
                  }}
                >
                  {s.refresh}
                </Link>
              )}

              <Link
                href="/hotels"
                style={{ color: GRAY, fontSize: 14, textDecoration: "none", padding: "10px 0" }}
              >
                {s.browse}
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
