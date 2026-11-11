import { notFound } from "next/navigation";
import Nav from "../../../components/Nav";
import Footer from "../../../components/Footer";
import WhatsAppButton from "../../../components/WhatsAppButton";
import HotelDetail from "../../../components/HotelDetail";
import { getHotel } from "../../../lib/api";

const SITE = "https://nzzor.com";

// One description that reads well in a Google result and a WhatsApp preview,
// even for hotels whose own description is a single English line.
function describe(hotel) {
  const stars = hotel.stars > 0 ? `${hotel.stars} étoiles` : "non classé";
  const base = `${hotel.name}, hôtel ${stars} à ${hotel.city}.`;
  const tail = hotel.onlineBooking === false
    ? " Réservation via WhatsApp avec Nzzor, agence de voyage agréée."
    : " Réservez en ligne par carte CIB ou Edahabia, confirmation immédiate. Nzzor, agence de voyage agréée.";
  return (base + tail).slice(0, 160);
}

export async function generateMetadata({ params }) {
  const hotel = await getHotel(params.slug);
  if (!hotel) return { title: "Hôtel introuvable — Nzzor", robots: { index: false } };
  const url = `${SITE}/hotels/${hotel.slug}`;
  const title = `${hotel.name} — ${hotel.city} | Nzzor`;
  const description = describe(hotel);
  const image = hotel.primaryPhoto || `${SITE}/og.jpg`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "Nzzor",
      locale: "fr_DZ",
      images: [{ url: image, alt: hotel.name }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

// schema.org/Hotel, so Google can show the hotel's stars, address, photo and
// "from" price. Only facts the page itself shows: no ratings (Nzzor has no
// review system yet) and no price for hotels booked over WhatsApp.
function hotelJsonLd(hotel) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: hotel.name,
    url: `${SITE}/hotels/${hotel.slug}`,
    description: hotel.description || undefined,
    image: (hotel.photos || []).slice(0, 5).map((p) => p.url),
    address: {
      "@type": "PostalAddress",
      streetAddress: hotel.address || undefined,
      addressLocality: hotel.city,
      addressRegion: hotel.region || undefined,
      addressCountry: "DZ",
    },
    checkinTime: hotel.checkInTime || undefined,
    checkoutTime: hotel.checkOutTime || undefined,
  };
  if (hotel.stars > 0) data.starRating = { "@type": "Rating", ratingValue: hotel.stars };
  if (hotel.location) data.geo = { "@type": "GeoCoordinates", latitude: hotel.location.lat, longitude: hotel.location.lng };
  if (hotel.onlineBooking !== false && hotel.priceFrom > 0) {
    data.priceRange = `À partir de ${hotel.priceFrom} DZD / nuit`;
    data.currenciesAccepted = "DZD";
    data.paymentAccepted = "CIB, Edahabia";
  }
  if (!data.image.length) delete data.image;
  return data;
}

export default async function HotelPage({ params }) {
  const hotel = await getHotel(params.slug);
  if (!hotel) notFound();

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Nzzor", item: SITE },
      { "@type": "ListItem", position: 2, name: "Hôtels", item: `${SITE}/hotels` },
      { "@type": "ListItem", position: 3, name: hotel.name, item: `${SITE}/hotels/${hotel.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify output is safe here except for "<", escaped so a
        // hotel description can never close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify([hotelJsonLd(hotel), breadcrumb]).replace(/</g, "\\u003c") }}
      />
      <Nav />
      <HotelDetail hotel={hotel} />
      <Footer />
      <WhatsAppButton />
    </>
  );
}
