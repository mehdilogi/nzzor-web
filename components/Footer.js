"use client";

import Link from "next/link";
import LogoMark from "./LogoMark";
import { useLang } from "../lib/LangContext";

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="nz-footer">
      <div className="wrap nz-footer-top">
        <div className="nz-footer-brand">
          <div className="nz-footer-logo">
            <LogoMark size={30} />
            <span>
              <span className="display nz-fname">Nzzor</span>
              <span className="nz-fsub">By Allouni Travel Agency</span>
            </span>
          </div>
          <p>{t("footer.tagline")}</p>
          <div className="nz-pay-wrap">
            <h5 className="nz-pay-label">{t("footer.weaccept") || "We accept"}</h5>
            <div className="nz-pay">
              <span>CIB</span><span>Eddahabia</span><span>Bank transfer</span>
            </div>
          </div>
        </div>

        <div className="nz-fcol">
          <h5>{t("footer.company")}</h5>
          <Link className="nz-flink" style={{ display: "block" }} href="/#allouni">{t("footer.about")}</Link>
          <Link className="nz-flink" style={{ display: "block" }} href="/#allouni">{t("footer.agency")}</Link>
          <Link className="nz-flink" style={{ display: "block" }} href="/hotels">{t("footer.ourhotels")}</Link>
          <Link className="nz-flink" style={{ display: "block" }} href="/">{t("footer.careers")}</Link>
        </div>
        <div className="nz-fcol">
          <h5>{t("footer.support")}</h5>
          <Link className="nz-flink" style={{ display: "block" }} href="/">{t("footer.help")}</Link>
          <Link className="nz-flink" style={{ display: "block" }} href="/">{t("footer.contact")}</Link>
          <Link className="nz-flink" style={{ display: "block" }} href="/">{t("footer.whatsapp")}</Link>
          <Link className="nz-flink" style={{ display: "block" }} href="/">{t("footer.faq")}</Link>
        </div>
        <div className="nz-fcol">
          <h5>{t("footer.legal")}</h5>
          <Link className="nz-flink" style={{ display: "block" }} href="/">{t("footer.terms")}</Link>
          <Link className="nz-flink" style={{ display: "block" }} href="/">{t("footer.privacy")}</Link>
          <Link className="nz-flink" style={{ display: "block" }} href="/">{t("footer.cancellation")}</Link>
          <Link className="nz-flink" style={{ display: "block" }} href="/">{t("footer.agrement")}</Link>
        </div>
      </div>

      <div className="wrap nz-footer-bottom">
        <span>{t("footer.rights")}</span>
        <span>{t("footer.madein")}</span>
      </div>

      <style>{`
        .nz-footer { background: var(--white); border-top: 1px solid var(--gray-100); padding-top: 72px; }
        .nz-footer-top {
          display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px;
          padding-bottom: 44px; border-bottom: 1px solid var(--gray-100);
        }
        .nz-footer-logo { display: flex; align-items: center; gap: 11px; margin-bottom: 16px; }
        .nz-fname { display: block; font-size: 21px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink); }
        .nz-fsub { display: block; font-size: 10px; letter-spacing: 0.07em; text-transform: uppercase; font-weight: 700; color: var(--gray-400); margin-top: 2px; }
        .nz-footer-brand p { font-size: 14px; color: var(--gray-400); line-height: 1.7; max-width: 300px; margin-bottom: 18px; }
        .nz-pay-label { display: none; }
        .nz-pay { display: flex; gap: 8px; flex-wrap: wrap; }
        .nz-pay span {
          background: var(--cream); border: 1px solid var(--gray-200);
          padding: 8px 13px; border-radius: 8px; font-size: 12px; font-weight: 700; color: var(--ink-2);
        }
        .nz-fcol h5 {
          font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--gray-400); margin-bottom: 14px;
        }
        .nz-footer :global(.nz-flink) {
          display: block; color: var(--ink-2); font-size: 13.5px; font-weight: 500;
          margin-bottom: 10px; transition: color .2s; text-decoration: none;
        }
        .nz-footer :global(.nz-flink:hover) { color: var(--red); }
        .nz-footer-bottom {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 26px; padding-bottom: 32px; flex-wrap: wrap; gap: 12px;
        }
        .nz-footer-bottom span { font-size: 13px; color: var(--gray-400); font-weight: 500; }
        @media (max-width: 860px) {
          .nz-footer-top { grid-template-columns: 1fr 1fr; gap: 32px; }
        }
        @media (max-width: 560px) {
          .nz-footer { padding-top: 48px; }
          .nz-footer-top {
            grid-template-columns: 1fr;
            gap: 32px;
            padding-bottom: 28px;
            border-bottom: none;
          }
          /* Logo stays — it grounds the footer */
          .nz-footer-logo { margin-bottom: 18px; }
          .nz-footer-brand p {
            font-size: 14.5px;
            line-height: 1.65;
            max-width: none;
            margin-bottom: 20px;
            color: var(--ink-2);
          }
          /* Show the translated "We accept" label on mobile */
          .nz-pay-label {
            display: block;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--gray-400);
            margin-bottom: 12px;
          }
          .nz-pay span {
            padding: 9px 14px;
            font-size: 12.5px;
          }
          /* Each link column becomes its own block with a top divider */
          .nz-fcol {
            border-top: 1px solid var(--gray-100);
            padding-top: 28px;
          }
          .nz-fcol h5 { margin-bottom: 16px; font-size: 11.5px; }
          .nz-footer :global(.nz-flink) {
            font-size: 14.5px;
            margin-bottom: 14px;
            padding: 2px 0;
          }
          /* Centered closing block — feels like a finished signature, not trailing text */
          .nz-footer-bottom {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 6px;
            padding-top: 28px;
            padding-bottom: 60px;
            position: relative;
          }
          .nz-footer-bottom::before {
            content: "";
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 40px;
            height: 2px;
            background: var(--red);
            border-radius: 2px;
          }
          .nz-footer-bottom span { font-size: 12.5px; line-height: 1.6; }
          .nz-footer-bottom span:last-child {
            font-size: 12px;
            color: var(--gray-400);
            max-width: 280px;
          }
        }
      `}</style>
    </footer>
  );
}
