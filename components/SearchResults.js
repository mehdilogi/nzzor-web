"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import HotelCard from "./HotelCard";
import { useLang } from "../lib/LangContext";
import { parseQuery } from "../lib/nlSearch";

// Page numbers to render: always the first and last, plus a window around the
// current page, with gaps marked. Keeps the control a fixed width however
// large the catalogue grows.
function pageWindow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out = [1];
  const from = Math.max(2, current - 1);
  const to = Math.min(total - 1, current + 1);
  if (from > 2) out.push("gap");
  for (let n = from; n <= to; n++) out.push(n);
  if (to < total - 1) out.push("gap");
  out.push(total);
  return out;
}

// The filters and the page number live in the URL, not in component state.
//
// They used to be local state applied to a client-side array, which quietly
// capped the entire catalogue at whatever 50 hotels the server sent first:
// picking a wilaya filtered those 50, it did not search the other 85. Driving
// everything through the URL means the server does the filtering it was always
// able to do, results are linkable and indexable, and the back button works.
export default function SearchResults({ hotels, pagination, loadError, cities, initialFilters }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const city = initialFilters.city || "";
  const stars = Number(initialFilters.stars) || 0;
  const sort = initialFilters.sort || "popular";
  const [tagDict, setTagDict] = useState(null);

  const page = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 1;
  const total = pagination?.total ?? hotels.length;

  // tags arrive on the URL as comma-separated keys
  const activeTags = useMemo(
    () => (initialFilters.tags ? String(initialFilters.tags).split(",").filter(Boolean) : []),
    [initialFilters.tags]
  );

  // fetch the tag dictionary once so we can localize tag labels in chips
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${API}/api/hotels/meta/tags`).then((r) => r.json()).then((j) => setTagDict(j.data || [])).catch(() => {});
  }, []);

  function tagLabel(key) {
    if (!tagDict) return key;
    const found = tagDict.find((x) => x.key === key);
    if (!found) return key;
    return found[lang] || found.en || key;
  }

  // Rebuilds the query string and navigates. Any filter change resets to page
  // one — staying on page 4 of a result set that now has two pages shows an
  // empty grid and looks broken.
  function applyFilters(changes) {
    const next = {
      q: initialFilters.q || "",
      city,
      stars: stars || "",
      sort: sort === "popular" ? "" : sort,
      maxPrice: initialFilters.maxPrice || "",
      minPrice: initialFilters.minPrice || "",
      tags: initialFilters.tags || "",
      ai: initialFilters.ai ? "1" : "",
      page: "",
      ...changes,
    };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) {
      if (v !== "" && v !== null && v !== undefined && v !== 0) params.set(k, String(v));
    }
    const qs = params.toString();
    startTransition(() => router.push(qs ? `/hotels?${qs}` : "/hotels"));
  }

  function goToPage(n) {
    applyFilters({ page: n > 1 ? n : "" });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // when arriving from natural-language search, re-parse the raw query so we
  // can show the user what we understood
  const aiResult = initialFilters.ai && initialFilters.q
    ? parseQuery(initialFilters.q)
    : null;

  function describeMatch(m) {
    // For cities, the parser stores the URL-safe key in `value` (e.g.
    // "setif") and the human-readable name in `displayName` (e.g. "Sétif").
    // The banner chip should always show the pretty name.
    if (m.type === "city") return m.displayName || m.value;
    if (m.type === "price") return m.value === "cheap" ? t("ai.cheap") : t("ai.luxury");
    if (m.type === "stars") return `${m.value}${t("ai.stars_label")}`;
    if (m.type === "tag") return tagLabel(m.value);
    return "";
  }

  // No client-side filtering or sorting any more. `hotels` is exactly what the
  // API returned for the current filters and page, so what the customer sees
  // is the true result set rather than a subset of the first 50 rows.

  return (
    <>
      {/* page header */}
      <div className="nz-sr-head">
        <div className="wrap">
          <h1 className="display">
            {initialFilters.q ? `${t("results.matching")} "${initialFilters.q}"` : t("results.title")}
          </h1>
          {/* The real total from the API, not the length of the current page.
              This line previously said "50 hotels" because it counted the
              array it had been handed. */}
          <p>{total} {total === 1 ? t("search.hotel") : t("search.hotels")} · {t("results.verified_by")}</p>

          {aiResult && (
            <div className="nz-ai-banner">
              {aiResult.understood ? (
                <>
                  <span className="nz-ai-banner-label">{t("ai.understood")}</span>
                  {aiResult.matched.map((m, i) => (
                    <span className="nz-ai-chip" key={i}>{describeMatch(m)}</span>
                  ))}
                </>
              ) : (
                <span className="nz-ai-banner-note">{t("ai.not_understood")}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="wrap nz-sr-body">
        {/* filter bar */}
        <div className="nz-sr-filters">
          <select value={city} onChange={(e) => applyFilters({ city: e.target.value })}>
            <option value="">{t("results.all_dest")}</option>
            {cities.map((c) => (
              <option key={c.key} value={c.name}>{c.name} ({c.hotelCount})</option>
            ))}
          </select>

          <div className="nz-sr-stars">
            {[0, 3, 4, 5].map((s) => (
              <button
                key={s}
                className={stars === s ? "on" : ""}
                onClick={() => applyFilters({ stars: s || "" })}
              >
                {s === 0 ? t("results.any") : "★".repeat(s) + "+"}
              </button>
            ))}
          </div>

          <select
            className="nz-sr-sort"
            value={sort}
            onChange={(e) => applyFilters({ sort: e.target.value === "popular" ? "" : e.target.value })}
          >
            <option value="popular">{t("results.popular")}</option>
            <option value="price_asc">{t("results.price_low")}</option>
            <option value="price_desc">{t("results.price_high")}</option>
            <option value="rating">{t("results.top_rated")}</option>
          </select>
        </div>

        {/* results */}
        {loadError ? (
          <div className="nz-sr-empty">
            <p className="display">{t("results.error_title")}</p>
            <span>{t("results.error_sub")}</span>
          </div>
        ) : hotels.length > 0 ? (
          <>
            <div className={`nz-sr-grid ${isPending ? "pending" : ""}`}>
              {hotels.map((h) => <HotelCard key={h.id} hotel={h} />)}
            </div>

            {totalPages > 1 && (
              <nav className="nz-sr-pager" aria-label="Pagination">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1 || isPending}
                  aria-label={t("results.prev")}
                >
                  ‹
                </button>

                {/* A sliding window rather than every page number: at 135
                    hotels this is six pages, but the catalogue is meant to
                    grow and a row of thirty buttons is unusable on a phone. */}
                {pageWindow(page, totalPages).map((n, i) =>
                  n === "gap" ? (
                    <span className="nz-sr-gap" key={`gap-${i}`}>…</span>
                  ) : (
                    <button
                      key={n}
                      className={n === page ? "on" : ""}
                      onClick={() => goToPage(n)}
                      disabled={isPending}
                      aria-current={n === page ? "page" : undefined}
                    >
                      {n}
                    </button>
                  )
                )}

                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages || isPending}
                  aria-label={t("results.next")}
                >
                  ›
                </button>
              </nav>
            )}
          </>
        ) : (
          <div className="nz-sr-empty">
            <p className="display">{t("results.none_title")}</p>
            <span>{t("results.none_sub")}</span>
          </div>
        )}
      </div>

      <style>{`
        .nz-sr-head { background: var(--ink); color: #fff; padding: 48px 0; }
        .nz-sr-head h1 { font-size: clamp(30px, 4vw, 46px); font-weight: 600; letter-spacing: -0.03em; }
        .nz-sr-head p { color: rgba(255,255,255,0.6); margin-top: 8px; font-size: 14px; font-weight: 500; }
        .nz-ai-banner {
          display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
          margin-top: 18px;
        }
        .nz-ai-banner-label {
          font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.55);
        }
        .nz-ai-chip {
          font-size: 13px; font-weight: 700; color: #fff;
          background: var(--red); padding: 5px 13px; border-radius: 980px;
        }
        .nz-ai-banner-note {
          font-size: 13.5px; font-weight: 500; color: rgba(255,255,255,0.75);
          line-height: 1.5; max-width: 560px;
        }
        .nz-sr-body { padding-top: 28px; padding-bottom: 80px; }
        .nz-sr-filters {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
          padding: 16px; background: var(--white); border: 1px solid var(--gray-200);
          border-radius: var(--r-md); margin-bottom: 28px; box-shadow: var(--shadow-sm);
        }
        .nz-sr-filters select {
          padding: 9px 14px; border: 1.5px solid var(--gray-200); border-radius: var(--r-sm);
          font-size: 13px; font-weight: 600; outline: none; color: var(--ink); background: var(--white);
        }
        .nz-sr-sort { margin-inline-start: auto; }
        .nz-sr-stars { display: flex; gap: 4px; }
        .nz-sr-stars button {
          padding: 7px 13px; border-radius: 980px; font-size: 12px; font-weight: 700;
          border: 1.5px solid var(--gray-200); background: var(--white); color: var(--gray-400);
          transition: all .15s;
        }
        .nz-sr-stars button.on { border-color: var(--red); background: var(--red-soft); color: var(--red-deep); }

        /* Four across on desktop, stepping down rather than jumping straight
           to a single column — three-up at laptop widths, two-up on tablets. */
        .nz-sr-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px; }

        /* Dim the grid while the next page is being fetched so a slow
           connection does not look like a dead click. */
        .nz-sr-grid.pending { opacity: .45; transition: opacity .15s; pointer-events: none; }

        .nz-sr-pager {
          display: flex; align-items: center; justify-content: center;
          gap: 6px; margin-top: 40px; flex-wrap: wrap;
        }
        .nz-sr-pager button {
          min-width: 38px; height: 38px; padding: 0 10px;
          border: 1.5px solid var(--gray-200); background: var(--white);
          border-radius: 10px; font-size: 13px; font-weight: 700;
          color: var(--ink); cursor: pointer; transition: all .15s;
          font-family: inherit;
        }
        .nz-sr-pager button:hover:not(:disabled) { border-color: var(--ink); }
        .nz-sr-pager button.on {
          background: var(--ink); border-color: var(--ink); color: #fff;
        }
        .nz-sr-pager button:disabled { opacity: .35; cursor: default; }
        .nz-sr-gap { color: var(--gray-400); padding: 0 2px; font-size: 13px; }

        .nz-sr-empty { text-align: center; padding: 80px 0; }
        .nz-sr-empty p { font-size: 22px; font-weight: 600; color: var(--ink); margin-bottom: 8px; }
        .nz-sr-empty span { font-size: 14px; color: var(--gray-400); }

        @media (max-width: 1240px) {
          .nz-sr-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 980px) {
          .nz-sr-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 860px) {
          .nz-sr-sort { margin-inline-start: 0; }
        }
        @media (max-width: 560px) {
          .nz-sr-head { padding: 32px 0; }
          .nz-sr-head h1 { font-size: 26px; }
          .nz-sr-grid { grid-template-columns: 1fr; }
          .nz-sr-filters { flex-direction: column; align-items: stretch; gap: 10px; }
          .nz-sr-filters select { width: 100%; }
          .nz-sr-stars { justify-content: space-between; }
          .nz-sr-stars button { flex: 1; text-align: center; }
        }
      `}</style>
    </>
  );
}
