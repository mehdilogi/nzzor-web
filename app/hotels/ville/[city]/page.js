// =============================================================================
// /hotels/ville/[city] — "Hôtels à Sétif"
// -----------------------------------------------------------------------------
// One indexable page per wilaya. The server renders it in French (what Google
// indexes; the title also carries the Arabic name for Arabic searches), and
// CityView then follows the visitor's language like the rest of the site.
// =============================================================================

import { redirect, permanentRedirect } from "next/navigation";
import Nav from "../../../../components/Nav";
import Footer from "../../../../components/Footer";
import WhatsAppButton from "../../../../components/WhatsAppButton";
import CityView from "../../../../components/CityView";
import { getCityGroups, findCityGroup, getGroupHotelsAllLangs, cityPath, fmtDA } from "../../../../lib/seoData";

export const revalidate = 3600;

const SITE = "https://nzzor.com";

async function load(param) {
  const city = await findCityGroup(param);
  if (!city) return null;
  const [hotels, groups] = await Promise.all([getGroupHotelsAllLangs(city), getCityGroups()]);
  const prices = hotels.filter((h) => h.onlineBooking && h.priceFrom > 0).map((h) => h.priceFrom);
  return {
    city,
    hotels,
    cities: groups.filter((g) => g.slug !== city.slug),
    minPrice: prices.length ? Math.min(...prices) : null,
  };
}

export async function generateMetadata({ params }) {
  const d = await load(params.city);
  if (!d) return { title: "Hôtels en Algérie | Nzzor", robots: { index: false } };
  const { city, hotels, minPrice } = d;
  const n = hotels.length;
  const ar = city.nameAr && city.nameAr !== city.nameFr ? ` — فنادق ${city.nameAr}` : "";
  const title = `Hôtels à ${city.nameFr} (${n})${ar} | Nzzor`;
  const description = (
    `${n} hôtel${n > 1 ? "s" : ""} à ${city.nameFr}` +
    (minPrice ? `, à partir de ${fmtDA(minPrice)} DA la nuit` : "") +
    `. Réservez en ligne par carte CIB ou Edahabia, ou via WhatsApp. Nzzor, agence de voyage agréée.`
  ).slice(0, 160);
  const url = `${SITE}${cityPath(city)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website", url, title, description, siteName: "Nzzor", locale: "fr_DZ",
      images: [hotels.find((h) => h.primaryPhoto)?.primaryPhoto || `${SITE}/og.jpg`],
    },
  };
}

export default async function CityPage({ params }) {
  const d = await load(params.city);
  // A wilaya with no hotel yet goes to the full list rather than a 404.
  if (!d) redirect("/hotels");
  const { city, hotels, cities, minPrice } = d;

  // Old or variant addresses (/hotels/ville/algiers, /hotels/ville/tizi%20ouzou)
  // move permanently to the one canonical address.
  let asked = String(params.city || "");
  try { asked = decodeURIComponent(asked); } catch {}
  if (asked !== city.slug) permanentRedirect(cityPath(city));

  const n = hotels.length;
  const online = hotels.filter((h) => h.onlineBooking).length;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Hôtels à ${city.nameFr}`,
      numberOfItems: n,
      itemListElement: hotels.slice(0, 50).map((h, i) => ({
        "@type": "ListItem", position: i + 1, url: `${SITE}/hotels/${h.slug}`, name: h.name.fr,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Nzzor", item: SITE },
        { "@type": "ListItem", position: 2, name: "Hôtels", item: `${SITE}/hotels` },
        { "@type": "ListItem", position: 3, name: `Hôtels à ${city.nameFr}`, item: `${SITE}${cityPath(city)}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        { q: `Combien d'hôtels à ${city.nameFr} sur Nzzor ?`, a: `${n} hôtel${n > 1 ? "s" : ""} à ${city.nameFr}${online ? `, dont ${online} réservable${online > 1 ? "s" : ""} en ligne avec confirmation immédiate` : ""}.` },
        ...(minPrice ? [{ q: `Quel est le prix d'un hôtel à ${city.nameFr} ?`, a: `À partir de ${fmtDA(minPrice)} DA la nuit sur Nzzor.` }] : []),
      ].map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Nav />
      <CityView city={city} hotels={hotels} cities={cities} minPrice={minPrice} />
      <Footer />
      <WhatsAppButton />
    </>
  );
}
