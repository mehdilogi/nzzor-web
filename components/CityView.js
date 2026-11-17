"use client";

// =============================================================================
// CityView — the body of /hotels/ville/[city], in the visitor's language
// -----------------------------------------------------------------------------
// The server sends the page in French (what Google indexes), with the data
// for all three languages. After hydration the page follows the language
// chosen in the nav, like the rest of the site, and Arabic flips it RTL.
// The first paint is always French so it matches the server HTML exactly.
// =============================================================================

import { useEffect, useState } from "react";
import { useLang } from "../lib/LangContext";

const fmt = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(Number(n) || 0)).replace(/[  ]/g, " ");

const S = {
  fr: {
    home: "Nzzor", hotels: "Hôtels",
    h1: (c) => `Hôtels à ${c}`,
    lead: (n, c, p) => `${n} hôtel${n > 1 ? "s" : ""} à ${c}${p ? `, à partir de ${fmt(p)} DA la nuit` : ""}. Paiement par carte CIB ou Edahabia avec confirmation immédiate, ou réservation via WhatsApp avec notre agence agréée.`,
    cta: (c) => `Choisir mes dates à ${c}`,
    from: (p) => `dès ${fmt(p)} DA / nuit`, online: "Réservation en ligne", wa: "Réservation via WhatsApp",
    faq: "Questions fréquentes",
    q1: (c) => `Combien d'hôtels à ${c} sur Nzzor ?`,
    a1: (n, c, o) => `${n} hôtel${n > 1 ? "s" : ""} à ${c}${o ? `, dont ${o} réservable${o > 1 ? "s" : ""} en ligne avec confirmation immédiate` : ""}.`,
    q2: (c) => `Quel est le prix d'un hôtel à ${c} ?`,
    a2: (p) => `À partir de ${fmt(p)} DA la nuit sur Nzzor. Le prix exact dépend des dates, de la chambre et de la formule.`,
    q3: (c) => `Comment payer un hôtel à ${c} ?`,
    a3: "Par carte CIB ou Edahabia via le paiement sécurisé SATIM pour les hôtels réservables en ligne, ou via WhatsApp avec notre équipe pour les autres.",
    others: "Hôtels dans les autres villes",
    other: (c) => `Hôtels à ${c}`,
    dir: "ltr",
  },
  en: {
    home: "Nzzor", hotels: "Hotels",
    h1: (c) => `Hotels in ${c}`,
    lead: (n, c, p) => `${n} hotel${n > 1 ? "s" : ""} in ${c}${p ? `, from ${fmt(p)} DA per night` : ""}. Pay by CIB or Edahabia card with instant confirmation, or book over WhatsApp with our licensed agency.`,
    cta: (c) => `Choose my dates in ${c}`,
    from: (p) => `from ${fmt(p)} DA / night`, online: "Book online", wa: "Book via WhatsApp",
    faq: "Frequently asked questions",
    q1: (c) => `How many hotels in ${c} on Nzzor?`,
    a1: (n, c, o) => `${n} hotel${n > 1 ? "s" : ""} in ${c}${o ? `, ${o} of them bookable online with instant confirmation` : ""}.`,
    q2: (c) => `How much is a hotel in ${c}?`,
    a2: (p) => `From ${fmt(p)} DA per night on Nzzor. The exact price depends on your dates, room and meal plan.`,
    q3: (c) => `How do I pay for a hotel in ${c}?`,
    a3: "By CIB or Edahabia card through SATIM secure payment for hotels bookable online, or over WhatsApp with our team for the others.",
    others: "Hotels in other cities",
    other: (c) => `Hotels in ${c}`,
    dir: "ltr",
  },
  ar: {
    home: "نزور", hotels: "الفنادق",
    h1: (c) => `فنادق ${c}`,
    lead: (n, c, p) => `${n} فندق في ${c}${p ? `، ابتداءً من ${fmt(p)} دج لليلة` : ""}. الدفع ببطاقة CIB أو الذهبية مع تأكيد فوري، أو الحجز عبر واتساب مع وكالتنا المعتمدة.`,
    cta: (c) => `اختر تواريخك في ${c}`,
    from: (p) => `ابتداءً من ${fmt(p)} دج / الليلة`, online: "حجز عبر الإنترنت", wa: "الحجز عبر واتساب",
    faq: "أسئلة شائعة",
    q1: (c) => `كم عدد الفنادق في ${c} على نزور؟`,
    a1: (n, c, o) => `${n} فندق في ${c}${o ? `، منها ${o} قابلة للحجز عبر الإنترنت مع تأكيد فوري` : ""}.`,
    q2: (c) => `ما سعر الفندق في ${c}؟`,
    a2: (p) => `ابتداءً من ${fmt(p)} دج لليلة على نزور. يختلف السعر حسب التواريخ ونوع الغرفة والخدمة.`,
    q3: (c) => `كيف أدفع ثمن فندق في ${c}؟`,
    a3: "ببطاقة CIB أو الذهبية عبر الدفع الآمن لساتيم للفنادق القابلة للحجز عبر الإنترنت، أو عبر واتساب مع فريقنا لباقي الفنادق.",
    others: "فنادق في مدن أخرى",
    other: (c) => `فنادق ${c}`,
    dir: "rtl",
  },
};

export default function CityView({ city, hotels, cities, minPrice }) {
  const { lang } = useLang();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const view = mounted && S[lang] ? lang : "fr";
  const s = S[view];
  const cname = (c) => (view === "ar" ? c.nameAr : view === "en" ? c.nameEn : c.nameFr);
  const name = cname(city);
  const n = hotels.length;
  const online = hotels.filter((h) => h.onlineBooking).length;
  const arrow = view === "ar" ? "←" : "→";

  const faq = [
    { q: s.q1(name), a: s.a1(n, name, online) },
    ...(minPrice ? [{ q: s.q2(name), a: s.a2(minPrice) }] : []),
    { q: s.q3(name), a: s.a3 },
  ];

  return (
    <main className="cp" dir={s.dir} lang={view}>
      <div className="cp-wrap">
        <nav className="cp-bc">
          <a href="/">{s.home}</a> <span>/</span> <a href="/hotels">{s.hotels}</a> <span>/</span> {name}
        </nav>
        <h1>{s.h1(name)}</h1>
        <p className="cp-lead">{s.lead(n, name, minPrice)}</p>
        <a className="cp-cta" href={`/hotels?city=${encodeURIComponent(city.keys[0])}`}>{s.cta(name)} {arrow}</a>

        <ul className="cp-grid">
          {hotels.map((h) => (
            <li key={h.slug}>
              <a href={`/hotels/${h.slug}`} className="cp-card">
                <div className="cp-photo">
                  {h.primaryPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={h.primaryPhoto} alt={`${h.name[view]}, ${name}`} loading="lazy" />
                  ) : null}
                </div>
                <div className="cp-body">
                  <h2>{h.name[view]}</h2>
                  <div className="cp-meta">
                    {h.stars > 0 && <span className="cp-stars" aria-label={`${h.stars}★`}>{"★".repeat(h.stars)}</span>}
                    <span>{h.onlineBooking ? (h.priceFrom > 0 ? s.from(h.priceFrom) : s.online) : s.wa}</span>
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>

        <section className="cp-faq">
          <h2>{s.faq}</h2>
          {faq.map((f, i) => (
            <details key={i} open={i === 0}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>

        {cities.length > 0 && (
          <nav className="cp-cities">
            <h2>{s.others}</h2>
            <ul>
              {cities.map((c) => (
                <li key={c.slug}><a href={`/hotels/ville/${c.slug}`}>{s.other(cname(c))} <span>({c.hotelCount})</span></a></li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      <style>{`
        .cp { background: var(--cream, #FAF8F4); }
        .cp-wrap { max-width: 1180px; margin: 0 auto; padding: 36px 24px 72px; }
        .cp-bc { font-size: 12.5px; color: var(--gray-400, #8a8a90); margin-bottom: 18px; }
        .cp-bc a { color: var(--gray-500, #6b6b75); text-decoration: none; }
        .cp-bc span { margin: 0 6px; }
        .cp h1 { font-family: 'Clash Display', sans-serif; font-size: clamp(32px, 4.4vw, 52px); font-weight: 600; letter-spacing: -0.03em; line-height: 1.08; color: var(--ink, #16161A); margin: 0 0 14px; }
        .cp[dir="rtl"] h1 { font-family: inherit; letter-spacing: 0; }
        .cp-lead { font-size: 15.5px; line-height: 1.75; color: var(--ink-2, #3a3a40); max-width: 760px; margin: 0; }
        .cp-cta { display: inline-block; margin: 20px 0 32px; background: var(--red, #E63946); color: #fff; padding: 13px 22px; border-radius: 980px; font-weight: 700; font-size: 14.5px; text-decoration: none; }
        .cp-grid { list-style: none; padding: 0; margin: 0 0 48px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        .cp-card { display: block; background: #fff; border: 1px solid var(--gray-200, #e5e2dc); border-radius: 16px; overflow: hidden; text-decoration: none; color: inherit; transition: box-shadow .2s, transform .2s; height: 100%; }
        .cp-card:hover { box-shadow: 0 18px 40px -22px rgba(22,22,26,.35); transform: translateY(-2px); }
        .cp-photo { aspect-ratio: 16 / 10; background: var(--gray-100, #f2f1ee); }
        .cp-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .cp-body { padding: 14px 16px 16px; }
        .cp-body h2 { font-size: 16.5px; font-weight: 700; margin: 0; color: var(--ink, #16161A); line-height: 1.3; }
        .cp-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 13px; color: var(--gray-500, #6b6b75); margin-top: 8px; font-weight: 600; }
        .cp-stars { color: #C9A227; letter-spacing: 1px; }
        .cp-faq { max-width: 760px; margin-bottom: 40px; }
        .cp-faq h2, .cp-cities h2 { font-size: 21px; font-weight: 600; margin: 0 0 12px; color: var(--ink, #16161A); }
        .cp-faq details { border-bottom: 1px solid var(--gray-200, #e5e2dc); padding: 12px 0; }
        .cp-faq summary { cursor: pointer; font-weight: 700; font-size: 14.5px; list-style: none; display: flex; justify-content: space-between; gap: 12px; }
        .cp-faq summary::-webkit-details-marker { display: none; }
        .cp-faq summary::after { content: "+"; flex-shrink: 0; color: var(--gray-400, #8a8a90); }
        .cp-faq details[open] summary::after { content: "−"; }
        .cp-faq p { font-size: 14px; line-height: 1.7; color: var(--ink-2, #3a3a40); margin: 8px 0 0; }
        .cp-cities ul { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px; }
        .cp-cities a { display: inline-block; padding: 8px 14px; border-radius: 980px; background: #fff; border: 1px solid var(--gray-200, #e5e2dc); font-size: 13.5px; font-weight: 600; color: var(--ink, #16161A); text-decoration: none; }
        .cp-cities a:hover { border-color: var(--ink, #16161A); }
        .cp-cities a span { color: var(--gray-400, #8a8a90); font-weight: 500; }
        @media (max-width: 900px) { .cp-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 560px) { .cp-wrap { padding: 24px 16px 56px; } .cp-grid { grid-template-columns: 1fr; } }
      `}</style>
    </main>
  );
}
