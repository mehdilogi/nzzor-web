// =============================================================================
// /hotels/ville/[city] — "Hôtels à Sétif"
// -----------------------------------------------------------------------------
// One indexable page per wilaya, server-rendered, in French with the Arabic
// names alongside. Targets "hôtel Sétif", "hotels setif prix", "فنادق سطيف".
// The search page (/hotels?city=…) stays the place to pick dates; this page is
// the door Google opens, and every hotel on it links to its own page.
// =============================================================================

import { notFound } from "next/navigation";
import Nav from "../../../../components/Nav";
import Footer from "../../../../components/Footer";
import WhatsAppButton from "../../../../components/WhatsAppButton";
import { getCities, getCityHotels, fmtDA, citySlug } from "../../../../lib/seoData";

export const revalidate = 3600;

const SITE = "https://nzzor.com";

async function load(key) {
  const cities = await getCities();
  let wanted = String(key || "");
  try { wanted = decodeURIComponent(wanted); } catch {}
  wanted = citySlug(wanted); // accepts "tizi-ouzou", "tizi ouzou" and "tizi%20ouzou"
  const city = cities.find((c) => citySlug(c.key) === wanted);
  if (!city) return null;
  const [fr, ar] = await Promise.all([getCityHotels(city.key, "fr"), getCityHotels(city.key, "ar")]);
  const arName = Object.fromEntries(ar.map((h) => [h.slug, h.name]));
  const hotels = fr.map((h) => ({ ...h, nameAr: arName[h.slug] && arName[h.slug] !== h.name ? arName[h.slug] : null }));
  const prices = hotels.filter((h) => h.onlineBooking !== false && h.priceFrom > 0).map((h) => h.priceFrom);
  return { city, cities, hotels, minPrice: prices.length ? Math.min(...prices) : null };
}

export async function generateMetadata({ params }) {
  const d = await load(params.city);
  if (!d) return { title: "Ville introuvable — Nzzor", robots: { index: false } };
  const { city, hotels, minPrice } = d;
  const n = hotels.length;
  const title = `Hôtels à ${city.nameFr} (${n}) — فنادق ${city.nameAr} | Nzzor`;
  const description = (
    `${n} hôtel${n > 1 ? "s" : ""} à ${city.nameFr}` +
    (minPrice ? `, à partir de ${fmtDA(minPrice)} DA la nuit` : "") +
    `. Réservez en ligne par carte CIB ou Edahabia, ou via WhatsApp. Nzzor, agence de voyage agréée.`
  ).slice(0, 160);
  const url = `${SITE}/hotels/ville/${citySlug(city.key)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description, siteName: "Nzzor", locale: "fr_DZ", images: [hotels.find((h) => h.primaryPhoto)?.primaryPhoto || `${SITE}/og.jpg`] },
  };
}

export default async function CityPage({ params }) {
  const d = await load(params.city);
  if (!d) notFound();
  const { city, cities, hotels, minPrice } = d;
  const n = hotels.length;
  const online = hotels.filter((h) => h.onlineBooking !== false).length;

  const faq = [
    {
      q: `Combien d'hôtels à ${city.nameFr} sur Nzzor ?`,
      a: `${n} hôtel${n > 1 ? "s" : ""} à ${city.nameFr}${online ? `, dont ${online} réservable${online > 1 ? "s" : ""} en ligne avec confirmation immédiate` : ""}.`,
    },
    ...(minPrice ? [{
      q: `Quel est le prix d'un hôtel à ${city.nameFr} ?`,
      a: `À partir de ${fmtDA(minPrice)} DA la nuit sur Nzzor. Le prix exact dépend des dates, de la chambre et de la formule.`,
    }] : []),
    {
      q: `Comment payer un hôtel à ${city.nameFr} ?`,
      a: `Par carte CIB ou Edahabia via le paiement sécurisé SATIM pour les hôtels réservables en ligne, ou via WhatsApp avec notre équipe pour les autres.`,
    },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Hôtels à ${city.nameFr}`,
      numberOfItems: n,
      itemListElement: hotels.slice(0, 50).map((h, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE}/hotels/${h.slug}`,
        name: h.name,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Nzzor", item: SITE },
        { "@type": "ListItem", position: 2, name: "Hôtels", item: `${SITE}/hotels` },
        { "@type": "ListItem", position: 3, name: `Hôtels à ${city.nameFr}`, item: `${SITE}/hotels/ville/${citySlug(city.key)}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  const otherCities = cities
    .filter((c) => c.key !== city.key && c.hotelCount > 0)
    .sort((a, b) => b.hotelCount - a.hotelCount);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Nav />
      <main className="cp">
        <div className="cp-wrap">
          <nav className="cp-bc" aria-label="Fil d'Ariane">
            <a href="/">Nzzor</a> <span>/</span> <a href="/hotels">Hôtels</a> <span>/</span> {city.nameFr}
          </nav>
          <h1>Hôtels à {city.nameFr} <span lang="ar" dir="rtl">فنادق {city.nameAr}</span></h1>
          <p className="cp-lead">
            {n} hôtel{n > 1 ? "s" : ""} à {city.nameFr}
            {minPrice ? `, à partir de ${fmtDA(minPrice)} DA la nuit` : ""}. Paiement par carte CIB ou Edahabia,
            confirmation immédiate, ou réservation via WhatsApp avec notre agence agréée.
          </p>
          <p className="cp-lead" lang="ar" dir="rtl">
            {n} فندق في {city.nameAr}
            {minPrice ? `، ابتداءً من ${fmtDA(minPrice)} دج لليلة` : ""}. الدفع ببطاقة CIB أو الذهبية مع تأكيد فوري، أو الحجز عبر واتساب مع وكالتنا المعتمدة.
          </p>
          <a className="cp-cta" href={`/hotels?city=${encodeURIComponent(city.key)}`}>Choisir mes dates à {city.nameFr} →</a>

          <ul className="cp-grid">
            {hotels.map((h) => (
              <li key={h.slug}>
                <a href={`/hotels/${h.slug}`} className="cp-card">
                  <div className="cp-photo">
                    {h.primaryPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={h.primaryPhoto} alt={`${h.name}, ${city.nameFr}`} loading="lazy" />
                    ) : null}
                  </div>
                  <div className="cp-body">
                    <h2>{h.name}</h2>
                    {h.nameAr && <div className="cp-ar" lang="ar" dir="rtl">{h.nameAr}</div>}
                    <div className="cp-meta">
                      {h.stars > 0 ? `${"★".repeat(h.stars)} · ` : ""}
                      {h.onlineBooking !== false
                        ? (h.priceFrom > 0 ? `dès ${fmtDA(h.priceFrom)} DA / nuit` : "Réservation en ligne")
                        : "Réservation via WhatsApp"}
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>

          <section className="cp-faq">
            <h2>Questions fréquentes</h2>
            {faq.map((f, i) => (
              <details key={i} open={i === 0}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </section>

          {otherCities.length > 0 && (
            <nav className="cp-cities" aria-label="Autres villes">
              <h2>Hôtels dans les autres villes</h2>
              <ul>
                {otherCities.map((c) => (
                  <li key={c.key}><a href={`/hotels/ville/${citySlug(c.key)}`}>Hôtels à {c.nameFr} <span>({c.hotelCount})</span></a></li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppButton />

      <style>{`
        .cp { background: var(--cream, #FAF8F4); }
        .cp-wrap { max-width: 1180px; margin: 0 auto; padding: 36px 24px 72px; }
        .cp-bc { font-size: 12.5px; color: var(--gray-400, #8a8a90); margin-bottom: 18px; }
        .cp-bc a { color: var(--gray-500, #6b6b75); text-decoration: none; }
        .cp-bc span { margin: 0 6px; }
        .cp h1 { font-family: 'Clash Display', sans-serif; font-size: clamp(32px, 4.4vw, 52px); font-weight: 600; letter-spacing: -0.03em; line-height: 1.05; color: var(--ink, #16161A); margin: 0 0 14px; }
        .cp h1 span { display: block; font-size: 0.55em; color: var(--gray-400, #8a8a90); margin-top: 6px; font-family: inherit; }
        .cp-lead { font-size: 15.5px; line-height: 1.7; color: var(--ink-2, #3a3a40); max-width: 760px; margin: 0 0 8px; }
        .cp-cta { display: inline-block; margin: 14px 0 32px; background: var(--red, #E63946); color: #fff; padding: 13px 22px; border-radius: 980px; font-weight: 700; font-size: 14.5px; text-decoration: none; }
        .cp-grid { list-style: none; padding: 0; margin: 0 0 48px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        .cp-card { display: block; background: #fff; border: 1px solid var(--gray-200, #e5e2dc); border-radius: 16px; overflow: hidden; text-decoration: none; color: inherit; transition: box-shadow .2s, transform .2s; height: 100%; }
        .cp-card:hover { box-shadow: 0 18px 40px -22px rgba(22,22,26,.35); transform: translateY(-2px); }
        .cp-photo { aspect-ratio: 16 / 10; background: var(--gray-100, #f2f1ee); }
        .cp-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .cp-body { padding: 14px 16px 16px; }
        .cp-body h2 { font-size: 16.5px; font-weight: 700; margin: 0; color: var(--ink, #16161A); line-height: 1.3; }
        .cp-ar { font-size: 14px; color: var(--gray-500, #6b6b75); margin-top: 2px; }
        .cp-meta { font-size: 13px; color: var(--gray-500, #6b6b75); margin-top: 8px; font-weight: 600; }
        .cp-faq { max-width: 760px; margin-bottom: 40px; }
        .cp-faq h2, .cp-cities h2 { font-size: 21px; font-weight: 600; margin: 0 0 12px; color: var(--ink, #16161A); }
        .cp-faq details { border-bottom: 1px solid var(--gray-200, #e5e2dc); padding: 12px 0; }
        .cp-faq summary { cursor: pointer; font-weight: 700; font-size: 14.5px; }
        .cp-faq p { font-size: 14px; line-height: 1.7; color: var(--ink-2, #3a3a40); margin: 8px 0 0; }
        .cp-cities ul { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px; }
        .cp-cities a { display: inline-block; padding: 8px 14px; border-radius: 980px; background: #fff; border: 1px solid var(--gray-200, #e5e2dc); font-size: 13.5px; font-weight: 600; color: var(--ink, #16161A); text-decoration: none; }
        .cp-cities a span { color: var(--gray-400, #8a8a90); }
        @media (max-width: 900px) { .cp-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 560px) { .cp-wrap { padding: 24px 16px 56px; } .cp-grid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  );
}
