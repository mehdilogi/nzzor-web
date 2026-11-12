import Nav from "../../../components/Nav";
import Footer from "../../../components/Footer";
import PayAgain from "../../../components/PayAgain";

// /pay/[reference] — finish the payment of an existing booking.
// Private to the customer who holds the link: never indexed.
export const metadata = {
  title: "Finaliser le paiement — Nzzor",
  robots: { index: false, follow: false },
};

export default function Page({ params, searchParams }) {
  const reference = String(params.reference || "").toUpperCase();
  const lang = ["fr", "en", "ar"].includes(searchParams?.lang) ? searchParams.lang : "fr";
  return (
    <>
      <Nav />
      <PayAgain reference={reference} lang={lang} />
      <Footer />
    </>
  );
}
