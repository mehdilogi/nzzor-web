import AccountApp from "./AccountApp";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";

export const metadata = {
  title: "My account — Nzzor",
};

export default function AccountPage() {
  return (
    <>
      <Nav />
      <AccountApp />
      <Footer />
    </>
  );
}
