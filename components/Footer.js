import Link from "next/link";

export default function Footer() {
  return (
    <footer className="nz-footer">
      <div className="wrap nz-footer-top">
        <div className="nz-footer-brand">
          <div className="nz-footer-logo">
            <span className="nz-fmark" />
            <span>
              <span className="display nz-fname">Nzzor</span>
              <span className="nz-fsub">By Allouni Travel Agency</span>
            </span>
          </div>
          <p>
            Algeria&apos;s modern hotel booking platform. Built on the trust of a
            licensed travel agency, designed for the way Algerians travel today.
          </p>
          <div className="nz-pay">
            <span>CIB</span><span>Eddahabia</span><span>Bank transfer</span>
            <span>WhatsApp</span><span>Cash</span>
          </div>
        </div>

        <div className="nz-fcol">
          <h5>Company</h5>
          <Link href="/#allouni">About us</Link>
          <Link href="/#allouni">Allouni Travel Agency</Link>
          <Link href="/hotels">Our hotels</Link>
          <Link href="/">Careers</Link>
        </div>
        <div className="nz-fcol">
          <h5>Support</h5>
          <Link href="/">Help center</Link>
          <Link href="/">Contact us</Link>
          <Link href="/">WhatsApp support</Link>
          <Link href="/">FAQ</Link>
        </div>
        <div className="nz-fcol">
          <h5>Legal</h5>
          <Link href="/">Terms &amp; conditions</Link>
          <Link href="/">Privacy policy</Link>
          <Link href="/">Cancellation policy</Link>
          <Link href="/">Ministry agrément</Link>
        </div>
      </div>

      <div className="wrap nz-footer-bottom">
        <span>© 2026 Allouni Travel Agency. All rights reserved.</span>
        <span>Licensed by the Algerian Ministry of Tourism · Made in Algeria</span>
      </div>

      <style>{`
        .nz-footer { background: var(--white); border-top: 1px solid var(--gray-100); padding-top: 72px; }
        .nz-footer-top {
          display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px;
          padding-bottom: 44px; border-bottom: 1px solid var(--gray-100);
        }
        .nz-footer-logo { display: flex; align-items: center; gap: 11px; margin-bottom: 16px; }
        .nz-fmark { width: 30px; height: 30px; border-radius: 50%; background: var(--red); flex-shrink: 0; position: relative; }
        .nz-fmark::after {
          content: ''; position: absolute; inset: 0; border-radius: 50%;
          background: var(--red); animation: ping 3s cubic-bezier(0,0,0.2,1) infinite;
        }
        .nz-fname { display: block; font-size: 21px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink); }
        .nz-fsub { display: block; font-size: 10px; letter-spacing: 0.07em; text-transform: uppercase; font-weight: 700; color: var(--gray-400); margin-top: 2px; }
        .nz-footer-brand p { font-size: 14px; color: var(--gray-400); line-height: 1.7; max-width: 300px; margin-bottom: 18px; }
        .nz-pay { display: flex; gap: 8px; flex-wrap: wrap; }
        .nz-pay span {
          background: var(--cream); border: 1px solid var(--gray-200);
          padding: 8px 13px; border-radius: 8px; font-size: 12px; font-weight: 700; color: var(--ink-2);
        }
        .nz-fcol h5 {
          font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--gray-400); margin-bottom: 16px;
        }
        .nz-fcol :global(a) {
          display: block; color: var(--ink-2); font-size: 14.5px; font-weight: 500;
          margin-bottom: 11px; transition: color .2s;
        }
        .nz-fcol :global(a:hover) { color: var(--red); }
        .nz-footer-bottom {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 26px; padding-bottom: 32px; flex-wrap: wrap; gap: 12px;
        }
        .nz-footer-bottom span { font-size: 13px; color: var(--gray-400); font-weight: 500; }
        @media (max-width: 860px) {
          .nz-footer-top { grid-template-columns: 1fr 1fr; gap: 32px; }
        }
      `}</style>
    </footer>
  );
}
