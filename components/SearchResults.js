"use client";

import { useState, useMemo, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import HotelCard from "./HotelCard";
import { useLang } from "../lib/LangContext";
import { parseQuery } from "../lib/nlSearch";
import { getHotelsPaged } from "../lib/api";

const STAR_CHOICES = [3, 4, 5];

// Where an accumulated list is remembered across a back-navigation. Keyed by
// the query string so two different filter sets don't restore into each other.
const SCROLL_KEY = "nzzor:hotels:restore";

// Used only as a starting value; the real offset is measured from the nav on
// mount. The nav is position:fixed, so a sticky bar at top:0 hides under it.
const NAV_FALLBACK_PX = 64;

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

  // Filters are read from the URL, never held as local state. They used to be
  // local state applied to a client-side array, which capped the catalogue at
  // whatever 50 rows the server sent first: picking a wilaya filtered those
  // 50, it did not search the other 85.
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

  // The accumulating list. Page 1 arrives server-rendered; "show more" appends.
  const [rows, setRows] = useState(initialHotels);
  const [loadedPages, setLoadedPages] = useState(pagination?.page || 1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const [openPanel, setOpenPanel] = useState(null);
  const [wilayaQuery, setWilayaQuery] = useState("");
  const [priceDraft, setPriceDraft] = useState({ min: minPrice, max: maxPrice });
  const [tagDict, setTagDict] = useState(null);
  const [barTop, setBarTop] = useState(NAV_FALLBACK_PX);
  const filterBarRef = useRef(null);
  const railRef = useRef(null);

  // A new server render (filter change, or a direct ?page= hit) replaces the
  // accumulated list entirely — those results are genuinely different rows.
  useEffect(() => {
    setRows(initialHotels);
    setLoadedPages(pagination?.page || 1);
  }, [initialHotels, pagination]);

  // localize amenity labels
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${API}/api/hotels/meta/tags`)
      .then((r) => r.json())
      .then((j) => setTagDict(j.data || []))
      .catch(() => {});
  }, []);

  // The nav is fixed, so "sticky at the top of the viewport" is the wrong
  // target — the bar has to stop below the nav instead. Measured rather than
  // hardcoded so it survives any nav height change, including the taller
  // Arabic rendering.
  useEffect(() => {
    function measure() {
      const nav = document.querySelector(".nzn");
      const h = nav ? Math.round(nav.getBoundingClientRect().height) : 0;
      setBarTop(h || NAV_FALLBACK_PX);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // close a popover on outside click or Escape
  useEffect(() => {
    if (!openPanel) return;
    function onDown(e) {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target)) setOpenPanel(null);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpenPanel(null);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openPanel]);

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

  // Restore an accumulated list after a back-navigation. Rather than replaying
  // N requests we ask for one page of N × perPage rows, then put the scroll
  // position back. Without this, coming back from a hotel page drops the guest
  // at the top of a 24-item list having lost the 72 they had loaded — which is
  // what makes badly-built infinite lists worse than plain pagination.
  useEffect(() => {
    let saved = null;
    try {
      saved = JSON.parse(window.sessionStorage.getItem(SCROLL_KEY) || "null");
    } catch {
      saved = null;
    }
    if (!saved || saved.qs !== currentQs || !(saved.pages > 1)) return;
    try {
      window.sessionStorage.removeItem(SCROLL_KEY);
    } catch {
      /* ignore */
    }

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
      .finally(() => {
        if (!cancelled) setRestoring(false);
      });

    return () => { cancelled = true; };
    // Runs once per mount; currentQs identifies the filter set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function rememberPosition() {
    if (loadedPages <= 1) return;
    try {
      window.sessionStorage.setItem(
        SCROLL_KEY,
        JSON.stringify({ qs: currentQs, pages: loadedPages, y: window.scrollY })
      );
    } catch {
      /* ignore */
    }
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
    setOpenPanel(null);
    try {
      window.sessionStorage.removeItem(SCROLL_KEY);
    } catch {
      /* ignore */
    }
    startTransition(() => router.push(qs ? `/hotels?${qs}` : "/hotels"));
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
      // Guard against a duplicate id slipping in if the ordering shifts between
      // requests — React would warn, and the guest would see the same hotel twice.
      setRows((prev) => {
        const seen = new Set(prev.map((h) => h.id));
        return prev.concat(res.hotels.filter((h) => !seen.has(h.id)));
      });
      setLoadedPages(nextPage);
      // Keep the URL truthful without a navigation, so a refresh or a shared
      // link lands on a page that actually contains what was on screen.
      const qs = currentQs;
      const url = `/hotels?${qs ? qs + "&" : ""}page=${nextPage}`;
      window.history.replaceState(null, "", url);
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
    // For cities the parser stores the URL-safe key in `value` ("setif") and
    // the readable name in `displayName` ("Sétif"). Chips show the pretty one.
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

  // Ordered by inventory, not alphabetically. A guest scanning the rail should
  // meet the wilayas that actually have somewhere to stay first; an A–Z list
  // leads with Adrar and buries Béjaïa. Empty wilayas are dropped entirely —
  // a destination that returns nothing is worse than a destination absent.
  const railCities = useMemo(
    () =>
      [...cities]
        .filter((c) => (c.hotelCount ?? 0) > 0)
        .sort((a, b) => (b.hotelCount || 0) - (a.hotelCount || 0)),
    [cities]
  );

  // Bring the selected wilaya into view when arriving on a filtered URL —
  // otherwise a shared link to Tindouf opens with the rail scrolled to Béjaïa
  // and nothing visibly selected. scrollLeft rather than scrollIntoView, which
  // would also scroll the page vertically.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const el = rail.querySelector('[data-active="true"]');
    if (!el) return;
    rail.scrollLeft = el.offsetLeft - rail.clientWidth / 2 + el.clientWidth / 2;
  }, [city]);

  const SORT_OPTIONS = [
    { value: "popular", label: t("results.popular") },
    { value: "price_asc", label: t("results.price_low") },
    { value: "price_desc", label: t("results.price_high") },
    { value: "rating", label: t("results.top_rated") },
  ];
  const sortLabel = (SORT_OPTIONS.find((o) => o.value === sort) || SORT_OPTIONS[0]).label;

  const chips = [];
  if (city) chips.push({ label: city, clear: { city: "" } });
  if (stars) chips.push({ label: `${stars}★ ${t("results.and_up")}`, clear: { stars: "" } });
  if (minPrice || maxPrice) {
    chips.push({
      label: `${minPrice || "0"} – ${maxPrice || "∞"} DZD`,
      clear: { minPrice: "", maxPrice: "" },
    });
  }
  activeTags.forEach((k) => {
    chips.push({ label: tagLabel(k), clear: { tags: activeTags.filter((x) => x !== k).join(",") } });
  });

  const wilayaCount = cities.length;
  const remaining = Math.max(0, total - rows.length);
  const skeletonCount = Math.min(perPage, remaining) || perPage;
  const showSkeletons = loadingMore || restoring;

  return (
    <>
      <div className="wrap nz-sr-top">
        <div className="nz-sr-titlerow">
          <h1 className="display">
            {initialFilters.q ? `${t("results.matching")} "${initialFilters.q}"` : t("results.title")}
          </h1>
          {/* The real total from the API, not the length of what is on
              screen. This line previously read "50 hotels" because it
              counted the array it had been handed. */}
          <p className="nz-sr-sub">
            {total} {t("results.stays")} · {wilayaCount} {t("results.wilayas")} · {t("results.verified_by")}
          </p>
        </div>

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

      {/* `top` is the measured nav height — see the effect above. */}
      <div className="nz-sr-bar" ref={filterBarRef} style={{ top: barTop }}>
        <div className="wrap nz-sr-barinner">
          {/* Destination is not a peer of rating and price. In this market
              people search a place first and refine second, so wilaya gets
              the full row, with live inventory counts. The counts are doing
              double duty: they are a useful filter signal, and they are the
              coverage argument the whole brand rests on. */}
          <div className="nz-sr-railrow">
            <div className="nz-sr-rail" ref={railRef}>
              <button
                className={`nz-sr-railitem ${!city ? "on" : ""}`}
                data-active={!city ? "true" : "false"}
                onClick={() => applyFilters({ city: "" })}
              >
                <span className="nz-sr-railname">{t("results.all_dest")}</span>
                <span className="nz-sr-railcount">{total}</span>
              </button>

              {railCities.map((c) => (
                <button
                  key={c.key}
                  className={`nz-sr-railitem ${city === c.name ? "on" : ""}`}
                  data-active={city === c.name ? "true" : "false"}
                  onClick={() => applyFilters({ city: c.name })}
                >
                  <span className="nz-sr-railname">{c.name}</span>
                  <span className="nz-sr-railcount">{c.hotelCount}</span>
                </button>
              ))}
            </div>

            {/* Pinned outside the scroller so it never scrolls away. 47
                wilayas is a long rail; someone who knows they want Tlemcen
                should not have to swipe to it. */}
            <div className="nz-sr-pillwrap nz-sr-railfind">
              <button
                className="nz-sr-pill icon"
                onClick={() => setOpenPanel(openPanel === "wilaya" ? null : "wilaya")}
                aria-expanded={openPanel === "wilaya"}
                aria-label={t("results.search_wilaya")}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M16 16l4.5 4.5" />
                </svg>
              </button>
              {openPanel === "wilaya" && (
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
                    <button
                      className={`nz-sr-opt ${!city ? "on" : ""}`}
                      onClick={() => applyFilters({ city: "" })}
                    >
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

          <div className="nz-sr-controls">
            <div className="nz-sr-pills">
              <div className="nz-sr-pillwrap">
                <button
                  className={`nz-sr-pill ${stars ? "on" : ""}`}
                  onClick={() => setOpenPanel(openPanel === "stars" ? null : "stars")}
                  aria-expanded={openPanel === "stars"}
                >
                  {stars ? `${stars}★+` : t("results.filter_rating")}
                </button>
                {openPanel === "stars" && (
                  <div className="nz-sr-panel narrow">
                    <button
                      className={`nz-sr-opt ${!stars ? "on" : ""}`}
                      onClick={() => applyFilters({ stars: "" })}
                    >
                      {t("results.any")}
                    </button>
                    {STAR_CHOICES.map((s) => (
                      <button
                        key={s}
                        className={`nz-sr-opt ${stars === s ? "on" : ""}`}
                        onClick={() => applyFilters({ stars: s })}
                      >
                        {"★".repeat(s)}+
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="nz-sr-pillwrap">
                <button
                  className={`nz-sr-pill ${minPrice || maxPrice ? "on" : ""}`}
                  onClick={() => setOpenPanel(openPanel === "price" ? null : "price")}
                  aria-expanded={openPanel === "price"}
                >
                  {t("results.filter_price")}
                </button>
                {openPanel === "price" && (
                  <div className="nz-sr-panel narrow">
                    <div className="nz-sr-prices">
                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        placeholder={t("results.min_price")}
                        value={priceDraft.min}
                        onChange={(e) => setPriceDraft({ ...priceDraft, min: e.target.value })}
                      />
                      <span>–</span>
                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        placeholder={t("results.max_price")}
                        value={priceDraft.max}
                        onChange={(e) => setPriceDraft({ ...priceDraft, max: e.target.value })}
                      />
                    </div>
                    <button
                      className="nz-sr-applybtn"
                      onClick={() => applyFilters({ minPrice: priceDraft.min, maxPrice: priceDraft.max })}
                    >
                      {t("results.apply")}
                    </button>
                  </div>
                )}
              </div>

              <div className="nz-sr-pillwrap">
                <button
                  className={`nz-sr-pill ${activeTags.length ? "on" : ""}`}
                  onClick={() => setOpenPanel(openPanel === "tags" ? null : "tags")}
                  aria-expanded={openPanel === "tags"}
                >
                  {t("results.filter_amenities")}
                </button>
                {openPanel === "tags" && (
                  <div className="nz-sr-panel">
                    <div className="nz-sr-scroll">
                      {(tagDict || []).map((tg) => (
                        <button
                          key={tg.key}
                          className={`nz-sr-opt ${activeTags.includes(tg.key) ? "on" : ""}`}
                          onClick={() => toggleTag(tg.key)}
                        >
                          {tg[lang] || tg.en || tg.key}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Was a native <select>. A browser-chrome dropdown sitting beside
                hand-built pills is most of what made this bar look unfinished. */}
            <div className="nz-sr-pillwrap nz-sr-sortwrap">
              <button
                className="nz-sr-pill caret"
                onClick={() => setOpenPanel(openPanel === "sort" ? null : "sort")}
                aria-expanded={openPanel === "sort"}
              >
                {sortLabel}
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {openPanel === "sort" && (
                <div className="nz-sr-panel narrow end">
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

          {chips.length > 0 && (
            <div className="nz-sr-chips">
              {chips.map((c, i) => (
                <button key={i} className="nz-sr-chip" onClick={() => applyFilters(c.clear)}>
                  {c.label} <span aria-hidden="true">×</span>
                </button>
              ))}
              <button className="nz-sr-clear" onClick={() => applyFilters({ city: "", stars: "", minPrice: "", maxPrice: "", tags: "" })}>
                {t("results.clear_all")}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="wrap nz-sr-body">
        {loadError ? (
          <div className="nz-sr-empty">
            <p className="display">{t("results.error_title")}</p>
            <span>{t("results.error_sub")}</span>
          </div>
        ) : rows.length > 0 ? (
          <>
            {/* A filter change replaces these rows, so dimming is honest.
                "Show more" appends below and must NOT dim what is already
                on screen — those cards are not going anywhere. */}
            <div className={`nz-sr-grid ${isPending ? "pending" : ""}`}>
              {rows.map((h, i) => (
                <div key={h.id} onClick={rememberPosition}>
                  {/* The first row is above the fold on every viewport, so
                      those images load eagerly; everything else stays lazy. */}
                  <HotelCard hotel={h} priority={i < 4} />
                </div>
              ))}

              {showSkeletons &&
                Array.from({ length: skeletonCount }).map((_, i) => (
                  <div className="nz-sk" key={`sk-${i}`} style={{ animationDelay: `${(i % 4) * 0.12}s` }}>
                    <div className="nz-sk-img" />
                    <div className="nz-sk-line" style={{ width: "78%" }} />
                    <div className="nz-sk-line sm" style={{ width: "50%" }} />
                    <div className="nz-sk-line" style={{ width: "62%" }} />
                  </div>
                ))}
            </div>

            <div className="nz-sr-foot">
              <p className="nz-sr-count">
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

      <style jsx>{`
        /* Was a raw <style> tag. Unscoped, and injected after globals.css, so
           every rule here silently outranked a .wrap rule of equal specificity
           — which is exactly how the padding below went wrong. */

        /* Horizontal padding is NEVER set here. These elements also carry
           .wrap, which supplies padding-left/right: 52px (20px under 720px).
           The old shorthand `padding: 34px 0 18px` reset that to zero, which
           is why the heading and the filter bar sat ~52px to the left of the
           card grid. Longhand only, from here on. */
        .nz-sr-top { padding-top: 34px; padding-bottom: 18px; }
        .nz-sr-titlerow { display: flex; flex-direction: column; gap: 6px; }
        .nz-sr-top h1 {
          font-size: clamp(26px, 3vw, 38px); font-weight: 600;
          letter-spacing: -0.03em; color: var(--ink);
        }
        .nz-sr-sub { color: var(--gray-400); font-size: 13.5px; font-weight: 500; }

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

        /* `top` is set inline from the measured nav height. The nav is fixed,
           so top:0 parked this underneath it and the bar was never actually
           reachable once the page scrolled. */
        .nz-sr-bar {
          position: sticky; z-index: 40;
          background: var(--white); border-bottom: 1px solid var(--gray-200);
        }
        .nz-sr-barinner { padding-top: 10px; padding-bottom: 10px; }

        /* ---- wilaya rail ---- */
        .nz-sr-railrow { display: flex; align-items: center; gap: 10px; }
        .nz-sr-rail {
          flex: 1; min-width: 0;
          display: flex; align-items: stretch; gap: 2px;
          overflow-x: auto; overflow-y: hidden;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .nz-sr-rail::-webkit-scrollbar { display: none; }

        .nz-sr-railitem {
          flex: 0 0 auto;
          display: inline-flex; align-items: baseline; gap: 6px;
          padding: 8px 13px; border: 0; background: none; cursor: pointer;
          border-radius: 980px; font-family: inherit; white-space: nowrap;
          color: var(--gray-400); transition: background .15s, color .15s;
        }
        .nz-sr-railname { font-size: 13.5px; font-weight: 600; color: var(--ink); }
        .nz-sr-railcount {
          font-size: 11.5px; font-weight: 600; color: var(--gray-300);
          font-variant-numeric: tabular-nums;
        }
        .nz-sr-railitem:hover { background: var(--cream); }
        /* Ink rather than red: red is already carrying the score pill, the CTA
           and the active-filter chips. A rail of red would flatten all of it. */
        .nz-sr-railitem.on { background: var(--ink); }
        .nz-sr-railitem.on .nz-sr-railname { color: #fff; }
        .nz-sr-railitem.on .nz-sr-railcount { color: rgba(255,255,255,0.6); }

        .nz-sr-railfind { flex: 0 0 auto; }

        .nz-sr-controls {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; margin-top: 8px;
        }
        .nz-sr-pills { display: flex; gap: 8px; min-width: 0; }
        .nz-sr-pillwrap { position: relative; }
        .nz-sr-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 15px; border-radius: 980px; font-size: 13px; font-weight: 600;
          border: 1.5px solid var(--gray-200); background: var(--white); color: var(--ink);
          cursor: pointer; font-family: inherit; transition: all .15s; white-space: nowrap;
        }
        .nz-sr-pill.icon { padding: 8px 10px; }
        .nz-sr-pill:hover { border-color: var(--ink); }
        .nz-sr-pill.on { border-color: var(--red); background: var(--red-soft); color: var(--red-deep); }
        .nz-sr-sortwrap { flex: 0 0 auto; }

        .nz-sr-panel {
          position: absolute; top: calc(100% + 8px); inset-inline-start: 0; z-index: 50;
          width: 290px; background: var(--white); border: 1px solid var(--gray-200);
          border-radius: var(--r-md); box-shadow: var(--shadow-md); padding: 10px;
        }
        .nz-sr-panel.narrow { width: 220px; }
        /* Anchors to the trailing edge so a right-hand control's panel does not
           run off the viewport. Logical properties, so it flips in Arabic. */
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
        .nz-sr-prices { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .nz-sr-prices input {
          width: 100%; padding: 9px 11px; border: 1.5px solid var(--gray-200);
          border-radius: var(--r-sm); font-size: 13px; font-family: inherit;
          outline: none; color: var(--ink);
        }
        .nz-sr-prices span { color: var(--gray-400); }
        .nz-sr-applybtn {
          width: 100%; padding: 9px; border: 0; background: var(--ink); color: #fff;
          border-radius: var(--r-sm); font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: inherit;
        }

        .nz-sr-chips { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-top: 9px; }
        .nz-sr-chip {
          padding: 6px 12px; border-radius: 980px; border: 0;
          background: var(--red-soft); color: var(--red-deep);
          font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit;
        }
        .nz-sr-clear {
          border: 0; background: none; cursor: pointer; font-family: inherit;
          font-size: 12px; font-weight: 600; color: var(--gray-400);
          text-decoration: underline; text-underline-offset: 3px; padding: 6px 4px;
        }
        .nz-sr-clear:hover { color: var(--ink); }

        .nz-sr-body { padding-top: 26px; padding-bottom: 80px; }
        .nz-sr-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 22px; }
        .nz-sr-grid.pending { opacity: .45; transition: opacity .15s; pointer-events: none; }

        /* Opacity pulse rather than a shimmer sweep: a moving gradient repaints
           every frame, which is expensive on the low-end Android hardware most
           of our traffic runs on. Opacity is composited. */
        @keyframes nzskpulse { 0%, 100% { opacity: 1 } 50% { opacity: .5 } }
        .nz-sk { animation: nzskpulse 1.6s ease-in-out infinite; }
        /* Must match HotelCard's media box. It was 4/5 against the card's 3/2,
           so every "show more" jolted the layout as placeholders resolved into
           shorter cards. */
        .nz-sk-img { aspect-ratio: 3 / 2; background: var(--gray-100, #eee); border-radius: 14px; }
        .nz-sk-line { height: 10px; background: var(--gray-100, #eee); border-radius: 4px; margin-top: 10px; }
        .nz-sk-line.sm { height: 8px; margin-top: 7px; }

        .nz-sr-foot {
          display: flex; flex-direction: column; align-items: center; gap: 14px; margin-top: 40px;
        }
        .nz-sr-count { font-size: 13px; color: var(--gray-400); font-weight: 500; }
        .nz-sr-more {
          padding: 13px 34px; border: 1.5px solid var(--ink); background: var(--white);
          color: var(--ink); border-radius: 980px; font-size: 14px; font-weight: 700;
          cursor: pointer; font-family: inherit; transition: all .15s;
        }
        .nz-sr-more:hover:not(:disabled) { background: var(--ink); color: #fff; }
        .nz-sr-more:disabled { opacity: .5; cursor: default; }
        .nz-sr-done { font-size: 13px; color: var(--gray-400); font-weight: 500; }

        .nz-sr-empty { text-align: center; padding: 80px 0; }
        .nz-sr-empty p { font-size: 22px; font-weight: 600; color: var(--ink); margin-bottom: 8px; }
        .nz-sr-empty span { font-size: 14px; color: var(--gray-400); }

        @media (max-width: 1240px) { .nz-sr-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 980px)  { .nz-sr-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 620px) {
          .nz-sr-top { padding-top: 22px; padding-bottom: 14px; }
          /* The refinements scroll sideways here; the rail above already does.
             Two scrollers is acceptable because they carry different jobs and
             sit on different rows. */
          .nz-sr-pills { overflow-x: auto; scrollbar-width: none; }
          .nz-sr-pills::-webkit-scrollbar { display: none; }
          .nz-sr-panel { width: 260px; }
          .nz-sr-railitem { padding: 7px 11px; }
        }
        @media (max-width: 520px) {
          .nz-sr-grid { grid-template-columns: 1fr; }
          .nz-sk-img { aspect-ratio: 16 / 10; }
        }
      `}</style>
    </>
  );
}
