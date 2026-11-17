// =============================================================================
// HotelSeoBlock — server-rendered "practical info" for one hotel
// -----------------------------------------------------------------------------
// Sits under the hotel page, in French and Arabic side by side. It answers the
// questions people actually type ("prix hôtel X Sétif", "فندق X سطيف",
// "comment réserver X") with facts from the database only — no invented
// claims — and links to the other hotels of the same city. This is the text
// Google reads to decide that this page is THE page for this hotel.
//
// Server component: no "use client", no styled-jsx. Plain <style> instead.
// =============================================================================

import { fmtDA } from "../lib/seoData";

function facts(h, lang) {
  if (!h) return [];
  const ar = lang === "ar";
  const out = [];
  const name = h.name;
  const city = h.city;
  const online = h.onlineBooking !== false;

  out.push({
    q: ar ? `أين يقع ${name}؟` : `Où se trouve ${name} ?`,
    a: ar
      ? `يقع ${name} في ${city}، الجزائر${h.address ? ` (${h.address})` : ""}.`
      : `${name} se trouve à ${city}, en Algérie${h.address ? ` (${h.address})` : ""}.`,
  });

  if (online && h.priceFrom > 0) {
    out.push({
      q: ar ? `ما سعر الليلة في ${name}؟` : `Quel est le prix d'une nuit à ${name} ?`,
      a: ar
        ? `ابتداءً من ${fmtDA(h.priceFrom)} دج لليلة على نزور. السعر النهائي حسب التواريخ ونوع الغرفة والخدمة، ويظهر قبل الدفع.`
        : `À partir de ${fmtDA(h.priceFrom)} DA la nuit sur Nzzor. Le prix exact dépend des dates, de la chambre et de la formule, et s'affiche avant le paiement.`,
    });
  } else {
    out.push({
      q: ar ? `ما سعر الليلة في ${name}؟` : `Quel est le prix d'une nuit à ${name} ?`,
      a: ar
        ? `يتغير السعر حسب التواريخ. راسلونا عبر واتساب ونؤكد لكم السعر والتوفر بسرعة.`
        : `Le prix dépend des dates. Écrivez-nous sur WhatsApp : nous vous confirmons le prix et la disponibilité rapidement.`,
    });
  }

  out.push({
    q: ar ? `كيف أحجز ${name}؟` : `Comment réserver ${name} ?`,
    a: online
      ? ar
        ? `احجزوا مباشرة على نزور: اختاروا التواريخ والغرفة، وادفعوا ببطاقة CIB أو الذهبية عبر الدفع الآمن لساتيم. يصلكم التأكيد وقسيمة الحجز بالبريد الإلكتروني فوراً.`
        : `Réservez directement sur Nzzor : choisissez vos dates et votre chambre, puis payez par carte CIB ou Edahabia via le paiement sécurisé SATIM. La confirmation et le bon de réservation arrivent aussitôt par e-mail.`
      : ar
        ? `يتم حجز هذا الفندق عبر واتساب مع فريق نزور، الوكالة السياحية المعتمدة: نتحقق من التوفر ونؤكد السعر ثم نرسل لكم قسيمة الحجز.`
        : `Cet hôtel se réserve via WhatsApp avec l'équipe Nzzor, agence de voyage agréée : nous vérifions la disponibilité, confirmons le prix et vous envoyons le bon de réservation.`,
  });

  if (h.checkInTime || h.checkOutTime) {
    out.push({
      q: ar ? `ما مواعيد الوصول والمغادرة في ${name}؟` : `Quelles sont les heures d'arrivée et de départ ?`,
      a: ar
        ? `${h.checkInTime ? `الوصول ابتداءً من ${h.checkInTime}` : ""}${h.checkInTime && h.checkOutTime ? "، و" : ""}${h.checkOutTime ? `المغادرة قبل ${h.checkOutTime}` : ""}.`
        : `${h.checkInTime ? `Arrivée à partir de ${h.checkInTime}` : ""}${h.checkInTime && h.checkOutTime ? ", " : ""}${h.checkOutTime ? `départ jusqu'à ${h.checkOutTime}` : ""}.`,
    });
  }

  const p = h.policies || {};
  if (p.cancellationHours > 0) {
    out.push({
      q: ar ? `هل يمكن إلغاء الحجز؟` : `Peut-on annuler gratuitement ?`,
      a: ar
        ? `نعم، الإلغاء مجاني حتى ${p.cancellationHours} ساعة قبل الوصول.`
        : `Oui, l'annulation est gratuite jusqu'à ${p.cancellationHours} h avant l'arrivée.`,
    });
  }
  if (p.parkingFree === true) {
    out.push({
      q: ar ? `هل يوجد موقف سيارات؟` : `Y a-t-il un parking ?`,
      a: ar ? `نعم، موقف سيارات مجاني في عين المكان.` : `Oui, un parking gratuit est disponible sur place.`,
    });
  }
  return out;
}

export function hotelFaqJsonLd(fr) {
  const items = facts(fr, "fr");
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export default function HotelSeoBlock({ fr, ar, city, siblings = [] }) {
  if (!fr) return null;
  const frItems = facts(fr, "fr");
  const arItems = facts(ar, "ar");
  const amenFr = (fr.amenities || []).map((a) => a.name).filter(Boolean);
  const amenAr = ((ar && ar.amenities) || []).map((a) => a.name).filter(Boolean);
  const stars = fr.stars > 0 ? `${fr.stars} étoile${fr.stars > 1 ? "s" : ""}` : null;
  const others = siblings.filter((s) => s.slug !== fr.slug).slice(0, 12);

  return (
    <section className="hs" aria-label="Informations pratiques">
      <div className="hs-wrap">
        <div className="hs-cols">
          <div className="hs-col" lang="fr" dir="ltr">
            <h2>Réserver {fr.name} à {fr.city}</h2>
            <p className="hs-lead">
              {fr.name}{stars ? `, hôtel ${stars}` : ""} à {fr.city}
              {fr.onlineBooking !== false
                ? " — réservable en ligne sur Nzzor avec paiement CIB / Edahabia et confirmation immédiate."
                : " — réservable via WhatsApp avec Nzzor, agence de voyage agréée par le Ministère du Tourisme."}
            </p>
            {amenFr.length > 0 && <p className="hs-amen"><strong>Équipements :</strong> {amenFr.join(" · ")}</p>}
            <div className="hs-faq">
              {frItems.map((f, i) => (
                <details key={i} open={i < 2}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>

          {ar && (
            <div className="hs-col" lang="ar" dir="rtl">
              <h2>احجز {ar.name} في {ar.city}</h2>
              <p className="hs-lead">
                {ar.name}{fr.stars > 0 ? `، فندق ${fr.stars} نجوم` : ""} في {ar.city}
                {fr.onlineBooking !== false
                  ? " — احجزوه عبر الإنترنت على نزور مع الدفع ببطاقة CIB أو الذهبية وتأكيد فوري."
                  : " — احجزوه عبر واتساب مع نزور، الوكالة السياحية المعتمدة من وزارة السياحة."}
              </p>
              {amenAr.length > 0 && <p className="hs-amen"><strong>المرافق:</strong> {amenAr.join(" · ")}</p>}
              <div className="hs-faq">
                {arItems.map((f, i) => (
                  <details key={i} open={i < 2}>
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>

        {city && (
          <nav className="hs-city" aria-label={`Hôtels à ${city.nameFr}`}>
            <div className="hs-city-head">
              <h3>Autres hôtels à {city.nameFr} <span lang="ar" dir="rtl">· فنادق أخرى في {city.nameAr}</span></h3>
              <a href={`/hotels/ville/${city.key}`}>Tous les hôtels à {city.nameFr} →</a>
            </div>
            {others.length > 0 && (
              <ul>
                {others.map((s) => (
                  <li key={s.slug}><a href={`/hotels/${s.slug}`}>{s.name}</a></li>
                ))}
              </ul>
            )}
          </nav>
        )}
      </div>

      <style>{`
        .hs { background: var(--cream, #FAF8F4); border-top: 1px solid var(--gray-200, #e5e2dc); padding: 48px 0 56px; }
        .hs-wrap { max-width: 1180px; margin: 0 auto; padding: 0 24px; }
        .hs-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .hs-col h2 { font-size: 21px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink, #16161A); margin: 0 0 10px; }
        .hs-lead { font-size: 14.5px; line-height: 1.7; color: var(--ink-2, #3a3a40); margin: 0 0 10px; }
        .hs-amen { font-size: 13.5px; line-height: 1.7; color: var(--gray-500, #6b6b75); margin: 0 0 14px; }
        .hs-faq details { border-bottom: 1px solid var(--gray-200, #e5e2dc); padding: 12px 0; }
        .hs-faq summary { cursor: pointer; font-size: 14.5px; font-weight: 700; color: var(--ink, #16161A); list-style: none; display: flex; justify-content: space-between; gap: 12px; }
        .hs-faq summary::-webkit-details-marker { display: none; }
        .hs-faq summary::after { content: "+"; flex-shrink: 0; color: var(--gray-400, #8a8a90); font-weight: 600; }
        .hs-faq details[open] summary::after { content: "−"; }
        .hs-faq p { font-size: 14px; line-height: 1.7; color: var(--ink-2, #3a3a40); margin: 8px 0 2px; }
        .hs-city { margin-top: 36px; padding-top: 24px; border-top: 1px solid var(--gray-200, #e5e2dc); }
        .hs-city-head { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; }
        .hs-city h3 { font-size: 16px; font-weight: 700; margin: 0; color: var(--ink, #16161A); }
        .hs-city h3 span { font-weight: 600; color: var(--gray-400, #8a8a90); }
        .hs-city-head a { font-size: 14px; font-weight: 700; color: var(--red, #E63946); text-decoration: none; }
        .hs-city ul { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px; }
        .hs-city li a { display: inline-block; padding: 8px 14px; border-radius: 980px; background: #fff; border: 1px solid var(--gray-200, #e5e2dc); font-size: 13.5px; font-weight: 600; color: var(--ink, #16161A); text-decoration: none; }
        .hs-city li a:hover { border-color: var(--ink, #16161A); }
        @media (max-width: 860px) {
          .hs { padding: 36px 0 40px; }
          .hs-wrap { padding: 0 20px; }
          .hs-cols { grid-template-columns: 1fr; gap: 32px; }
        }
      `}</style>
    </section>
  );
}
