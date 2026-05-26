// =============================================================================
// /reset-password — landing page for the link emailed by the password-reset
// request endpoint. The token is in the URL query string. The actual form
// is a client component (below).
// =============================================================================

import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata = {
  title: "Reset your password · Nzzor",
};

export default function ResetPasswordPage() {
  // The form reads `token` from useSearchParams, which requires Suspense
  // in the App Router. Wrapping here keeps the page deployable.
  return (
    <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
