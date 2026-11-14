import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import WhatsAppButton from "../../components/WhatsAppButton";
import GroupRequest from "../../components/GroupRequest";

export const metadata = {
  title: "Réservation d'hôtel pour groupes en Algérie — Devis sous 24 h | Nzzor",
  description:
    "Séminaire, mariage, équipe sportive, voyage scolaire : à partir de 10 personnes, Nzzor négocie un tarif de groupe avec les hôtels en Algérie et vous envoie un devis sous 24 h.",
  alternates: { canonical: "https://nzzor.com/groupes" },
  openGraph: {
    title: "Hôtels pour groupes en Algérie — Nzzor",
    description: "Tarif de groupe négocié, devis sous 24 h, agence agréée par le Ministère du Tourisme.",
    url: "https://nzzor.com/groupes",
    images: ["/og.jpg"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Réservation d'hôtel pour groupes",
  serviceType: "Group hotel booking",
  areaServed: { "@type": "Country", name: "Algeria" },
  provider: { "@type": "TravelAgency", name: "Nzzor — Allouni Travel Agency", url: "https://nzzor.com" },
  url: "https://nzzor.com/groupes",
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />
      <GroupRequest />
      <Footer />
      <WhatsAppButton />
    </>
  );
}
