"use client";

// =============================================================================
// InfoPage — the layout for Nzzor's information pages (privacy, contact, FAQ).
// -----------------------------------------------------------------------------
// Content comes in as { fr, en, ar }, each:
//   { title, updated?, intro?, cards?: [{ label, value, href? }],
//     sections: [{ h, p?: [string], list?: [string] }] }
// The page follows the visitor's language from LangContext, switches to RTL
// for Arabic, and falls back to French (the reference language of the CGV,
// with Arabic, under Art. 7.2.2 of the merchant agreement).
// =============================================================================

import { useLang } from "../lib/LangContext";

export default function InfoPage({ content }) {
  const { lang } = useLang();
  const c = content[lang] || content.fr;
  const rtl = lang === "ar";

  return (
    <main className="ip" dir={rtl ? "rtl" : "ltr"} lang={lang}>
      <div className="wrap ip-wrap">
        <header className="ip-head">
          <h1 className="display">{c.title}</h1>
          {c.updated && <p className="ip-updated">{c.updated}</p>}
          {c.intro && <p className="ip-intro">{c.intro}</p>}
        </header>

        {c.cards && c.cards.length > 0 && (
          <div className="ip-cards">
            {c.cards.map((card, i) => (
              <div className="ip-card" key={i}>
                <span className="ip-card-label">{card.label}</span>
                {card.href
                  ? <a className="ip-card-value" href={card.href} target={card.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" dir="ltr">{card.value}</a>
                  : <span className="ip-card-value">{card.value}</span>}
                {card.note && <span className="ip-card-note">{card.note}</span>}
              </div>
            ))}
          </div>
        )}

        <div className="ip-body">
          {c.sections.map((s, i) => (
            <section className="ip-sec" key={i} id={s.id}>
              <h2 className="display">{s.h}</h2>
              {(s.p || []).map((para, j) => <p key={j}>{para}</p>)}
              {s.list && (
                <ul>
                  {s.list.map((li, j) => <li key={j}>{li}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>

      <style jsx>{`
        .ip { background: var(--cream, #FAF8F4); min-height: 70vh; }
        .ip-wrap { max-width: 860px; padding-top: 56px; padding-bottom: 88px; }
        .ip-head { margin-bottom: 36px; }
        .ip-head h1 { font-size: clamp(32px, 4.4vw, 48px); font-weight: 600; letter-spacing: -0.03em; line-height: 1.05; color: var(--ink); margin: 0; }
        .ip-updated { margin: 12px 0 0; font-size: 12.5px; font-weight: 600; color: var(--gray-400); }
        .ip-intro { margin: 18px 0 0; font-size: 16.5px; line-height: 1.7; color: var(--ink-2); max-width: 680px; }
        .ip-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; margin-bottom: 40px; }
        .ip-card { background: #fff; border: 1px solid var(--gray-200); border-radius: var(--r-lg, 14px); padding: 18px 20px; display: flex; flex-direction: column; gap: 6px; }
        .ip-card-label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gray-400); }
        .ip-card-value { font-size: 16px; font-weight: 700; color: var(--ink); text-decoration: none; word-break: break-word; }
        a.ip-card-value:hover { color: var(--red); }
        .ip-card-note { font-size: 12.5px; color: var(--gray-400); line-height: 1.5; }
        .ip-body { background: #fff; border: 1px solid var(--gray-200); border-radius: var(--r-lg, 14px); padding: 8px 36px 16px; }
        .ip-sec { padding: 26px 0; border-bottom: 1px solid var(--gray-100); }
        .ip-sec:last-child { border-bottom: none; }
        .ip-sec h2 { font-size: 20px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink); margin: 0 0 12px; }
        .ip-sec p { font-size: 15px; line-height: 1.75; color: var(--ink-2); margin: 0 0 10px; }
        .ip-sec ul { margin: 6px 0 0; padding-inline-start: 20px; }
        .ip-sec li { font-size: 15px; line-height: 1.7; color: var(--ink-2); margin-bottom: 6px; }
        @media (max-width: 640px) {
          .ip-wrap { padding-top: 32px; padding-bottom: 72px; }
          .ip-body { padding: 4px 20px 10px; }
          .ip-sec { padding: 20px 0; }
        }
      `}</style>
    </main>
  );
}
