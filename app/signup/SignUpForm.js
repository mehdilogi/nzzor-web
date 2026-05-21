"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { userRegister } from "../../lib/accountApi";
import { useAuth } from "../../lib/AuthContext";
import { useLang } from "../../lib/LangContext";

export default function SignUpForm() {
  const { t, lang } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";
  const { refresh } = useAuth();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState(searchParams.get("firstName") || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      await userRegister({ email, password, firstName, preferredLang: lang });
      await refresh();
      router.push(next);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <div className="ap-shell">
      <form className="ap-card" onSubmit={submit}>
        <h1 className="display">{t("auth.signup_title")}</h1>
        <p>{t("auth.signup_sub")}</p>

        <label>{t("auth.first_name")}</label>
        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoFocus />

        <label>{t("auth.email")}</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label>{t("auth.password")}</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        <span className="ap-hint">{t("auth.password_hint")}</span>

        {err && <div className="ap-err">{err}</div>}

        <button type="submit" disabled={busy}>{busy ? t("auth.creating") : t("auth.signup")}</button>

        <div className="ap-foot">
          <span>{t("auth.have_account")} <Link href="/signin">{t("auth.signin")}</Link></span>
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
        .ap-hint { display: block; font-size: 11.5px; color: var(--gray-400); margin-top: 5px; }
        button[type="submit"] { width: 100%; margin-top: 22px; padding: 15px; background: var(--red); color: #fff; border: none; border-radius: var(--r-sm); font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; }
        button[type="submit"]:disabled { opacity: 0.6; cursor: default; }
        .ap-err { background: var(--red-soft); color: var(--red-deep); padding: 10px 12px; border-radius: var(--r-sm); font-size: 13px; font-weight: 600; margin-top: 14px; }
        .ap-foot { margin-top: 22px; font-size: 13px; color: var(--gray-400); text-align: center; }
        .ap-foot :global(a) { color: var(--ink); font-weight: 700; text-decoration: underline; }
      `}</style>
    </div>
  );
}
