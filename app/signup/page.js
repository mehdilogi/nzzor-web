import { Suspense } from "react";
import SignUpForm from "./SignUpForm";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";

export const metadata = {
  title: "Create account — Nzzor",
};

export default function SignUpPage() {
  return (
    <>
      <Nav />
      <Suspense fallback={null}>
        <SignUpForm />
      </Suspense>
      <Footer />
    </>
  );
}
