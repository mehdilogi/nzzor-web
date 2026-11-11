import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import WhatsAppButton from "../../components/WhatsAppButton";
import InfoPage from "../../components/InfoPage";
import { CONTACT } from "../../lib/infoPages";

export const metadata = {
  title: "Nous contacter — Nzzor",
  description: "WhatsApp, téléphone, e-mail et adresse de Nzzor, Allouni Travel Agency, agence agréée à Sétif.",
  alternates: { canonical: "https://nzzor.com/contact" },
};

export default function Page() {
  return (
    <>
      <Nav />
      <InfoPage content={CONTACT} pattern />
      <Footer />
      <WhatsAppButton />
    </>
  );
}
