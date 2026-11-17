// =============================================================================
// lib/hotelFacts.js — the practical questions about one hotel, in fr / en / ar
// -----------------------------------------------------------------------------
// Shared by the server (FAQ structured data for Google, in French) and the
// client block under the hotel page (in the visitor's language). Facts come
// from the database only: nothing here is invented.
// =============================================================================

const fmt = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(Number(n) || 0)).replace(/[  ]/g, " ");

const T = {
  fr: {
    where_q: (n) => `Où se trouve ${n} ?`,
    where_a: (n, c, a) => `${n} se trouve à ${c}, en Algérie${a ? ` (${a})` : ""}.`,
    price_q: (n) => `Quel est le prix d'une nuit à ${n} ?`,
    price_a: (p) => `À partir de ${fmt(p)} DA la nuit sur Nzzor. Le prix exact dépend des dates, de la chambre et de la formule, et s'affiche avant le paiement.`,
    price_wa: "Le prix dépend des dates. Écrivez-nous sur WhatsApp : nous vous confirmons le prix et la disponibilité rapidement.",
    book_q: (n) => `Comment réserver ${n} ?`,
    book_online: "Réservez directement sur Nzzor : choisissez vos dates et votre chambre, puis payez par carte CIB ou Edahabia via le paiement sécurisé SATIM. La confirmation et le bon de réservation arrivent aussitôt par e-mail.",
    book_wa: "Cet hôtel se réserve via WhatsApp avec l'équipe Nzzor, agence de voyage agréée : nous vérifions la disponibilité, confirmons le prix et vous envoyons le bon de réservation.",
    times_q: "Quelles sont les heures d'arrivée et de départ ?",
    times_a: (i, o) => [i && `Arrivée à partir de ${i}`, o && `départ jusqu'à ${o}`].filter(Boolean).join(", ") + ".",
    cancel_q: "Peut-on annuler gratuitement ?",
    cancel_a: (h) => `Oui, l'annulation est gratuite jusqu'à ${h} h avant l'arrivée.`,
    park_q: "Y a-t-il un parking ?",
    park_a: "Oui, un parking gratuit est disponible sur place.",
  },
  en: {
    where_q: (n) => `Where is ${n}?`,
    where_a: (n, c, a) => `${n} is in ${c}, Algeria${a ? ` (${a})` : ""}.`,
    price_q: (n) => `How much is a night at ${n}?`,
    price_a: (p) => `From ${fmt(p)} DA per night on Nzzor. The exact price depends on your dates, room and meal plan, and is shown before payment.`,
    price_wa: "The price depends on your dates. Message us on WhatsApp and we will confirm price and availability quickly.",
    book_q: (n) => `How do I book ${n}?`,
    book_online: "Book directly on Nzzor: choose your dates and room, then pay by CIB or Edahabia card through SATIM secure payment. The confirmation and booking voucher arrive by email straight away.",
    book_wa: "This hotel is booked over WhatsApp with the Nzzor team, a licensed travel agency: we check availability, confirm the price and send you the booking voucher.",
    times_q: "What are the check-in and check-out times?",
    times_a: (i, o) => [i && `Check-in from ${i}`, o && `check-out until ${o}`].filter(Boolean).join(", ") + ".",
    cancel_q: "Can I cancel for free?",
    cancel_a: (h) => `Yes, cancellation is free up to ${h} hours before arrival.`,
    park_q: "Is there parking?",
    park_a: "Yes, free parking is available on site.",
  },
  ar: {
    where_q: (n) => `أين يقع ${n}؟`,
    where_a: (n, c, a) => `يقع ${n} في ${c}، الجزائر${a ? ` (${a})` : ""}.`,
    price_q: (n) => `ما سعر الليلة في ${n}؟`,
    price_a: (p) => `ابتداءً من ${fmt(p)} دج لليلة على نزور. السعر النهائي حسب التواريخ ونوع الغرفة والخدمة، ويظهر قبل الدفع.`,
    price_wa: "يتغير السعر حسب التواريخ. راسلونا عبر واتساب ونؤكد لكم السعر والتوفر بسرعة.",
    book_q: (n) => `كيف أحجز ${n}؟`,
    book_online: "احجزوا مباشرة على نزور: اختاروا التواريخ والغرفة، وادفعوا ببطاقة CIB أو الذهبية عبر الدفع الآمن لساتيم. يصلكم التأكيد وقسيمة الحجز بالبريد الإلكتروني فوراً.",
    book_wa: "يتم حجز هذا الفندق عبر واتساب مع فريق نزور، الوكالة السياحية المعتمدة: نتحقق من التوفر ونؤكد السعر ثم نرسل لكم قسيمة الحجز.",
    times_q: "ما مواعيد الوصول والمغادرة؟",
    times_a: (i, o) => [i && `الوصول ابتداءً من ${i}`, o && `المغادرة قبل ${o}`].filter(Boolean).join("، ") + ".",
    cancel_q: "هل يمكن إلغاء الحجز مجاناً؟",
    cancel_a: (h) => `نعم، الإلغاء مجاني حتى ${h} ساعة قبل الوصول.`,
    park_q: "هل يوجد موقف سيارات؟",
    park_a: "نعم، يوجد موقف سيارات مجاني في عين المكان.",
  },
};

export function hotelFacts(h, lang = "fr") {
  if (!h) return [];
  const t = T[lang] || T.fr;
  const online = h.onlineBooking !== false;
  const p = h.policies || {};
  const out = [
    { q: t.where_q(h.name), a: t.where_a(h.name, h.city, h.address) },
    { q: t.price_q(h.name), a: online && h.priceFrom > 0 ? t.price_a(h.priceFrom) : t.price_wa },
    { q: t.book_q(h.name), a: online ? t.book_online : t.book_wa },
  ];
  if (h.checkInTime || h.checkOutTime) out.push({ q: t.times_q, a: t.times_a(h.checkInTime, h.checkOutTime) });
  if (p.cancellationHours > 0) out.push({ q: t.cancel_q, a: t.cancel_a(p.cancellationHours) });
  if (p.parkingFree === true) out.push({ q: t.park_q, a: t.park_a });
  return out;
}

export function hotelFaqJsonLd(fr) {
  const items = hotelFacts(fr, "fr");
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}
