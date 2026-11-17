"use client";

// =============================================================================
// HotelSeoBlock — "practical info" under each hotel page
// -----------------------------------------------------------------------------
// Answers the questions people type ("prix hôtel X Sétif", "comment réserver
// X") from database facts, and links to the other hotels of the same wilaya.
// The server renders it in French (what Google indexes); after hydration it
// follows the language chosen in the nav, like the rest of the page.
// =============================================================================

import { useEffect, useState } from "react";
import { useLang } from "../lib/LangContext";
import { hotelFacts } from "../lib/hotelFacts";

const L = {
  fr: {
    title: (n, c) => `Réserver ${n} à ${c}`,
    lead: (n, c, s, online) => `${n}${s ? `, hôtel ${s} étoile${s > 1 ? "s" : ""}` : ""} à ${c}` +
      (online ? " — réservable en ligne sur Nzzor avec paiement CIB / Edahabia et confirmation immédiate." : " — réservable via WhatsApp avec Nzzor, agence de voyage agréée par le Ministère du Tourisme."),
    amen: "Équipements",
    others: (c) => `Autres hôtels à ${c}`,
    all: (c) => `Tous les hôtels à ${c}`,
    dir: "ltr",
  },
  en: {
    title: (n, c) => `Book ${n} in ${c}`,
    lead: (n, c, s, online) => `${n}${s ? `, a ${s}-star hotel` : ""} in ${c}` +
      (online ? " — bookable online on Nzzor with CIB / Edahabia payment and instant confirmation." : " — bookable over WhatsApp with Nzzor, a travel agency licensed by the Ministry of Tourism."),
    amen: "Amenities",
    others: (c) => `Other hotels in ${c}`,
    all: (c) => `All hotels in ${c}`,
    dir: "ltr",
  },
  ar: {
    title: (n, c) => `احجز ${n} في ${c}`,
    lead: (n, c, s, online) => `${n}${s ? `، فندق ${s} نجوم` : ""} في ${c}` +
      (online ? " — احجزوه عبر الإنترنت على نزور مع الدفع ببطاقة CIB أو الذهبية وتأكيد فوري." : " — احجزوه عبر واتساب مع نزور، الوكالة السياحية المعتمدة من وزارة السياحة."),
    amen: "المرافق",
    others: (c) => `فنادق أخرى في ${c}`,
    all: (c) => `كل فنادق ${c}`,
    dir: "rtl",
  },
};

export default function HotelSeoBlock({ hotel, city, siblings = [] }) {
  const { lang } = useLang();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!hotel || !hotel.fr) return null;

  const view = mounted && L[lang] ? lang : "fr";
  const s = L[view];
  const h = hotel[view] || hotel.fr;
  const items = hotelFacts(h, view);
  const amen = (h.amenities || []).map((a) => a.name).filter(Boolean);
  const cityName = city ? (view === "ar" ? city.nameAr : view === "en" ? city.nameEn : city.nameFr) : h.city;
  const others = siblings.filter((x) => x.slug !== hotel.fr.slug).slice(0, 12);
  const arrow = view === "ar" ? "←" : "→";

  return (
    <section className="hs" dir={s.dir} lang={view}>
      <div className="hs-wrap">
        <h2>{s.title(h.name, h.city)}</h2>
        <p className="hs-lead">{s.lead(h.name, h.city, hotel.fr.stars > 0 ? hotel.fr.stars : 0, hotel.fr.onlineBooking !== false)}</p>
        {amen.length > 0 && <p className="hs-amen"><strong>{s.amen} :</strong> {amen.join(" · ")}</p>}
        <div className="hs-faq">
          {items.map((f, i) => (
            <details key={i} open={i < 2}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>

        {city && (
          <nav className="hs-city">
            <div className="hs-city-head">
              <h3>{s.others(cityName)}</h3>
              <a href={`/hotels/ville/${city.slug}`}>{s.all(cityName)} {arrow}</a>
            </div>
            {others.length > 0 && (
              <ul>
                {others.map((x) => (
                  <li key={x.slug}><a href={`/hotels/${x.slug}`}>{x.name[view] || x.name.fr}</a></li>
                ))}
              </ul>
            )}
          </nav>
        )}
      </div>

      <style>{`
        .hs { background: var(--cream, #FAF8F4); border-top: 1px solid var(--gray-200, #e5e2dc); padding: 48px 0 56px; }
        .hs-wrap { max-width: 860px; margin: 0 auto; padding: 0 24px; }
        .hs h2 { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink, #16161A); margin: 0 0 10px; }
        .hs[dir="rtl"] h2 { letter-spacing: 0; }
        .hs-lead { font-size: 15px; line-height: 1.75; color: var(--ink-2, #3a3a40); margin: 0 0 10px; }
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
        .hs-city-head a { font-size: 14px; font-weight: 700; color: var(--red, #E63946); text-decoration: none; }
        .hs-city ul { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px; }
        .hs-city li a { display: inline-block; padding: 8px 14px; border-radius: 980px; background: #fff; border: 1px solid var(--gray-200, #e5e2dc); font-size: 13.5px; font-weight: 600; color: var(--ink, #16161A); text-decoration: none; }
        .hs-city li a:hover { border-color: var(--ink, #16161A); }
        @media (max-width: 860px) {
          .hs { padding: 36px 0 40px; }
          .hs-wrap { padding: 0 20px; }
        }
      `}</style>
    </section>
  );
}
