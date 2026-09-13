"use client";

import { useState, useMemo, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import HotelCard from "./HotelCard";
import { useLang } from "../lib/LangContext";
import { parseQuery } from "../lib/nlSearch";
import { getHotelsPaged } from "../lib/api";

const STAR_CHOICES = [5, 4, 3, 2];

// Where an accumulated list is remembered across a back-navigation. Keyed by
// the query string so two different filter sets don't restore into each other.
const SCROLL_KEY = "nzzor:hotels:restore";

// Price slider bounds. Fixed rather than derived: there is no facets endpoint,
// so the real distribution is not available to the client. 50 000 sits above
// every rate in the catalogue and the top of the range means "no ceiling" —
// maxPrice is simply left out of the URL there.
const PRICE_MIN = 0;
const PRICE_MAX = 50000;
const PRICE_STEP = 1000;

// Two labels the i18n dictionary has no keys for. Hardcoded per language
// rather than adding keys, because t() humanises a missing key in production:
// a key present in only one language would ship as English-looking copy in the
// other two instead of failing loudly.
const UI = {
  en: { filters: "Filters", showAll: "Show all" },
  fr: { filters: "Filtres", showAll: "Tout afficher" },
  ar: { filters: "عوامل التصفية", showAll: "عرض الكل" },
};

export default function SearchResults({
  hotels: initialHotels,
  pagination,
  loadError,
  cities,
  perPage = 24,
  initialFilters,
}) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const ui = UI[lang] || UI.fr;

  // Filters live in the URL, never in local state. They used to be local state
  // applied to a client-side array, which capped the catalogue at whatever 50
  // rows the server sent first.
  const city = initialFilters.city || "";
  const stars = Number(initialFilters.stars) || 0;
  const sort = initialFilters.sort || "popular";
  const minPrice = initialFilters.minPrice || "";
  const maxPrice = initialFilters.maxPrice || "";

  const activeTags = useMemo(
    () => (initialFilters.tags ? String(initialFilters.tags).split(",").filter(Boolean) : []),
    [initialFilters.tags]
  );

  const total = pagination?.total ?? initialHotels.length;
  const totalPages = pagination?.totalPages || 1;

  const [rows, setRows] = useState(initialHotels);
  const [loadedPages, setLoadedPages] = useState(pagination?.page || 1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const [sortOpen, setSortOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [wilayaOpen, setWilayaOpen] = useState(false);
  const [wilayaQuery, setWilayaQuery] = useState("");
  const [showAllTags, setShowAllTags] = useState(false);
  const [tagDict, setTagDict] = useState(null);

  // Live slider values. Local so dragging stays smooth; the URL is written on
  // release only, or every pixel of travel would be a server round trip.
  const [priceDraft, setPriceDraft] = useState({
    min: Number(minPrice) || PRICE_MIN,
    max: Number(maxPrice) || PRICE_MAX,
  });
  useEffect(() => {
    setPriceDraft({ min: Number(minPrice) || PRICE_MIN, max: Number(maxPrice) || PRICE_MAX });
  }, [minPrice, maxPrice]);

  const sortRef = useRef(null);
  const wilayaRef = useRef(null);

  useEffect(() => {
    setRows(initialHotels);
    setLoadedPages(pagination?.page || 1);
  }, [initialHotels, pagination]);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${API}/api/hotels/meta/tags`)
      .then((r) => r.json())
      .then((j) => setTagDict(j.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!sortOpen && !wilayaOpen) return;
    function onDown(e) {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
      if (wilayaRef.current && !wilayaRef.current.contains(e.target)) setWilayaOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") { setSortOpen(false); setWilayaOpen(false); setSheetOpen(false); }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [sortOpen, wilayaOpen]);

  // The sheet covers the viewport on mobile; the page behind it must not
  // scroll under the finger.
  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [sheetOpen]);

  const currentQs = useMemo(() => {
    const params = new URLSearchParams();
    if (initialFilters.q) params.set("q", initialFilters.q);
    if (city) params.set("city", city);
    if (stars) params.set("stars", String(stars));
    if (sort && sort !== "popular") params.set("sort", sort);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (activeTags.length) params.set("tags", activeTags.join(","));
    if (initialFilters.ai) params.set("ai", "1");
    return params.toString();
  }, [initialFilters.q, initialFilters.ai, city, stars, sort, minPrice, maxPrice, activeTags]);

  // Restore an accumulated list after a back-navigation: one request for N ×
  // perPage rows rather than replaying N requests, then put the scroll back.
  useEffect(() => {
    let saved = null;
    try {
      saved = JSON.parse(window.sessionStorage.getItem(SCROLL_KEY) || "null");
    } catch { saved = null; }
    if (!saved || saved.qs !== currentQs || !(saved.pages > 1)) return;
    try { window.sessionStorage.removeItem(SCROLL_KEY); } catch { /* ignore */ }

    let cancelled = false;
    setRestoring(true);
    getHotelsPaged({
      lang: "en",
      q: initialFilters.ai ? "" : initialFilters.q,
      city, stars, sort, minPrice, maxPrice,
      tags: activeTags,
      page: 1,
      limit: perPage * saved.pages,
    })
      .then((res) => {
        if (cancelled || res.error) return;
        setRows(res.hotels);
        setLoadedPages(saved.pages);
        requestAnimationFrame(() => window.scrollTo(0, saved.y || 0));
      })
      .finally(() => { if (!cancelled) setRestoring(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function rememberPosition() {
    if (loadedPages <= 1) return;
    try {
      window.sessionStorage.setItem(
        SCROLL_KEY,
        JSON.stringify({ qs: currentQs, pages: loadedPages, y: window.scrollY })
      );
    } catch { /* ignore */ }
  }

  function applyFilters(changes) {
    const next = {
      q: initialFilters.q || "",
      city,
      stars: stars || "",
      sort: sort === "popular" ? "" : sort,
      minPrice,
      maxPrice,
      tags: activeTags.join(","),
      ai: initialFilters.ai ? "1" : "",
      ...changes,
    };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) {
      if (v !== "" && v !== null && v !== undefined && v !== 0) params.set(k, String(v));
    }
    const qs = params.toString();
    setSortOpen(false);
    setWilayaOpen(false);
    try { window.sessionStorage.removeItem(SCROLL_KEY); } catch { /* ignore */ }
    startTransition(() => router.push(qs ? `/hotels?${qs}` : "/hotels"));
  }

  function commitPrice(draft) {
    applyFilters({
      minPrice: draft.min > PRICE_MIN ? String(draft.min) : "",
      // The top of the slider means "no ceiling", not "50 000 exactly".
      maxPrice: draft.max < PRICE_MAX ? String(draft.max) : "",
    });
  }

  async function showMore() {
    if (loadingMore || loadedPages >= totalPages) return;
    setLoadingMore(true);
    const nextPage = loadedPages + 1;
    const res = await getHotelsPaged({
      lang: "en",
      q: initialFilters.ai ? "" : initialFilters.q,
      city, stars, sort, minPrice, maxPrice,
      tags: activeTags,
      page: nextPage,
      limit: perPage,
    });
    if (!res.error && res.hotels.length) {
      setRows((prev) => {
        const seen = new Set(prev.map((h) => h.id));
        return prev.concat(res.hotels.filter((h) => !seen.has(h.id)));
      });
      setLoadedPages(nextPage);
      const qs = currentQs;
      window.history.replaceState(null, "", `/hotels?${qs ? qs + "&" : ""}page=${nextPage}`);
    }
    setLoadingMore(false);
  }

  function toggleTag(key) {
    const next = activeTags.includes(key)
      ? activeTags.filter((k) => k !== key)
      : activeTags.concat(key);
    applyFilters({ tags: next.join(",") });
  }

  function tagLabel(key) {
    if (!tagDict) return key;
    const found = tagDict.find((x) => x.key === key);
    if (!found) return key;
    return found[lang] || found.en || key;
  }

  const aiResult = initialFilters.ai && initialFilters.q ? parseQuery(initialFilters.q) : null;

  function describeMatch(m) {
    if (m.type === "city") return m.displayName || m.value;
    if (m.type === "price") return m.value === "cheap" ? t("ai.cheap") : t("ai.luxury");
    if (m.type === "stars") return `${m.value}${t("ai.stars_label")}`;
    if (m.type === "tag") return tagLabel(m.value);
    return "";
  }

  const wilayaMatches = useMemo(() => {
    const needle = wilayaQuery.trim().toLowerCase();
    if (!needle) return cities;
    return cities.filter((c) => c.name.toLowerCase().includes(needle));
  }, [cities, wilayaQuery]);

  // Ordered by inventory, not alphabetically: the wilayas that actually have
  // somewhere to stay should be met first. Wilayas with nothing are dropped —
  // a destination that returns an empty grid is worse than one not offered.
  const railCities = useMemo(
    () =>
      [...cities]
        .filter((c) => (c.hotelCount ?? 0) > 0)
        .sort((a, b) => (b.hotelCount || 0) - (a.hotelCount || 0)),
    [cities]
  );

  const maxCount = railCities[0]?.hotelCount || 1;

  // Square root, not linear: linear made the deepest wilaya tower over the
  // middle of the list and the row lost its horizon. The 13px floor keeps a
  // single-hotel wilaya readable.
  function railSize(count) {
    const r = Math.sqrt(count) / Math.sqrt(maxCount);
    return {
      fontSize: `${(13 + r * 7).toFixed(1)}px`,
      fontWeight: count > maxCount * 0.45 ? 600 : 500,
      color: count > maxCount * 0.25 ? "var(--ink)" : "var(--ink-2)",
    };
  }

  const railRows = useMemo(
    () =>
      [{ key: "__all", name: t("results.all_dest"), hotelCount: maxCount, value: "" }].concat(
        railCities.map((c) => ({ key: c.key, name: c.name, hotelCount: c.hotelCount, value: c.name }))
      ),
    [railCities, maxCount, t]
  );

  const SORT_OPTIONS = [
    { value: "popular", label: t("results.popular") },
    { value: "price_asc", label: t("results.price_low") },
    { value: "price_desc", label: t("results.price_high") },
    { value: "rating", label: t("results.top_rated") },
  ];
  const sortLabel = (SORT_OPTIONS.find((o) => o.value === sort) || SORT_OPTIONS[0]).label;

  const visibleTags = tagDict ? (showAllTags ? tagDict : tagDict.slice(0, 6)) : [];
  const activeCount = (stars ? 1 : 0) + activeTags.length + (minPrice || maxPrice ? 1 : 0);

  const remaining = Math.max(0, total - rows.length);
  const skeletonCount = Math.min(perPage, remaining) || perPage;
  const showSkeletons = loadingMore || restoring;

  const fmt = (n) =>
    Number(n).toLocaleString(lang === "ar" ? "ar-DZ" : lang === "en" ? "en-GB" : "fr-DZ");

  function checkRow(label, checked, onClick, radio) {
    return (
      <button
        type="button"
        className={`nz-f-row ${checked ? "on" : ""} ${radio ? "radio" : ""}`}
        onClick={onClick}
      >
        <span className="nz-f-box">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <span className="nz-f-lab">{label}</span>
      </button>
    );
  }

  const filterPanel = (
    <>
      <div className="nz-f-grp first">
        <h3>{t("results.filter_price")}</h3>
        <div className="nz-f-slider">
          <div className="nz-f-track" />
          <div
            className="nz-f-range"
            style={{
              insetInlineStart: `${(priceDraft.min / PRICE_MAX) * 100}%`,
              width: `${((priceDraft.max - priceDraft.min) / PRICE_MAX) * 100}%`,
            }}
          />
          <input
            type="range" min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP}
            value={priceDraft.min}
            onChange={(e) =>
              setPriceDraft((p) => ({ ...p, min: Math.min(Number(e.target.value), p.max - PRICE_STEP) }))
            }
            onMouseUp={() => commitPrice(priceDraft)}
            onTouchEnd={() => commitPrice(priceDraft)}
            onKeyUp={(e) => { if (e.key === "Enter") commitPrice(priceDraft); }}
            aria-label={t("results.min_price")}
          />
          <input
            type="range" min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP}
            value={priceDraft.max}
            onChange={(e) =>
              setPriceDraft((p) => ({ ...p, max: Math.max(Number(e.target.value), p.min + PRICE_STEP) }))
            }
            onMouseUp={() => commitPrice(priceDraft)}
            onTouchEnd={() => commitPrice(priceDraft)}
            onKeyUp={(e) => { if (e.key === "Enter") commitPrice(priceDraft); }}
            aria-label={t("results.max_price")}
          />
        </div>
        <div className="nz-f-prices">
          <span>{fmt(priceDraft.min)} <em>DZD</em></span>
          <span>
            {priceDraft.max >= PRICE_MAX ? `${fmt(PRICE_MAX)}+` : fmt(priceDraft.max)} <em>DZD</em>
          </span>
        </div>
      </div>

      <div className="nz-f-grp">
        <h3>{t("results.filter_rating")}</h3>
        {checkRow(t("results.any"), !stars, () => applyFilters({ stars: "" }), true)}
        {STAR_CHOICES.map((sVal) => (
          <div key={sVal}>
            {checkRow("★".repeat(sVal), stars === sVal, () => applyFilters({ stars: sVal }), true)}
          </div>
        ))}
      </div>

      <div className="nz-f-grp">
        <h3>{t("results.filter_amenities")}</h3>
        {visibleTags.map((tg) => (
          <div key={tg.key}>
            {checkRow(
              tg[lang] || tg.en || tg.key,
              activeTags.includes(tg.key),
              () => toggleTag(tg.key)
            )}
          </div>
        ))}
        {tagDict && tagDict.length > 6 && !showAllTags && (
          <button type="button" className="nz-f-more" onClick={() => setShowAllTags(true)}>
            {ui.showAll} ({tagDict.length})
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      <div className="wrap nz-sr-top">
        <h1 className="display">
          {initialFilters.q ? `${t("results.matching")} "${initialFilters.q}"` : t("results.title")}
        </h1>
        <p className="nz-sr-sub">
          {total} {t("results.stays")} · {cities.length} {t("results.wilayas")} · {t("results.verified_by")}
        </p>

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

      <div className="nz-sr-railband">
        <div className="wrap nz-sr-railrow">
          {/* Marquee. The track holds the list twice and slides exactly one
              copy's width, so the loop closes with no visible seam. Hover or
              keyboard focus pauses it — without that every wilaya is a moving
              target and the rail stops being a control. */}
          <div className="nz-sr-rail">
            <div className="nz-sr-track">
              {[false, true].map((ghost) =>
                railRows.map((c) => (
                  <button
                    key={`${ghost ? "g" : "r"}-${c.key}`}
                    type="button"
                    className={`nz-sr-railitem ${city === c.value ? "on" : ""}`}
                    aria-hidden={ghost ? "true" : undefined}
                    tabIndex={ghost ? -1 : undefined}
                    onClick={() => applyFilters({ city: c.value })}
                  >
                    <span className="nz-sr-railname display" style={railSize(c.hotelCount)}>
                      {c.name}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Pinned outside the marquee so it never scrolls away. Someone who
              knows they want Tlemcen should not have to wait for it. */}
          <div className="nz-sr-find" ref={wilayaRef}>
            <button
              type="button"
              className="nz-sr-iconbtn"
              onClick={() => setWilayaOpen((v) => !v)}
              aria-expanded={wilayaOpen}
              aria-label={t("results.search_wilaya")}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" /><path d="M16 16l4.5 4.5" />
              </svg>
            </button>
            {wilayaOpen && (
              <div className="nz-sr-panel end">
                <input
                  type="text"
                  className="nz-sr-search"
                  placeholder={t("results.search_wilaya")}
                  value={wilayaQuery}
                  onChange={(e) => setWilayaQuery(e.target.value)}
                  autoFocus
                />
                <div className="nz-sr-scroll">
                  <button className={`nz-sr-opt ${!city ? "on" : ""}`} onClick={() => applyFilters({ city: "" })}>
                    {t("results.all_dest")}
                  </button>
                  {wilayaMatches.map((c) => (
                    <button
                      key={c.key}
                      className={`nz-sr-opt ${city === c.name ? "on" : ""}`}
                      onClick={() => applyFilters({ city: c.name })}
                    >
                      <span>{c.name}</span>
                      <span className="nz-sr-optcount">{c.hotelCount}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="wrap nz-sr-mobar">
        <button type="button" className="nz-sr-mofilters" onClick={() => setSheetOpen(true)}>
          {ui.filters}{activeCount ? <span className="nz-sr-num">{activeCount}</span> : null}
        </button>
      </div>

      <div className="wrap nz-sr-split">
        <aside className={`nz-sr-side ${sheetOpen ? "open" : ""}`} aria-label={ui.filters}>
          <div className="nz-sr-sidescroll">
            <div className="nz-sr-sidehead">
              <h2>{ui.filters}</h2>
              <button
                className="nz-sr-clear"
                onClick={() => applyFilters({ city: "", stars: "", minPrice: "", maxPrice: "", tags: "" })}
              >
                {t("results.clear_all")}
              </button>
            </div>
            {filterPanel}
          </div>
          <div className="nz-sr-sheetfoot">
            <button className="nz-sr-apply" onClick={() => setSheetOpen(false)}>
              {t("results.showing")} {total}
            </button>
          </div>
        </aside>
        {sheetOpen && <div className="nz-sr-scrim" onClick={() => setSheetOpen(false)} />}

        <div className="nz-sr-results">
          <div className="nz-sr-rhead">
            <p className="nz-sr-count">
              <b>{total}</b> {t("results.stays")}
            </p>
            <div className="nz-sr-sortwrap" ref={sortRef}>
              <button type="button" className="nz-sr-pill" onClick={() => setSortOpen((v) => !v)} aria-expanded={sortOpen}>
                {sortLabel}
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {sortOpen && (
                <div className="nz-sr-panel end narrow">
                  {SORT_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      className={`nz-sr-opt ${sort === o.value ? "on" : ""}`}
                      onClick={() => applyFilters({ sort: o.value === "popular" ? "" : o.value })}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {loadError ? (
            <div className="nz-sr-empty">
              <p className="display">{t("results.error_title")}</p>
              <span>{t("results.error_sub")}</span>
            </div>
          ) : rows.length > 0 ? (
            <>
              <div className={`nz-sr-grid ${isPending ? "pending" : ""}`}>
                {rows.map((h, i) => (
                  <div key={h.id} onClick={rememberPosition}>
                    {/* First row is above the fold on every viewport. */}
                    <HotelCard hotel={h} priority={i < 3} />
                  </div>
                ))}
                {showSkeletons &&
                  Array.from({ length: skeletonCount }).map((_, i) => (
                    <div className="nz-sk" key={`sk-${i}`}>
                      <div className="nz-sk-img" />
                      <div className="nz-sk-line wide" />
                      <div className="nz-sk-line sm" />
                      <div className="nz-sk-line mid" />
                    </div>
                  ))}
              </div>

              <div className="nz-sr-foot">
                <p className="nz-sr-countsm">
                  {t("results.showing")} {rows.length} {t("results.of")} {total}
                </p>
                {loadedPages < totalPages ? (
                  <button className="nz-sr-more" onClick={showMore} disabled={loadingMore}>
                    {t("results.show_more")}
                  </button>
                ) : (
                  <p className="nz-sr-done">{t("results.all_loaded")}</p>
                )}
              </div>
            </>
          ) : (
            <div className="nz-sr-empty">
              <p className="display">{t("results.none_title")}</p>
              <span>{t("results.none_sub")}</span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        /* Horizontal padding is NEVER set with the shorthand in this file.
           Every element below also carries .wrap, which supplies
           padding-left/right. A shorthand "padding: Xpx 0 Ypx" silently resets
           that to zero — which is how the heading, the filter bar and the
           results grid previously ended up on three different left edges.
           Longhand padding-top / padding-bottom only. */
        .nz-sr-top { padding-top: 34px; padding-bottom: 16px; }
        .nz-sr-top h1 {
          font-size: clamp(26px, 3vw, 38px); font-weight: 600;
          letter-spacing: -0.03em; color: var(--ink);
        }
        .nz-sr-sub { color: var(--gray-400); font-size: 13.5px; font-weight: 500; margin-top: 6px; }

        .nz-ai-banner { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
        .nz-ai-banner-label { font-size: 13px; font-weight: 600; color: var(--gray-400); }
        .nz-ai-chip {
          font-size: 13px; font-weight: 700; color: #fff;
          background: var(--red); padding: 5px 13px; border-radius: 980px;
        }
        .nz-ai-banner-note {
          font-size: 13.5px; font-weight: 500; color: var(--gray-400);
          line-height: 1.5; max-width: 560px;
        }

        /* ---- wilaya marquee ---- */
        .nz-sr-railband { border-bottom: 1px solid var(--gray-200); }
        .nz-sr-railrow {
          display: flex; align-items: center; gap: 10px;
          padding-top: 10px; padding-bottom: 10px;
        }
        .nz-sr-rail {
          position: relative; flex: 1; min-width: 0; overflow: hidden;
          -webkit-mask-image: linear-gradient(to right, transparent 0, #000 48px, #000 calc(100% - 48px), transparent 100%);
          mask-image: linear-gradient(to right, transparent 0, #000 48px, #000 calc(100% - 48px), transparent 100%);
        }
        .nz-sr-track {
          display: flex; align-items: baseline; width: max-content; padding: 2px 0;
          animation: nz-rail 80s linear infinite;
        }
        .nz-sr-rail:hover .nz-sr-track,
        .nz-sr-rail:focus-within .nz-sr-track { animation-play-state: paused; }
        @keyframes nz-rail {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        /* No motion: fall back to a scrollable row so every wilaya stays
           reachable rather than parked off-screen forever. */
        @media (prefers-reduced-motion: reduce) {
          .nz-sr-rail { overflow-x: auto; scrollbar-width: none; }
          .nz-sr-rail::-webkit-scrollbar { display: none; }
          .nz-sr-track { animation: none; width: auto; }
        }
        .nz-sr-railitem {
          flex: 0 0 auto; border: 0; background: none; cursor: pointer;
          padding: 8px 14px; border-radius: 980px; white-space: nowrap;
          font-family: inherit; transition: background .15s;
        }
        .nz-sr-railitem:hover { background: var(--cream); }
        .nz-sr-railitem.on { background: var(--red-soft); }
        .nz-sr-railname { letter-spacing: -0.02em; line-height: 1; }
        /* The size and colour are inline (they encode the hotel count), so the
           selected state needs the weight to win. */
        .nz-sr-railitem.on .nz-sr-railname { color: var(--red-deep) !important; }

        .nz-sr-find { position: relative; flex: 0 0 auto; }
        .nz-sr-iconbtn {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 8px 10px; border-radius: 980px; cursor: pointer;
          border: 1.5px solid var(--gray-200); background: var(--white); color: var(--ink);
          font-family: inherit; transition: border-color .15s;
        }
        .nz-sr-iconbtn:hover { border-color: var(--ink); }

        /* ---- split ---- */
        .nz-sr-split {
          display: grid; grid-template-columns: 268px minmax(0, 1fr); gap: 34px;
          padding-top: 24px; padding-bottom: 90px;
        }
        .nz-sr-side {
          position: sticky; top: 20px; align-self: start;
          max-height: calc(100vh - 40px); overflow-y: auto;
          scrollbar-width: none; -ms-overflow-style: none;
        }
        /* No visible scrollbar: parked in the gap between the two columns it
           reads as an unintended vertical rule dividing the page. */
        .nz-sr-side::-webkit-scrollbar { width: 0; height: 0; display: none; }
        .nz-sr-sidehead { display: flex; align-items: baseline; justify-content: space-between; }
        .nz-sr-sidehead h2 { font-size: 14.5px; font-weight: 700; color: var(--ink); }
        .nz-sr-clear {
          border: 0; background: none; cursor: pointer; font-family: inherit;
          font-size: 12px; font-weight: 600; color: var(--gray-400);
          text-decoration: underline; text-underline-offset: 3px; padding: 4px 0;
        }
        .nz-sr-clear:hover { color: var(--ink); }
        .nz-sr-sheetfoot { display: none; }

        .nz-f-grp { padding-top: 18px; padding-bottom: 18px; border-top: 1px solid var(--gray-100); }
        .nz-f-grp.first { border-top: 0; }
        .nz-f-grp h3 { font-size: 13px; font-weight: 700; margin-bottom: 12px; color: var(--ink); }

        /* Checkbox rows rather than pill tiles: in a 268px column tiles wrap
           into a ragged mess. */
        .nz-f-row {
          display: flex; align-items: center; gap: 9px; width: 100%;
          padding: 6px 0; border: 0; background: none; cursor: pointer;
          text-align: start; font-family: inherit;
        }
        .nz-f-box {
          flex: 0 0 auto; width: 17px; height: 17px; border-radius: 5px;
          border: 1.5px solid var(--gray-300); display: flex;
          align-items: center; justify-content: center; transition: all .12s;
        }
        .nz-f-row.radio .nz-f-box { border-radius: 50%; }
        .nz-f-row:hover .nz-f-box { border-color: var(--ink); }
        .nz-f-row.on .nz-f-box { background: var(--ink); border-color: var(--ink); }
        .nz-f-box :global(svg) { opacity: 0; color: #fff; }
        .nz-f-row.on .nz-f-box :global(svg) { opacity: 1; }
        .nz-f-lab { flex: 1; font-size: 13px; font-weight: 500; color: var(--ink); }
        .nz-f-more {
          border: 0; background: none; cursor: pointer; font-family: inherit;
          font-size: 12.5px; font-weight: 700; color: var(--ink);
          text-decoration: underline; text-underline-offset: 3px; padding-top: 8px;
        }

        .nz-f-slider { position: relative; height: 24px; }
        .nz-f-track {
          position: absolute; top: 10px; inset-inline: 0; height: 3px;
          background: var(--gray-200); border-radius: 2px;
        }
        .nz-f-range { position: absolute; top: 10px; height: 3px; background: var(--ink); border-radius: 2px; }
        .nz-f-slider input {
          position: absolute; top: 0; inset-inline-start: 0; width: 100%; height: 24px;
          margin: 0; background: none; pointer-events: none;
          -webkit-appearance: none; appearance: none;
        }
        .nz-f-slider input::-webkit-slider-thumb {
          -webkit-appearance: none; pointer-events: auto;
          width: 18px; height: 18px; border-radius: 50%;
          background: var(--white); border: 2px solid var(--ink);
          cursor: grab; box-shadow: var(--shadow-md);
        }
        .nz-f-slider input::-moz-range-thumb {
          pointer-events: auto; width: 18px; height: 18px; border-radius: 50%;
          background: var(--white); border: 2px solid var(--ink);
          cursor: grab; box-shadow: var(--shadow-md);
        }
        .nz-f-prices {
          display: flex; justify-content: space-between; margin-top: 8px;
          font-size: 12.5px; font-weight: 700; color: var(--ink);
          font-variant-numeric: tabular-nums;
        }
        .nz-f-prices em { font-style: normal; font-size: 10.5px; color: var(--gray-400); }

        /* ---- results column ---- */
        .nz-sr-rhead {
          display: flex; align-items: center; justify-content: space-between;
          gap: 14px; padding-bottom: 18px;
        }
        .nz-sr-count { font-size: 13.5px; color: var(--gray-400); font-weight: 500; }
        .nz-sr-count b { color: var(--ink); font-weight: 700; font-size: 15px; }
        .nz-sr-sortwrap { position: relative; }
        .nz-sr-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 15px; border-radius: 980px; font-size: 13px; font-weight: 600;
          border: 1.5px solid var(--gray-200); background: var(--white); color: var(--ink);
          cursor: pointer; font-family: inherit; white-space: nowrap; transition: border-color .15s;
        }
        .nz-sr-pill:hover { border-color: var(--ink); }

        .nz-sr-panel {
          position: absolute; top: calc(100% + 8px); inset-inline-start: 0; z-index: 50;
          width: 280px; background: var(--white); border: 1px solid var(--gray-200);
          border-radius: var(--r-md); box-shadow: var(--shadow-md); padding: 10px;
        }
        .nz-sr-panel.narrow { width: 220px; }
        /* Anchored to the trailing edge so a right-hand control's panel does
           not run off the viewport. Logical properties, so it flips in Arabic. */
        .nz-sr-panel.end { inset-inline-start: auto; inset-inline-end: 0; }
        .nz-sr-search {
          width: 100%; padding: 9px 12px; border: 1.5px solid var(--gray-200);
          border-radius: var(--r-sm); font-size: 13px; font-family: inherit;
          outline: none; margin-bottom: 8px; color: var(--ink);
        }
        .nz-sr-search:focus { border-color: var(--ink); }
        .nz-sr-scroll { max-height: 260px; overflow-y: auto; }
        .nz-sr-opt {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          width: 100%; padding: 9px 11px; border: 0; background: none; cursor: pointer;
          font-size: 13px; font-weight: 500; color: var(--ink); text-align: start;
          border-radius: var(--r-sm); font-family: inherit;
        }
        .nz-sr-opt:hover { background: var(--cream); }
        .nz-sr-opt.on { background: var(--red-soft); color: var(--red-deep); font-weight: 700; }
        .nz-sr-optcount { font-size: 11.5px; color: var(--gray-400); }

        .nz-sr-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px 22px; }
        .nz-sr-grid.pending { opacity: .45; transition: opacity .15s; pointer-events: none; }

        /* Opacity pulse rather than a shimmer sweep: a moving gradient repaints
           every frame, which is expensive on the low-end Android hardware most
           of this traffic runs on. Opacity is composited. */
        @keyframes nzskpulse { 0%, 100% { opacity: 1 } 50% { opacity: .5 } }
        .nz-sk { animation: nzskpulse 1.6s ease-in-out infinite; }
        /* Must match HotelCard's media box, or every "show more" jolts the
           layout as placeholders resolve into shorter cards. */
        .nz-sk-img { aspect-ratio: 3 / 2; background: var(--gray-100, #eee); border-radius: 14px; }
        .nz-sk-line { height: 10px; background: var(--gray-100, #eee); border-radius: 4px; margin-top: 10px; }
        .nz-sk-line.wide { width: 78%; }
        .nz-sk-line.mid { width: 62%; }
        .nz-sk-line.sm { height: 8px; margin-top: 7px; width: 50%; }

        .nz-sr-foot { display: flex; flex-direction: column; align-items: center; gap: 14px; margin-top: 40px; }
        .nz-sr-countsm { font-size: 13px; color: var(--gray-400); font-weight: 500; }
        .nz-sr-more {
          padding: 13px 34px; border: 1.5px solid var(--ink); background: var(--white);
          color: var(--ink); border-radius: 980px; font-size: 14px; font-weight: 700;
          cursor: pointer; font-family: inherit; transition: all .15s;
        }
        .nz-sr-more:hover:not(:disabled) { background: var(--ink); color: #fff; }
        .nz-sr-more:disabled { opacity: .5; cursor: default; }
        .nz-sr-done { font-size: 13px; color: var(--gray-400); font-weight: 500; }

        .nz-sr-empty { text-align: center; padding-top: 80px; padding-bottom: 80px; }
        .nz-sr-empty p { font-size: 22px; font-weight: 600; color: var(--ink); margin-bottom: 8px; }
        .nz-sr-empty span { font-size: 14px; color: var(--gray-400); }

        /* ---- mobile ---- */
        .nz-sr-mobar { display: none; }
        .nz-sr-mofilters {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 17px; border-radius: 980px; border: 1.5px solid var(--ink);
          background: var(--ink); color: #fff; font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: inherit;
        }
        .nz-sr-num {
          min-width: 17px; height: 17px; border-radius: 980px; background: var(--red);
          color: #fff; font-size: 10.5px; font-weight: 700; display: inline-flex;
          align-items: center; justify-content: center; padding: 0 5px;
        }
        .nz-sr-scrim { position: fixed; inset: 0; background: rgba(15,17,26,.5); z-index: 80; }

        @media (max-width: 1100px) {
          .nz-sr-split { grid-template-columns: 232px minmax(0, 1fr); gap: 24px; }
        }
        @media (max-width: 980px) {
          .nz-sr-mobar { display: block; padding-top: 14px; }
          .nz-sr-split { grid-template-columns: 1fr; }
          .nz-sr-side {
            position: fixed; inset-inline: 0; bottom: 0; top: auto;
            height: 86vh; max-height: 86vh; background: var(--white); z-index: 90;
            border-radius: 22px 22px 0 0;
            padding-top: 20px; padding-bottom: 0; padding-inline: 20px;
            transform: translateY(103%); transition: transform .28s cubic-bezier(.16,1,.3,1);
            box-shadow: 0 -20px 60px -20px rgba(20,20,30,.3);
            display: flex; flex-direction: column;
          }
          .nz-sr-side.open { transform: translateY(0); }
          .nz-sr-sidescroll { flex: 1; overflow-y: auto; }
          .nz-sr-sheetfoot {
            display: flex; padding-top: 14px; padding-bottom: 14px;
            border-top: 1px solid var(--gray-200);
          }
          .nz-sr-apply {
            flex: 1; padding: 13px; border: 0; border-radius: 980px;
            background: var(--ink); color: #fff; font-size: 14px; font-weight: 700;
            cursor: pointer; font-family: inherit;
          }
          .nz-sr-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 560px) {
          .nz-sr-grid { grid-template-columns: 1fr; }
          .nz-sr-top { padding-top: 22px; }
        }
      `}</style>
    </>
  );
}
