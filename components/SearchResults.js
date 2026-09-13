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

// Price slider bounds. The ceiling comes from the facets endpoint, which
// reports the most expensive hotel in the catalogue rounded up to a whole
// bucket. The fallback only applies if that call failed. The top of the range
// means "no ceiling" — maxPrice is left out of the URL there, so a new hotel
// priced above today's maximum is never silently excluded.
const PRICE_MIN = 0;
const PRICE_FALLBACK_MAX = 50000;
const PRICE_STEP = 500;

// Two labels the i18n dictionary has no keys for. Hardcoded per language
// rather than adding keys, because t() humanises a missing key in production:
// a key present in only one language would ship as English-looking copy in the
// other two instead of failing loudly.
const UI = {
  en: {
    filters: "Filters", showAll: "Show all",
    where: "Where", dates: "Check in — check out", addDates: "Add dates",
    guests: "Guests", guest: "guest", guestPl: "guests", room: "room", roomPl: "rooms",
    adults: "Guests", adultsSub: "Adults and children",
    roomsLabel: "Rooms", roomsSub: "Each room is booked separately",
    dow: ["M", "T", "W", "T", "F", "S", "S"],
    pickOut: "Pick a check-out date.",
    noAvail: "Dates are carried through to your booking. They do not filter the list yet.",
  },
  fr: {
    filters: "Filtres", showAll: "Tout afficher",
    where: "Où", dates: "Arrivée — départ", addDates: "Ajouter des dates",
    guests: "Voyageurs", guest: "voyageur", guestPl: "voyageurs", room: "chambre", roomPl: "chambres",
    adults: "Voyageurs", adultsSub: "Adultes et enfants",
    roomsLabel: "Chambres", roomsSub: "Chaque chambre est réservée séparément",
    dow: ["L", "M", "M", "J", "V", "S", "D"],
    pickOut: "Choisissez une date de départ.",
    noAvail: "Les dates sont reprises lors de la réservation. Elles ne filtrent pas encore la liste.",
  },
  ar: {
    filters: "عوامل التصفية", showAll: "عرض الكل",
    where: "الوجهة", dates: "الوصول — المغادرة", addDates: "أضف التواريخ",
    guests: "النزلاء", guest: "نزيل", guestPl: "نزلاء", room: "غرفة", roomPl: "غرف",
    adults: "النزلاء", adultsSub: "بالغون وأطفال",
    roomsLabel: "الغرف", roomsSub: "تُحجز كل غرفة على حدة",
    dow: ["ن", "ث", "ر", "خ", "ج", "س", "ح"],
    pickOut: "اختر تاريخ المغادرة.",
    noAvail: "تُنقل التواريخ إلى الحجز، لكنها لا تُصفّي القائمة بعد.",
  },
};

// Local calendar date <-> YYYY-MM-DD, without going through Date.toISOString.
// toISOString converts to UTC first, so a date picked late in the evening in
// Algiers comes back as the previous day.
function toKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fromKey(k) {
  if (!k) return null;
  const [y, m, d] = String(k).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
// Monday-first grid. Returns nulls for the leading blanks so the markup can
// map over one flat array instead of nesting loops in JSX.
function monthCells(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return Array.from({ length: lead }, () => null).concat(
    Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))
  );
}

export default function SearchResults({
  hotels: initialHotels,
  pagination,
  loadError,
  cities,
  facets,
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

  // Booking context, carried in the URL and forwarded to the hotel page by
  // HotelCard. These do NOT filter the list — getHotelsPaged takes no dates —
  // so the panel says so rather than implying availability has been checked.
  const checkIn = initialFilters.checkIn || "";
  const checkOut = initialFilters.checkOut || "";
  const adults = Number(initialFilters.adults) || 2;
  const roomCount = Number(initialFilters.rooms) || 1;

  const [openField, setOpenField] = useState(null);
  const [calMonth, setCalMonth] = useState(() => fromKey(checkIn) || new Date());
  const [draftAdults, setDraftAdults] = useState(adults);
  const [draftRooms, setDraftRooms] = useState(roomCount);
  useEffect(() => { setDraftAdults(adults); setDraftRooms(roomCount); }, [adults, roomCount]);

  const [sortOpen, setSortOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [wilayaOpen, setWilayaOpen] = useState(false);
  const [wilayaQuery, setWilayaQuery] = useState("");
  const [showAllTags, setShowAllTags] = useState(false);
  const [tagDict, setTagDict] = useState(null);

  // Live slider values. Local so dragging stays smooth; the URL is written on
  // release only, or every pixel of travel would be a server round trip.
  const priceMax = facets?.price?.max || PRICE_FALLBACK_MAX;
  const buckets = facets?.price?.buckets || [];
  const peak = buckets.reduce((m, b) => Math.max(m, b.count), 0) || 1;

  const [priceDraft, setPriceDraft] = useState({
    min: Number(minPrice) || PRICE_MIN,
    max: Number(maxPrice) || priceMax,
  });
  useEffect(() => {
    setPriceDraft({ min: Number(minPrice) || PRICE_MIN, max: Number(maxPrice) || priceMax });
  }, [minPrice, maxPrice, priceMax]);

  const sortRef = useRef(null);
  const wilayaRef = useRef(null);
  const ctxRef = useRef(null);

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
    if (!sortOpen && !wilayaOpen && !openField) return;
    function onDown(e) {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
      if (wilayaRef.current && !wilayaRef.current.contains(e.target)) setWilayaOpen(false);
      if (ctxRef.current && !ctxRef.current.contains(e.target)) setOpenField(null);
    }
    function onKey(e) {
      if (e.key === "Escape") {
        setSortOpen(false); setWilayaOpen(false); setSheetOpen(false); setOpenField(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [sortOpen, wilayaOpen, openField]);

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
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (adults !== 2) params.set("adults", String(adults));
    if (roomCount !== 1) params.set("rooms", String(roomCount));
    if (city) params.set("city", city);
    if (stars) params.set("stars", String(stars));
    if (sort && sort !== "popular") params.set("sort", sort);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (activeTags.length) params.set("tags", activeTags.join(","));
    if (initialFilters.ai) params.set("ai", "1");
    return params.toString();
  }, [initialFilters.q, initialFilters.ai, city, stars, sort, minPrice, maxPrice, activeTags,
      checkIn, checkOut, adults, roomCount]);

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
      // Booking context survives every filter change. Losing the guest's dates
      // because they ticked "pool" is the kind of thing nobody reports and
      // everybody resents.
      checkIn, checkOut,
      adults: adults !== 2 ? adults : "",
      rooms: roomCount !== 1 ? roomCount : "",
      ...changes,
    };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) {
      if (v !== "" && v !== null && v !== undefined && v !== 0) params.set(k, String(v));
    }
    const qs = params.toString();
    setSortOpen(false);
    setWilayaOpen(false);
    setOpenField(null);
    try { window.sessionStorage.removeItem(SCROLL_KEY); } catch { /* ignore */ }
    startTransition(() => router.push(qs ? `/hotels?${qs}` : "/hotels"));
  }

  function commitPrice(draft) {
    applyFilters({
      minPrice: draft.min > PRICE_MIN ? String(draft.min) : "",
      // The top of the slider means "no ceiling", not "the current maximum".
      maxPrice: draft.max < priceMax ? String(draft.max) : "",
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

  // The wilaya's name in the language being read. `name` stays the canonical
  // English value — it is what goes in the URL and what the API matches on —
  // so only the label changes, never the filter.
  const cityLabel = useMemo(() => {
    const key = lang === "ar" ? "nameAr" : lang === "fr" ? "nameFr" : "nameEn";
    return (c) => (c && (c[key] || c.name)) || "";
  }, [lang]);

  // The URL holds the English name; the field and chips have to show the
  // reader's language, so map it back through the cities list.
  const selectedCityLabel = useMemo(() => {
    if (!city) return "";
    const match = cities.find((c) => c.name === city);
    return match ? cityLabel(match) : city;
  }, [city, cities, cityLabel]);

  const wilayaMatches = useMemo(() => {
    const needle = wilayaQuery.trim().toLowerCase();
    if (!needle) return cities;
    // Match against every name, so typing "قسنطينة" or "Constantine" both work
    // whichever language the site is in.
    return cities.filter((c) =>
      [c.name, c.nameEn, c.nameFr, c.nameAr]
        .filter(Boolean)
        .some((n) => String(n).toLowerCase().includes(needle))
    );
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

  // `weight` drives the type size, `count` is the number printed above the
  // name. They differ only for "All Algeria": it is sized like the deepest
  // wilaya so it reads as the head of the list, but it shows the catalogue
  // total. That total comes from summing the cities rather than from the
  // filtered result count, which would make it shrink to the selected wilaya's
  // own number the moment one was picked.
  const catalogueTotal = useMemo(
    () => railCities.reduce((n, c) => n + (c.hotelCount || 0), 0),
    [railCities]
  );

  const railRows = useMemo(
    () =>
      [{ key: "__all", name: t("results.all_dest"), weight: maxCount, count: catalogueTotal, value: "" }].concat(
        railCities.map((c) => ({
          key: c.key,
          name: cityLabel(c),
          weight: c.hotelCount,
          count: c.hotelCount,
          // Canonical English name — the filter value, never the label.
          value: c.name,
        }))
      ),
    [railCities, maxCount, catalogueTotal, cityLabel, t]
  );

  const SORT_OPTIONS = [
    { value: "popular", label: t("results.popular") },
    { value: "price_asc", label: t("results.price_low") },
    { value: "price_desc", label: t("results.price_high") },
    { value: "rating", label: t("results.top_rated") },
  ];
  const sortLabel = (SORT_OPTIONS.find((o) => o.value === sort) || SORT_OPTIONS[0]).label;

  // Ordered by how many hotels actually carry the tag, and tags nothing
  // matches are dropped entirely. The dictionary order is arbitrary, and an
  // amenity that returns zero results is a dead end dressed as a choice.
  const rankedTags = useMemo(() => {
    if (!tagDict) return [];
    const counts = facets?.tags || null;
    const list = counts ? tagDict.filter((tg) => (counts[tg.key] || 0) > 0) : tagDict;
    if (!counts) return list;
    return [...list].sort((a, b) => (counts[b.key] || 0) - (counts[a.key] || 0));
  }, [tagDict, facets]);
  const visibleTags = showAllTags ? rankedTags : rankedTags.slice(0, 6);
  const activeCount = (stars ? 1 : 0) + activeTags.length + (minPrice || maxPrice ? 1 : 0);

  const remaining = Math.max(0, total - rows.length);
  const skeletonCount = Math.min(perPage, remaining) || perPage;
  const showSkeletons = loadingMore || restoring;

  const locale = lang === "ar" ? "ar-DZ" : lang === "en" ? "en-GB" : "fr-DZ";
  const fmt = (n) => Number(n).toLocaleString(locale);
  const fmtDay = (d) =>
    d ? d.toLocaleDateString(locale, { day: "numeric", month: "short" }) : "";

  const ci = fromKey(checkIn);
  const co = fromKey(checkOut);
  const datesLabel = ci && co ? `${fmtDay(ci)} — ${fmtDay(co)}` : ci ? `${fmtDay(ci)} — …` : "";
  const guestsLabel =
    `${adults} ${adults === 1 ? ui.guest : ui.guestPl} · ${roomCount} ${roomCount === 1 ? ui.room : ui.roomPl}`;
  const cells = monthCells(calMonth);
  const monthLabel = calMonth.toLocaleDateString(locale, { month: "long", year: "numeric" });
  // Midnight today, so "today" is selectable and yesterday is not.
  const today = new Date(); today.setHours(0, 0, 0, 0);

  function pickDate(d) {
    if (!ci || co) { applyFilters({ checkIn: toKey(d), checkOut: "" }); return; }
    if (d > ci) { applyFilters({ checkOut: toKey(d) }); setOpenField(null); return; }
    applyFilters({ checkIn: toKey(d), checkOut: "" });
  }

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

      {/* Where / when / who. This is the booking, not a filter — which is why
          it sits in its own row above the rail rather than competing with
          amenities for attention. Dates and occupancy are written to the URL
          and forwarded to the hotel page by HotelCard; they do not filter the
          list, because getHotelsPaged takes no dates. The calendar says so
          rather than implying availability has been checked. */}
      <div className="nz-sr-ctx">
        <div className="wrap">
          <div className="nz-sr-ctxbar" ref={ctxRef}>
            <div className={`nz-sr-field ${openField === "where" ? "open" : ""}`}>
              <button type="button" onClick={() => setOpenField(openField === "where" ? null : "where")}>
                <span className="lb">{ui.where}</span>
                <span className={`vl ${city ? "" : "ph"}`}>
                  {selectedCityLabel || t("results.all_dest")}
                </span>
              </button>
              {openField === "where" && (
                <div className="nz-sr-panel">
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
                        <span>{cityLabel(c)}</span>
                        <span className="nz-sr-optcount">{c.hotelCount}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={`nz-sr-field ${openField === "dates" ? "open" : ""}`}>
              <button type="button" onClick={() => setOpenField(openField === "dates" ? null : "dates")}>
                <span className="lb">{ui.dates}</span>
                <span className={`vl ${datesLabel ? "" : "ph"}`}>{datesLabel || ui.addDates}</span>
              </button>
              {openField === "dates" && (
                <div className="nz-sr-panel cal">
                  <div className="nz-sr-calhead">
                    <button
                      type="button"
                      aria-label="−"
                      onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}
                    >‹</button>
                    <b>{monthLabel}</b>
                    <button
                      type="button"
                      aria-label="+"
                      onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}
                    >›</button>
                  </div>
                  <div className="nz-sr-calgrid">
                    {ui.dow.map((d, i) => (
                      <span className="dow" key={`d${i}`}>{d}</span>
                    ))}
                    {cells.map((d, i) =>
                      d === null ? (
                        <span key={`b${i}`} />
                      ) : (
                        <button
                          key={toKey(d)}
                          type="button"
                          disabled={d < today}
                          className={
                            (ci && d.getTime() === ci.getTime()) || (co && d.getTime() === co.getTime())
                              ? "edge"
                              : ci && co && d > ci && d < co
                              ? "mid"
                              : ""
                          }
                          onClick={() => pickDate(d)}
                        >
                          {d.getDate()}
                        </button>
                      )
                    )}
                  </div>
                  <p className="nz-sr-calnote">{ci && !co ? ui.pickOut : ui.noAvail}</p>
                </div>
              )}
            </div>

            <div className={`nz-sr-field ${openField === "guests" ? "open" : ""}`}>
              <button type="button" onClick={() => setOpenField(openField === "guests" ? null : "guests")}>
                <span className="lb">{ui.guests}</span>
                <span className="vl">{guestsLabel}</span>
              </button>
              {openField === "guests" && (
                <div className="nz-sr-panel narrow">
                  <div className="nz-sr-step">
                    <span>
                      <b>{ui.adults}</b>
                      <em>{ui.adultsSub}</em>
                    </span>
                    <span className="ctrl">
                      <button type="button" disabled={draftAdults <= 1} onClick={() => setDraftAdults((n) => Math.max(1, n - 1))}>−</button>
                      <i>{draftAdults}</i>
                      <button type="button" disabled={draftAdults >= 16} onClick={() => setDraftAdults((n) => Math.min(16, n + 1))}>+</button>
                    </span>
                  </div>
                  <div className="nz-sr-step">
                    <span>
                      <b>{ui.roomsLabel}</b>
                      <em>{ui.roomsSub}</em>
                    </span>
                    <span className="ctrl">
                      <button type="button" disabled={draftRooms <= 1} onClick={() => setDraftRooms((n) => Math.max(1, n - 1))}>−</button>
                      <i>{draftRooms}</i>
                      <button type="button" disabled={draftRooms >= 8} onClick={() => setDraftRooms((n) => Math.min(8, n + 1))}>+</button>
                    </span>
                  </div>
                  <button
                    type="button"
                    className="nz-sr-applybtn"
                    onClick={() =>
                      applyFilters({
                        adults: draftAdults !== 2 ? draftAdults : "",
                        rooms: draftRooms !== 1 ? draftRooms : "",
                      })
                    }
                  >
                    {t("results.apply")}
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className="nz-sr-go"
              aria-label={t("results.search_wilaya")}
              onClick={() => setOpenField(null)}
            >
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" /><path d="M16 16l4.5 4.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="nz-sr-railband">
        <div className="wrap nz-sr-railrow">
          {/* Marquee. The track holds the list twice and slides exactly one
              copy's width, so the loop closes with no visible seam. Hover or
              keyboard focus pauses it — without that every wilaya is a moving
              target and the rail stops being a control. */}
          <div className="nz-sr-rail">
            {/* Arabic reverses the flex axis: the track lays out from the
                right and overflows to the LEFT, so the default keyframe drags
                it away from the viewport and the rail runs empty. The class
                swaps in a mirrored keyframe. It cannot be done with an inline
                animationName — styled-jsx rewrites @keyframes names, so a raw
                name set from JS matches nothing. */}
            <div className={`nz-sr-track ${lang === "ar" ? "rtl" : ""}`}>
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
                    <span className="nz-sr-railname display" style={railSize(c.weight)}>
                      {c.name}
                    </span>
                    <span className="nz-sr-railcount">{c.count}</span>
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
                      <span>{cityLabel(c)}</span>
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

            {/* Inlined, not built in a helper. styled-jsx under SWC only adds
                its scoping class to JSX in the component's return path, so
                JSX returned from a function or held in a const arrives with
                class names that no rule matches — the whole filter column
                rendered as raw browser defaults. Same family as the next/link
                trap already documented in this codebase. Do not extract these
                rows into a component-local helper. */}

            <div className="nz-f-grp first">
              <h3>{t("results.filter_price")}</h3>
              {/* The distribution, so the range means something before it is
                  touched. Bars inside the selection go dark. Heights are
                  relative to the tallest bucket, not absolute, or a catalogue
                  with one dominant price band would render as a flat line. */}
              {buckets.length > 0 && (
                <div className="nz-f-hist" aria-hidden="true">
                  {buckets.map((b) => (
                    <i
                      key={b.from}
                      className={b.from >= priceDraft.min && b.from < priceDraft.max ? "in" : ""}
                      style={{ height: `${Math.max(4, (b.count / peak) * 100)}%` }}
                    />
                  ))}
                </div>
              )}
              <div className="nz-f-slider">
                <div className="nz-f-track" />
                <div
                  className="nz-f-range"
                  style={{
                    insetInlineStart: `${(priceDraft.min / priceMax) * 100}%`,
                    width: `${((priceDraft.max - priceDraft.min) / priceMax) * 100}%`,
                  }}
                />
                <input
                  type="range" min={PRICE_MIN} max={priceMax} step={PRICE_STEP}
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
                  type="range" min={PRICE_MIN} max={priceMax} step={PRICE_STEP}
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
                  {priceDraft.max >= priceMax ? `${fmt(priceMax)}+` : fmt(priceDraft.max)} <em>DZD</em>
                </span>
              </div>
            </div>

            <div className="nz-f-grp">
              <h3>{t("results.filter_rating")}</h3>
              <button
                type="button"
                className={`nz-f-row radio ${!stars ? "on" : ""}`}
                onClick={() => applyFilters({ stars: "" })}
              >
                <span className="nz-f-box">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 13l4 4L19 7" />
              </svg>
                </span>
                <span className="nz-f-lab">{t("results.any")}</span>
                {facets?.starsAny != null && <span className="nz-f-cnt">{facets.starsAny}</span>}
              </button>
              {STAR_CHOICES.map((sVal) => (
                <button
                  key={sVal}
                  type="button"
                  className={`nz-f-row radio ${stars === sVal ? "on" : ""}`}
                  onClick={() => applyFilters({ stars: sVal })}
                >
                  <span className="nz-f-box">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 13l4 4L19 7" />
              </svg>
                  </span>
                  <span className="nz-f-lab">{"★".repeat(sVal)}</span>
                  {facets?.stars?.[sVal] != null && (
                    <span className="nz-f-cnt">{facets.stars[sVal]}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="nz-f-grp">
              <h3>{t("results.filter_amenities")}</h3>
              {visibleTags.map((tg) => (
                <button
                  key={tg.key}
                  type="button"
                  className={`nz-f-row ${activeTags.includes(tg.key) ? "on" : ""}`}
                  onClick={() => toggleTag(tg.key)}
                >
                  <span className="nz-f-box">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 13l4 4L19 7" />
              </svg>
                  </span>
                  <span className="nz-f-lab">{tg[lang] || tg.en || tg.key}</span>
                  {facets?.tags?.[tg.key] != null && (
                    <span className="nz-f-cnt">{facets.tags[tg.key]}</span>
                  )}
                </button>
              ))}
              {rankedTags.length > 6 && !showAllTags && (
                <button type="button" className="nz-f-more" onClick={() => setShowAllTags(true)}>
                  {ui.showAll} ({rankedTags.length})
                </button>
              )}
            </div>
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

        /* ---- where / when / who ---- */
        .nz-sr-ctx { padding-top: 4px; padding-bottom: 14px; }
        .nz-sr-ctxbar {
          display: flex; align-items: stretch; position: relative;
          border: 1.5px solid var(--gray-200); border-radius: 980px; background: var(--white);
        }
        .nz-sr-ctxbar:focus-within { border-color: var(--ink); }
        .nz-sr-field { flex: 1; min-width: 0; position: relative; }
        .nz-sr-field > button {
          display: flex; flex-direction: column; gap: 2px; align-items: flex-start;
          width: 100%; padding: 11px 22px; border: 0; background: none; cursor: pointer;
          text-align: start; border-radius: 980px; font-family: inherit;
        }
        .nz-sr-field + .nz-sr-field > button::before {
          content: ""; position: absolute; inset-inline-start: 0; top: 10px; bottom: 10px;
          width: 1px; background: var(--gray-200);
        }
        .nz-sr-field > button:hover, .nz-sr-field.open > button { background: var(--cream); }
        .nz-sr-field .lb {
          font-size: 10.5px; font-weight: 700; color: var(--gray-400); letter-spacing: .03em;
        }
        .nz-sr-field .vl {
          font-size: 13.5px; font-weight: 600; color: var(--ink);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
        }
        .nz-sr-field .vl.ph { color: var(--gray-300); font-weight: 500; }
        .nz-sr-go {
          flex: 0 0 auto; margin: 6px; width: 46px; border-radius: 50%; border: 0;
          background: var(--red); color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: background .15s;
        }
        .nz-sr-go:hover { background: var(--red-deep); }

        .nz-sr-panel.cal { width: 300px; }
        .nz-sr-calhead {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;
        }
        .nz-sr-calhead b { font-size: 13.5px; font-weight: 700; color: var(--ink); }
        .nz-sr-calhead button {
          width: 28px; height: 28px; border-radius: 50%; border: 0; background: none;
          cursor: pointer; color: var(--ink); font-size: 16px; line-height: 1; font-family: inherit;
        }
        .nz-sr-calhead button:hover { background: var(--cream); }
        .nz-sr-calgrid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
        .nz-sr-calgrid .dow {
          font-size: 10.5px; font-weight: 700; color: var(--gray-400);
          text-align: center; padding-top: 4px; padding-bottom: 4px;
        }
        .nz-sr-calgrid button {
          aspect-ratio: 1; border: 0; background: none; cursor: pointer;
          font-size: 12.5px; font-weight: 600; color: var(--ink);
          border-radius: 8px; font-family: inherit;
        }
        .nz-sr-calgrid button:hover:not(:disabled) { background: var(--cream); }
        .nz-sr-calgrid button:disabled { color: var(--gray-300); cursor: default; }
        .nz-sr-calgrid button.edge { background: var(--ink); color: #fff; }
        .nz-sr-calgrid button.mid { background: var(--cream); border-radius: 0; }
        .nz-sr-calnote {
          font-size: 11.5px; color: var(--gray-400); font-weight: 500;
          margin-top: 10px; line-height: 1.5;
        }

        .nz-sr-step {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding-top: 11px; padding-bottom: 11px; border-bottom: 1px solid var(--gray-100);
        }
        .nz-sr-step b { display: block; font-size: 13.5px; font-weight: 600; color: var(--ink); }
        .nz-sr-step em {
          display: block; font-style: normal; font-size: 11.5px;
          color: var(--gray-400); font-weight: 500;
        }
        .nz-sr-step .ctrl { display: flex; align-items: center; gap: 12px; flex: 0 0 auto; }
        .nz-sr-step .ctrl button {
          width: 29px; height: 29px; border-radius: 50%; border: 1.5px solid var(--gray-200);
          background: none; color: var(--ink); font-size: 16px; line-height: 1;
          cursor: pointer; font-family: inherit;
        }
        .nz-sr-step .ctrl button:hover:not(:disabled) { border-color: var(--ink); }
        .nz-sr-step .ctrl button:disabled { opacity: .35; cursor: default; }
        .nz-sr-step .ctrl i {
          font-style: normal; font-size: 14px; font-weight: 700;
          min-width: 16px; text-align: center; font-variant-numeric: tabular-nums;
        }
        .nz-sr-applybtn {
          width: 100%; margin-top: 10px; padding: 9px; border: 0; background: var(--ink);
          color: #fff; border-radius: var(--r-sm); font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: inherit;
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
        @keyframes nz-rail-rtl {
          from { transform: translateX(0); }
          to { transform: translateX(50%); }
        }
        .nz-sr-track.rtl { animation-name: nz-rail-rtl; }
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
        /* Superscript rather than a second line: the rail is one baseline and
           a stacked number would double its height. vertical-align works here
           because the button lays its children out inline — do not give
           .nz-sr-railitem display:flex. */
        .nz-sr-railcount {
          font-size: 10px; font-weight: 700; color: var(--gray-300);
          vertical-align: super; margin-inline-start: 3px;
          font-variant-numeric: tabular-nums;
        }
        .nz-sr-railitem:hover .nz-sr-railcount { color: var(--gray-400); }
        .nz-sr-railitem.on .nz-sr-railcount { color: var(--red-deep); }
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
        .nz-f-box svg { opacity: 0; color: #fff; }
        .nz-f-row.on .nz-f-box svg { opacity: 1; }
        .nz-f-lab { flex: 1; font-size: 13px; font-weight: 500; color: var(--ink); }
        .nz-f-cnt {
          font-size: 11.5px; color: var(--gray-400); font-weight: 500;
          font-variant-numeric: tabular-nums;
        }
        .nz-f-more {
          border: 0; background: none; cursor: pointer; font-family: inherit;
          font-size: 12.5px; font-weight: 700; color: var(--ink);
          text-decoration: underline; text-underline-offset: 3px; padding-top: 8px;
        }

        .nz-f-hist {
          display: flex; align-items: flex-end; gap: 2px;
          height: 46px; margin-bottom: 2px;
        }
        .nz-f-hist i {
          flex: 1; background: var(--gray-200); border-radius: 2px 2px 0 0;
          transition: background .12s;
        }
        .nz-f-hist i.in { background: var(--ink); }

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
        @media (max-width: 620px) {
          /* Stacked. Three fields side by side under 620px leaves each one too
             narrow to show its value without truncating. */
          .nz-sr-ctxbar { flex-direction: column; border-radius: var(--r-lg); }
          .nz-sr-field > button { border-radius: var(--r-lg); }
          .nz-sr-field + .nz-sr-field > button::before {
            inset-inline: 14px; top: 0; bottom: auto; width: auto; height: 1px;
          }
          .nz-sr-go { width: auto; margin: 8px; border-radius: 980px; padding: 12px; }
          .nz-sr-panel, .nz-sr-panel.cal, .nz-sr-panel.narrow { width: 100%; }
        }
        @media (max-width: 560px) {
          .nz-sr-grid { grid-template-columns: 1fr; }
          .nz-sr-top { padding-top: 22px; }
        }
      `}</style>
    </>
  );
}
