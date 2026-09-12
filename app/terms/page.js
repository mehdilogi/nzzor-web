import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import TermsContent from "../../components/TermsContent";

export const metadata = {
  title: "Conditions Générales de Vente — Nzzor",
  description:
    "Conditions générales de vente et de paiement en ligne de Nzzor — Allouni Travel Agency.",
};

// The document itself is a client component because the active language lives
// in LangContext (localStorage-backed), which is not available during the
// server render. Keeping this wrapper on the server lets the route still
// export metadata, which a "use client" file cannot do.
//
// Linked from the payment step of the booking flow, where SATIM's cahier de
// recette requires the sale and payment conditions to be reachable and
// actively accepted immediately before payment.
export default function TermsPage() {
  return (
    <>
      <Nav />
      <TermsContent />
      <Footer />
    </>
  );
}
