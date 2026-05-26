"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { userLogin, userRequestPasswordReset } from "../../lib/accountApi";
import { useAuth } from "../../lib/AuthContext";
import { useLang } from "../../lib/LangContext";

export default function SignInForm() {
  const { t, lang } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";
  const { refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // Forgot-password sub-flow. When `showForgot` is true we render an
  // alternate form: just an email input. After submission we show a
  // generic "check your email" confirmation regardless of whether the
  // address was actually on file (prevents enumeration).
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotErr, setForgotErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      await userLogin(email, password);
      await refresh();
      router.push(next);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  async function submitForgot(e) {
    e.preventDefault();
    setForgotBusy(true); setForgotErr("");
    try {
      await userRequestPasswordReset(forgotEmail.trim(), lang);
      setForgotSent(true);
    } catch (e) {
      // Network or server error — distinct from "email not on file"
      // (which the backend hides). Show generic error.
      setForgotErr(e.message);
    }
    setForgotBusy(false);
  }

  // ---- Forgot-password view ------------------------------------------------
  if (showForgot) {
    return (
      <div className="ap-shell">
        <form className="ap-card" onSubmit={submitForgot}>
          <h1 className="display">{t("auth.forgot_title")}</h1>
          <p>{t("auth.forgot_sub")}</p>

          {forgotSent ? (
            // Generic success — same message regardless of whether the
            // email was actually registered. Tells the user to check their
            // inbox without confirming/denying the account exists.
            <div className="ap-info" role="status">
              {t("auth.forgot_sent")}
            </div>
          ) : (
            <>
              <label>{t("auth.email")}</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                autoFocus
              />
              {forgotErr && <div className="ap-err">{forgotErr}</div>}
              <button type="submit" disabled={forgotBusy}>
                {forgotBusy ? t("auth.sending") : t("auth.send_reset_link")}
              </button>
            </>
          )}

          <div className="ap-foot">
            <button
              type="button"
              className="ap-link"
              onClick={() => {
                setShowForgot(false);
                setForgotSent(false);
                setForgotErr("");
              }}
            >
              ← {t("auth.back_to_signin")}
            </button>
          </div>
        </form>

        <style jsx>{`
          .ap-shell { min-height: 70vh; background: var(--cream); display: flex; align-items: center; justify-content: center; padding: 60px 24px; }
          .ap-card { background: #fff; border: 1px solid var(--gray-200); border-radius: var(--r-lg); padding: 40px; width: 100%; max-width: 420px; }
          h1 { font-size: 28px; font-weight: 600; letter-spacing: -0.025em; color: var(--ink); margin-bottom: 8px; }
          p { font-size: 14px; color: var(--gray-400); margin-bottom: 24px; line-height: 1.5; }
          label { display: block; font-size: 12.5px; font-weight: 700; color: var(--ink-2); margin-bottom: 6px; margin-top: 14px; }
          input { width: 100%; padding: 13px 15px; border: 1.5px solid var(--gray-200); border-radius: var(--r-sm); font-size: 14.5px; font-family: inherit; outline: none; }
          input:focus { border-color: var(--ink); }
          button[type="submit"] { width: 100%; margin-top: 22px; padding: 15px; background: var(--red); color: #fff; border: none; border-radius: var(--r-sm); font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; }
          button[type="submit"]:disabled { opacity: 0.6; cursor: default; }
          .ap-err { background: var(--red-soft); color: var(--red-deep); padding: 10px 12px; border-radius: var(--r-sm); font-size: 13px; font-weight: 600; margin-top: 14px; }
          .ap-info { background: var(--teal-soft); color: var(--teal); padding: 14px 16px; border-radius: var(--r-sm); font-size: 13.5px; font-weight: 600; line-height: 1.55; }
          .ap-foot { display: flex; justify-content: center; margin-top: 22px; font-size: 13px; color: var(--gray-400); }
          .ap-link { background: none; border: none; color: var(--ink-2); font-size: 13px; cursor: pointer; padding: 0; text-decoration: underline; font-family: inherit; }
        `}</style>
      </div>
    );
  }

  // ---- Sign-in view --------------------------------------------------------
  return (
    <div className="ap-shell">
      <form className="ap-card" onSubmit={submit}>
        <h1 className="display">{t("auth.signin_title")}</h1>
        <p>{t("auth.signin_sub")}</p>

        <label>{t("auth.email")}</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />

        <label>{t("auth.password")}</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {err && <div className="ap-err">{err}</div>}

        <button type="submit" disabled={busy}>{busy ? t("auth.signing_in") : t("auth.signin")}</button>

        <div className="ap-foot">
          <button
            type="button"
            className="ap-link"
            onClick={() => {
              setShowForgot(true);
              setForgotEmail(email); // carry over what they've typed
            }}
          >
            {t("auth.forgot")}
          </button>
          <span>{t("auth.no_account")} <Link href="/signup">{t("auth.signup")}</Link></span>
        </div>
      </form>

      <style jsx>{`
        .ap-shell { min-height: 70vh; background: var(--cream); display: flex; align-items: center; justify-content: center; padding: 60px 24px; }
        .ap-card { background: #fff; border: 1px solid var(--gray-200); border-radius: var(--r-lg); padding: 40px; width: 100%; max-width: 420px; }
        h1 { font-size: 28px; font-weight: 600; letter-spacing: -0.025em; color: var(--ink); margin-bottom: 8px; }
        p { font-size: 14px; color: var(--gray-400); margin-bottom: 24px; line-height: 1.5; }
        label { display: block; font-size: 12.5px; font-weight: 700; color: var(--ink-2); margin-bottom: 6px; margin-top: 14px; }
        input { width: 100%; padding: 13px 15px; border: 1.5px solid var(--gray-200); border-radius: var(--r-sm); font-size: 14.5px; font-family: inherit; outline: none; }
        input:focus { border-color: var(--ink); }
        button[type="submit"] { width: 100%; margin-top: 22px; padding: 15px; background: var(--red); color: #fff; border: none; border-radius: var(--r-sm); font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; }
        button[type="submit"]:disabled { opacity: 0.6; cursor: default; }
        .ap-err { background: var(--red-soft); color: var(--red-deep); padding: 10px 12px; border-radius: var(--r-sm); font-size: 13px; font-weight: 600; margin-top: 14px; }
        .ap-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 18px; font-size: 13px; color: var(--gray-400); flex-wrap: wrap; gap: 8px; }
        .ap-foot :global(a) { color: var(--ink); font-weight: 700; text-decoration: underline; }
        .ap-link { background: none; border: none; color: var(--ink-2); font-size: 13px; cursor: pointer; padding: 0; text-decoration: underline; font-family: inherit; }
      `}</style>
    </div>
  );
}
