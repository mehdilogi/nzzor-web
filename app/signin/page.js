import { Suspense } from "react";
import SignInForm from "./SignInForm";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";

export const metadata = {
  title: "Sign in — Nzzor",
};

export default function SignInPage() {
  return (
    <>
      <Nav />
      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
      <Footer />
    </>
  );
}
