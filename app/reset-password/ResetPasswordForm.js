"use client";

// =============================================================================
// /reset-password client form — paired with page.js (server component above).
//
// Flow:
//   1. Component mounts, reads `token` from query string
//   2. User enters new password (twice for confirmation)
//   3. On submit, POSTs to /api/auth/password-reset/confirm
//   4. On success, redirects to /signin with ?reset=ok so SignInForm can
//      show a "you can sign in now" notice
//   5. On failure, shows the error (typically "link expired") with a
//      button back to the request-reset form
//
// Design notes:
//   - We never POST until the user actively submits — no auto-validation
//     of the token on mount. This avoids race conditions where someone
//     clicks the link twice and gets a "used" error on the second tab.
//   - The "passwords don't match" check is client-side only; the backend
//     only sees the final password and doesn't know about confirmation.
// =============================================================================

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { userConfirmPasswordReset } from "../../lib/accountApi";
import { useLang } from "../../lib/LangContext";

export default function ResetPasswordForm() {
  const { t } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  // Guard against missing token. The link in the email always includes
  // one, so this typically means someone navigated to /reset-password
  // directly without going through the email flow.
  if (!token) {
    return (
      <div className="ap-shell">
        <div className="ap-card">
          <h1 className="display">{t("auth.reset_no_token_title")}</h1>
          <p>{t("auth.reset_no_token_sub")}</p>
          <Link href="/signin" className="ap-back">← {t("auth.back_to_signin")}</Link>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (newPassword.length < 8) {
      setErr(t("auth.password_too_short"));
      return;
    }
    if (newPassword !== confirm) {
      setErr(t("auth.passwords_dont_match"));
      return;
    }
    setBusy(true);
    try {
      await userConfirmPasswordReset(token, newPassword);
      setDone(true);
      // Brief pause so the user sees the success state before bouncing
      // to sign-in.
      setTimeout(() => router.push("/signin?reset=ok"), 1500);
    } catch (e) {
      setErr(e.message || t("auth.reset_failed"));
    }
    setBusy(false);
  }

  if (done) {
    return (
      <div className="ap-shell">
        <div className="ap-card">
          <h1 className="display">{t("auth.reset_success_title")}</h1>
          <p>{t("auth.reset_success_sub")}</p>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="ap-shell">
      <form className="ap-card" onSubmit={submit}>
        <h1 className="display">{t("auth.reset_title")}</h1>
        <p>{t("auth.reset_sub")}</p>

        <label>{t("auth.new_password")}</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          autoFocus
          minLength={8}
        />
        <span className="ap-hint">{t("auth.password_hint")}</span>

        <label>{t("auth.confirm_password")}</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
        />

        {err && <div className="ap-err">{err}</div>}

        <button type="submit" disabled={busy}>
          {busy ? t("auth.saving") : t("auth.set_new_password")}
        </button>

        <div className="ap-foot">
          <Link href="/signin">← {t("auth.back_to_signin")}</Link>
        </div>
      </form>
      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .ap-shell { min-height: 70vh; background: var(--cream); display: flex; align-items: center; justify-content: center; padding: 60px 24px; }
  .ap-card { background: #fff; border: 1px solid var(--gray-200); border-radius: var(--r-lg); padding: 40px; width: 100%; max-width: 420px; }
  h1 { font-size: 26px; font-weight: 600; letter-spacing: -0.025em; color: var(--ink); margin-bottom: 8px; }
  p { font-size: 14px; color: var(--gray-400); margin-bottom: 24px; line-height: 1.5; }
  label { display: block; font-size: 12.5px; font-weight: 700; color: var(--ink-2); margin-bottom: 6px; margin-top: 14px; }
  input { width: 100%; padding: 13px 15px; border: 1.5px solid var(--gray-200); border-radius: var(--r-sm); font-size: 14.5px; font-family: inherit; outline: none; }
  input:focus { border-color: var(--ink); }
  .ap-hint { display: block; font-size: 11.5px; color: var(--gray-400); margin-top: 5px; }
  button[type="submit"] { width: 100%; margin-top: 22px; padding: 15px; background: var(--red); color: #fff; border: none; border-radius: var(--r-sm); font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; }
  button[type="submit"]:disabled { opacity: 0.6; cursor: default; }
  .ap-err { background: var(--red-soft); color: var(--red-deep); padding: 10px 12px; border-radius: var(--r-sm); font-size: 13px; font-weight: 600; margin-top: 14px; }
  .ap-foot { margin-top: 22px; font-size: 13px; color: var(--gray-400); text-align: center; }
  .ap-foot :global(a) { color: var(--ink); font-weight: 700; text-decoration: none; }
  .ap-back { display: inline-block; margin-top: 14px; color: var(--ink); font-weight: 700; text-decoration: none; }
`;
