import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import WhatsAppButton from "../../components/WhatsAppButton";
import InfoPage from "../../components/InfoPage";
import { FAQ } from "../../lib/infoPages";

export const metadata = {
  title: "Questions fréquentes — Nzzor",
  description: "Paiement CIB et Edahabia, confirmation, annulation, remboursement : les réponses aux questions les plus posées.",
  alternates: { canonical: "https://nzzor.com/faq" },
};

export default function Page() {
  return (
    <>
      <Nav />
      <InfoPage content={FAQ} />
      <Footer />
      <WhatsAppButton />
    </>
  );
}
