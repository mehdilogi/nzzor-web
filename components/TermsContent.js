"use client";

import { useMemo } from "react";
import { useLang } from "../lib/LangContext";
import { TERMS } from "../lib/legalTerms";

// A deliberately small markdown renderer.
//
// The terms are stored as markdown so a non-developer can read and amend them,
// and so the published text can be diffed against the version the bank
// reviewed. Pulling in a markdown library for one static document would ship
// a parser to every visitor for no benefit, so this handles exactly the
// constructs the document uses: headings, horizontal rules, tables,
// blockquotes, bullet lists, ordered lists, bold and paragraphs.
//
// Nothing here is user-supplied — the source is a file in this repo — so the
// inline formatter does not need to sanitize, but it still never injects raw
// HTML: bold is emitted as React elements, not dangerouslySetInnerHTML.

function inline(text, keyBase) {
  // **bold** only. Split on the delimiter and alternate.
  const parts = String(text).split("**");
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={`${keyBase}-b${i}`}>{part}</strong> : part
  );
}

function parse(md) {
  const lines = String(md).replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i += 1; continue; }

    // horizontal rule
    if (/^-{3,}$/.test(trimmed)) {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    // headings
    const h = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      blocks.push({ type: "h", level: h[1].length, text: h[2] });
      i += 1;
      continue;
    }

    // table: a header row, a separator row, then body rows
    if (trimmed.startsWith("|") && (lines[i + 1] || "").trim().startsWith("|-")) {
      const head = trimmed.split("|").slice(1, -1).map((c) => c.trim());
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(lines[i].trim().split("|").slice(1, -1).map((c) => c.trim()));
        i += 1;
      }
      // The identification table has empty headers — render it headerless.
      const hasHead = head.some((c) => c.length > 0);
      blocks.push({ type: "table", head: hasHead ? head : null, rows });
      continue;
    }

    // blockquote
    if (trimmed.startsWith(">")) {
      const quote = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quote.push(lines[i].trim().replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push({ type: "quote", text: quote.join(" ") });
      continue;
    }

    // ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ""));
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // bullet list
    if (/^[-•]\s/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[-•]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-•]\s/, ""));
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // paragraph: consume until a blank line or the start of another construct
    const para = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t) break;
      if (/^-{3,}$/.test(t)) break;
      if (/^#{1,4}\s/.test(t)) break;
      if (t.startsWith("|") || t.startsWith(">")) break;
      if (/^\d+\.\s/.test(t) || /^[-•]\s/.test(t)) break;
      para.push(t);
      i += 1;
    }
    // A line wrapped in SINGLE asterisks is the "last updated" note. The
    // negative character classes matter: without them this also matched a
    // fully-bold line like **NZZOR** and stripped one asterisk from each end,
    // leaving the other pair to render as literal text.
    const joined = para.join(" ");
    const em = joined.match(/^\*([^*].*[^*])\*$/);
    if (em) blocks.push({ type: "em", text: em[1] });
    else blocks.push({ type: "p", text: joined });
  }

  return blocks;
}

export default function TermsContent() {
  const { lang, dir } = useLang();

  // Fall back to French rather than showing nothing if an unexpected language
  // code ever reaches this component.
  const md = TERMS[lang] || TERMS.fr;
  const blocks = useMemo(() => parse(md), [md]);

  return (
    <div className="wrap nz-legal" dir={dir}>
      <article className="nz-legal-doc">
        {blocks.map((b, k) => {
          switch (b.type) {
            case "hr":
              return <hr key={k} />;
            case "h": {
              if (b.level === 1) return <h1 key={k} className="display">{inline(b.text, k)}</h1>;
              if (b.level === 2) return <h2 key={k} className="display">{inline(b.text, k)}</h2>;
              if (b.level === 3) return <h3 key={k}>{inline(b.text, k)}</h3>;
              return <h4 key={k}>{inline(b.text, k)}</h4>;
            }
            case "em":
              return <p key={k} className="nz-legal-meta">{inline(b.text, k)}</p>;
            case "quote":
              return <blockquote key={k}>{inline(b.text, k)}</blockquote>;
            case "ul":
              return (
                <ul key={k}>
                  {b.items.map((it, j) => <li key={j}>{inline(it, `${k}-${j}`)}</li>)}
                </ul>
              );
            case "ol":
              return (
                <ol key={k}>
                  {b.items.map((it, j) => <li key={j}>{inline(it, `${k}-${j}`)}</li>)}
                </ol>
              );
            case "table":
              return (
                <div className="nz-legal-tablewrap" key={k}>
                  <table>
                    {b.head && (
                      <thead>
                        <tr>{b.head.map((c, j) => <th key={j}>{inline(c, `${k}-h${j}`)}</th>)}</tr>
                      </thead>
                    )}
                    <tbody>
                      {b.rows.map((row, j) => (
                        <tr key={j}>
                          {row.map((c, x) => <td key={x}>{inline(c, `${k}-${j}-${x}`)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            default:
              return <p key={k}>{inline(b.text, k)}</p>;
          }
        })}
      </article>

      <style jsx>{`
        .nz-legal { padding: 44px 0 90px; }
        .nz-legal-doc {
          max-width: 760px; margin: 0 auto;
          font-size: 15px; line-height: 1.75; color: var(--ink-2, #3a3a38);
        }
        .nz-legal-doc h1 {
          font-size: clamp(26px, 3.4vw, 38px); font-weight: 600;
          letter-spacing: -0.03em; color: var(--ink); line-height: 1.15;
          margin-bottom: 6px;
        }
        .nz-legal-doc h2 {
          font-size: 20px; font-weight: 600; letter-spacing: -0.02em;
          color: var(--ink); margin: 38px 0 12px; line-height: 1.25;
        }
        .nz-legal-doc h3 {
          font-size: 15.5px; font-weight: 700; color: var(--ink);
          margin: 24px 0 8px;
        }
        .nz-legal-doc h4 { font-size: 14.5px; font-weight: 700; color: var(--ink); margin: 20px 0 6px; }
        .nz-legal-doc p { margin-bottom: 14px; }
        .nz-legal-meta { font-size: 13px; color: var(--gray-400); margin-bottom: 26px; }
        .nz-legal-doc ul, .nz-legal-doc ol {
          margin: 0 0 16px; padding-inline-start: 22px;
        }
        .nz-legal-doc li { margin-bottom: 7px; }
        .nz-legal-doc hr {
          border: 0; border-top: 1px solid var(--gray-200); margin: 34px 0;
        }
        /* Used for the clauses quoted verbatim from the merchant agreement —
           the 90-day complaint window and the Arabic-prevalence note. */
        .nz-legal-doc blockquote {
          margin: 0 0 18px; padding: 14px 18px;
          background: var(--cream, #f7f6f2);
          border-inline-start: 3px solid var(--red);
          border-radius: 0 8px 8px 0;
          font-size: 14.5px; color: var(--ink);
        }
        .nz-legal-tablewrap { overflow-x: auto; margin-bottom: 20px; max-width: 100%; }
        .nz-legal-doc table {
          width: 100%; border-collapse: collapse; font-size: 14px;
        }
        .nz-legal-doc th, .nz-legal-doc td {
          padding: 9px 12px; border: 1px solid var(--gray-200);
          text-align: start; vertical-align: top;
        }
        .nz-legal-doc th { background: var(--cream, #f7f6f2); font-weight: 700; color: var(--ink); }
        .nz-legal-doc td:first-child { font-weight: 600; color: var(--ink); white-space: nowrap; }

        /* Arabic renders small at Latin sizes and the document is long. */
        .nz-legal[dir="rtl"] .nz-legal-doc { font-size: 16px; line-height: 1.95; }
        .nz-legal[dir="rtl"] .nz-legal-doc td:first-child { white-space: normal; }

        @media (max-width: 620px) {
          /* The document sets its own inline padding rather than relying on
             .wrap: at this width the text ran to the edges of the screen. */
          .nz-legal { padding: 28px 0 60px; }
          .nz-legal-doc { font-size: 14.5px; padding-inline: 18px; }
          .nz-legal-doc h2 { font-size: 18px; margin-top: 30px; }
          .nz-legal-doc td:first-child { white-space: normal; }
        }
      `}</style>
    </div>
  );
}
