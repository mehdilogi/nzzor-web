"use client";

// =============================================================================
// PayAgain — /pay/[reference]
// -----------------------------------------------------------------------------
// Reopens the SATIM payment for an EXISTING booking. Reached from the
// "Try again" button on a failed payment and from the recovery email.
//
// Nothing is re-entered: the booking, guest and price already exist. The page
// only reads the booking's state, asks the customer to re-accept the terms
// (SATIM requires the acceptance right before payment), and calls the same
// /satim/initiate endpoint the booking flow uses, which creates a fresh
// Payment row and a fresh SATIM order on every attempt.
// =============================================================================

import { useEffect, useState } from "react";
import { useLang } from "../lib/LangContext";
import { startSatimPayment } from "../lib/api";

const INK = "#16161A";
const CREAM = "#FAF8F4";
const RED = "#E63946";
const GRAY = "#6B6B75";
const LINE = "#E5E2DC";
const AMBER = "#B4801A";

const S = {
  fr: {
    title: "Finalisez votre paiement",
    sub: "Votre réservation est enregistrée. Aucun montant n'a été débité lors de la tentative précédente.",
    hotel: "Hôtel", arrival: "Arrivée", departure: "Départ", nights: "Nuits", guest: "Client", total: "Montant à payer", ref: "Référence",
    terms: "J'accepte les", terms_link: "conditions générales de vente",
    pay: "Payer par carte CIB / EDAHABIA",
    paying: "Ouverture du paiement sécurisé…",
    hold: "La chambre n'est garantie qu'une fois le paiement validé.",
    tip: "Gardez votre carte et votre téléphone à portée de main : la banque envoie un code par SMS.",
    terms_required: "Veuillez accepter les conditions générales de vente.",
    init_failed: "Le paiement n'a pas pu être ouvert. Réessayez dans un instant ou contactez-nous.",
    loading: "Chargement de votre réservation…",
    not_found: "Réservation introuvable",
    not_found_sub: "Vérifiez la référence ou contactez-nous.",
    paid: "Cette réservation est déjà payée",
    paid_sub: "Votre paiement a été confirmé. Retrouvez votre reçu ci-dessous.",
    view_receipt: "Voir mon reçu",
    closed: "Cette réservation ne peut plus être payée",
    closed_sub: "Elle a été annulée ou ses dates sont passées. Contactez-nous et nous vous aiderons à réserver de nouveau.",
    contact: "Nous contacter sur WhatsApp",
    helpline: "Problème de paiement ? Appelez gratuitement la SATIM au 3020",
    dir: "ltr", locale: "fr-FR", currency: "DA",
  },
  en: {
    title: "Complete your payment",
    sub: "Your booking is saved. Nothing was charged on the previous attempt.",
    hotel: "Hotel", arrival: "Check-in", departure: "Check-out", nights: "Nights", guest: "Guest", total: "Amount to pay", ref: "Reference",
    terms: "I accept the", terms_link: "terms and conditions of sale",
    pay: "Pay by CIB / EDAHABIA card",
    paying: "Opening secure payment…",
    hold: "The room is only guaranteed once the payment goes through.",
    tip: "Keep your card and phone at hand: your bank sends a code by SMS.",
    terms_required: "Please accept the terms and conditions.",
    init_failed: "We couldn't open the payment page. Please try again in a moment or contact us.",
    loading: "Loading your booking…",
    not_found: "Booking not found",
    not_found_sub: "Check the reference or contact us.",
    paid: "This booking is already paid",
    paid_sub: "Your payment was confirmed. Your receipt is one click away.",
    view_receipt: "View my receipt",
    closed: "This booking can no longer be paid",
    closed_sub: "It was cancelled or its dates have passed. Contact us and we'll help you book again.",
    contact: "Contact us on WhatsApp",
    helpline: "Payment problem? Call SATIM free on 3020",
    dir: "ltr", locale: "en-GB", currency: "DZD",
  },
  ar: {
    title: "أكملوا عملية الدفع",
    sub: "حجزكم مسجّل لدينا، ولم يُقتطع أي مبلغ في المحاولة السابقة.",
    hotel: "الفندق", arrival: "الوصول", departure: "المغادرة", nights: "الليالي", guest: "النزيل", total: "المبلغ المطلوب", ref: "رقم الحجز",
    terms: "أوافق على", terms_link: "الشروط العامة للبيع",
    pay: "الدفع ببطاقة CIB / الذهبية",
    paying: "جارٍ فتح صفحة الدفع الآمن…",
    hold: "لا تُضمن الغرفة إلا بعد تأكيد الدفع.",
    tip: "احتفظوا ببطاقتكم وهاتفكم بالقرب منكم: يرسل البنك رمزاً عبر SMS.",
    terms_required: "يرجى الموافقة على الشروط العامة للبيع.",
    init_failed: "تعذّر فتح صفحة الدفع. أعيدوا المحاولة بعد لحظات أو تواصلوا معنا.",
    loading: "جارٍ تحميل حجزكم…",
    not_found: "لم يتم العثور على الحجز",
    not_found_sub: "تحققوا من رقم الحجز أو تواصلوا معنا.",
    paid: "تم دفع هذا الحجز مسبقاً",
    paid_sub: "تم تأكيد دفعكم. يمكنكم الاطلاع على الإيصال.",
    view_receipt: "عرض الإيصال",
    closed: "لم يعد بالإمكان دفع هذا الحجز",
    closed_sub: "تم إلغاؤه أو انقضت تواريخه. تواصلوا معنا وسنساعدكم على الحجز من جديد.",
    contact: "تواصلوا معنا عبر واتساب",
    helpline: "مشكلة في الدفع؟ اتصل مجاناً بساتيم على 3020",
    dir: "rtl", locale: "ar-DZ", currency: "دج",
  },
};

const PAYABLE = ["PENDING_PAYMENT", "PENDING", "PAYMENT_FAILED"];
const WHATSAPP = "https://wa.me/213770080830";

// Stay dates are calendar days stored at midnight UTC; compare against the
// Algiers calendar day (UTC+1, no DST).
function algiersToday() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export default function PayAgain({ reference, lang }) {
  const { lang: ctxLang } = useLang();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const view = (mounted && ctxLang) || lang || "fr";
  const s = S[view] || S.fr;

  const [state, setState] = useState("loading"); // loading | ready | paid | closed | missing
  const [info, setInfo] = useState(null);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${base}/api/payments/satim/receipt/${encodeURIComponent(reference)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled) return;
        const d = j && j.data;
        if (!d) return setState("missing");
        setInfo(d);
        if (d.paid || d.bookingStatus === "CONFIRMED") return setState("paid");
        const past = d.checkIn && new Date(d.checkIn).getTime() < algiersToday();
        if (!PAYABLE.includes(d.bookingStatus) || past) return setState("closed");
        setState("ready");
      })
      .catch(() => { if (!cancelled) setState("missing"); });
    return () => { cancelled = true; };
  }, [reference]);

  async function pay() {
    if (!terms) { setError(s.terms_required); return; }
    setError(null);
    setBusy(true);
    try {
      const res = await startSatimPayment(reference, { lang: view });
      if (res && res.ok && res.formUrl) {
        window.location.href = res.formUrl; // stay busy while navigating away
        return;
      }
      setError((res && res.error) || s.init_failed);
    } catch {
      setError(s.init_failed);
    }
    setBusy(false);
  }

  const date = (v) => {
    try {
      return new Date(v).toLocaleDateString(s.locale, { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
    } catch { return String(v).slice(0, 10); }
  };
  const amount = info ? `${new Intl.NumberFormat("fr-FR").format(info.amount || 0)} ${s.currency}` : "";
  const hotel = info && (view === "ar" ? info.hotelName : info.hotelNameLatin || info.hotelName);

  const row = (k, v) => (
    <div className="pa-row"><span className="pa-k">{k}</span><span className="pa-v">{v || "—"}</span></div>
  );

  return (
    <main className="pa-page" dir={s.dir} lang={view}>
      <div className="pa-card">
        {state === "loading" && <p className="pa-sub">{s.loading}</p>}

        {state === "missing" && (
          <>
            <h1 className="display pa-title">{s.not_found}</h1>
            <p className="pa-sub">{s.not_found_sub}</p>
            <a className="pa-primary" href={WHATSAPP} target="_blank" rel="noopener noreferrer">{s.contact}</a>
          </>
        )}

        {state === "paid" && (
          <>
            <h1 className="display pa-title">{s.paid}</h1>
            <p className="pa-sub">{s.paid_sub}</p>
            <a className="pa-primary" href={`/booking/result?ref=${encodeURIComponent(reference)}&status=paid&lang=${view}`}>{s.view_receipt}</a>
          </>
        )}

        {state === "closed" && (
          <>
            <h1 className="display pa-title">{s.closed}</h1>
            <p className="pa-sub">{s.closed_sub}</p>
            <a className="pa-primary" href={WHATSAPP} target="_blank" rel="noopener noreferrer">{s.contact}</a>
          </>
        )}

        {state === "ready" && info && (
          <>
            <h1 className="display pa-title">{s.title}</h1>
            <p className="pa-sub">{s.sub}</p>

            <div className="pa-block">
              {row(s.ref, <span dir="ltr">{info.reference}</span>)}
              {hotel && row(s.hotel, hotel)}
              {info.guestName && row(s.guest, info.guestName)}
              {row(s.arrival, date(info.checkIn))}
              {row(s.departure, date(info.checkOut))}
              {row(s.nights, info.nights)}
              <div className="pa-total"><span>{s.total}</span><strong>{amount}</strong></div>
            </div>

            <label className="pa-terms">
              <input type="checkbox" checked={terms} onChange={(e) => { setTerms(e.target.checked); setError(null); }} />
              <span>
                {s.terms}{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer">{s.terms_link}</a>
              </span>
            </label>

            <button className="pa-pay" onClick={pay} disabled={busy}>{busy ? s.paying : s.pay}</button>
            {error && <div className="pa-err">{error}</div>}

            <p className="pa-hold">{s.hold}</p>
            <p className="pa-tip">{s.tip}</p>
          </>
        )}

        <div className="pa-help">{s.helpline}</div>
      </div>

      <style jsx>{`
        .pa-page { min-height: 60vh; background: ${CREAM}; padding: 56px 16px 88px; display: flex; justify-content: center; }
        .pa-card { width: 100%; max-width: 520px; background: #fff; border-radius: 20px; padding: 36px 30px 28px; box-shadow: 0 1px 3px rgba(22,22,26,.06), 0 12px 32px rgba(22,22,26,.05); text-align: start; }
        .pa-title { font-size: 26px; font-weight: 600; letter-spacing: -0.02em; color: ${INK}; margin: 0 0 8px; }
        .pa-sub { font-size: 14.5px; line-height: 1.65; color: ${GRAY}; margin: 0 0 22px; }
        .pa-block { border: 1px solid ${LINE}; border-radius: 14px; padding: 6px 16px 0; margin-bottom: 20px; }
        .pa-row { display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-bottom: 1px solid ${CREAM}; font-size: 14px; }
        .pa-k { color: ${GRAY}; flex-shrink: 0; }
        .pa-v { color: ${INK}; font-weight: 600; text-align: end; }
        .pa-total { display: flex; justify-content: space-between; align-items: baseline; padding: 14px 0; font-size: 14px; color: ${GRAY}; }
        .pa-total strong { font-size: 20px; color: ${INK}; }
        .pa-terms { display: flex; gap: 10px; align-items: flex-start; font-size: 13.5px; color: ${INK}; margin-bottom: 16px; cursor: pointer; line-height: 1.5; }
        .pa-terms input { margin-top: 3px; width: 16px; height: 16px; accent-color: ${INK}; flex-shrink: 0; }
        .pa-terms a { color: ${INK}; text-decoration: underline; }
        .pa-pay, .pa-primary { display: block; width: 100%; text-align: center; background: ${INK}; color: #fff; border: 0; border-radius: 980px; padding: 15px 22px; font-size: 15px; font-weight: 700; font-family: inherit; cursor: pointer; text-decoration: none; box-sizing: border-box; }
        .pa-pay:disabled { opacity: .6; cursor: default; }
        .pa-err { color: ${RED}; font-size: 13.5px; font-weight: 600; margin-top: 10px; }
        .pa-hold { color: ${AMBER}; font-size: 13px; font-weight: 600; margin: 16px 0 0; }
        .pa-tip { color: ${GRAY}; font-size: 13px; line-height: 1.6; margin: 8px 0 0; }
        .pa-help { margin-top: 22px; padding-top: 14px; border-top: 1px solid ${LINE}; font-size: 12.5px; color: ${GRAY}; text-align: center; }
        @media (max-width: 480px) { .pa-card { padding: 28px 20px 22px; } .pa-title { font-size: 23px; } }
      `}</style>
    </main>
  );
}
