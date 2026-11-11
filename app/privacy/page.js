import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import WhatsAppButton from "../../components/WhatsAppButton";
import InfoPage from "../../components/InfoPage";
import { PRIVACY } from "../../lib/infoPages";

export const metadata = {
  title: "Politique de confidentialité — Nzzor",
  description: "Comment Nzzor collecte, utilise et protège vos données personnelles, conformément à la loi 18-07.",
  alternates: { canonical: "https://nzzor.com/privacy" },
};

export default function Page() {
  return (
    <>
      <Nav />
      <InfoPage content={PRIVACY} />
      <Footer />
      <WhatsAppButton />
    </>
  );
}
