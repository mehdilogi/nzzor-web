"use client";

import { useState, useMemo } from "react";
import HotelCard from "./HotelCard";
import { useLang } from "../lib/LangContext";

export default function SearchResults({ initialHotels, cities, initialFilters }) {
  const { t } = useLang();
  const [city, setCity] = useState(initialFilters.city || "");
  const [stars, setStars] = useState(Number(initialFilters.stars) || 0);
  const [sort, setSort] = useState(initialFilters.sort || "popular");

  const hotels = useMemo(() => {
    let list = [...initialHotels];
    if (city) list = list.filter((h) => h.city.toLowerCase() === city.toLowerCase());
    if (stars) list = list.filter((h) => h.stars >= stars);
    if (sort === "price_asc") list.sort((a, b) => a.priceFrom - b.priceFrom);
    else if (sort === "price_desc") list.sort((a, b) => b.priceFrom - a.priceFrom);
    else if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    else list.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
    return list;
  }, [initialHotels, city, stars, sort]);

  return (
    <>
      {/* page header */}
      <div className="nz-sr-head">
        <div className="wrap">
          <h1 className="display">
            {initialFilters.q ? `${t("results.matching")} "${initialFilters.q}"` : t("results.title")}
          </h1>
          <p>{hotels.length} {hotels.length === 1 ? t("search.hotel") : t("search.hotels")} · {t("results.verified_by")}</p>
        </div>
      </div>

      <div className="wrap nz-sr-body">
        {/* filter bar */}
        <div className="nz-sr-filters">
          <select value={city} onChange={(e) => setCity(e.target.value)}>
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
                onClick={() => setStars(s)}
              >
                {s === 0 ? t("results.any") : "★".repeat(s) + "+"}
              </button>
            ))}
          </div>

          <select className="nz-sr-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="popular">{t("results.popular")}</option>
            <option value="price_asc">{t("results.price_low")}</option>
            <option value="price_desc">{t("results.price_high")}</option>
            <option value="rating">{t("results.top_rated")}</option>
          </select>
        </div>

        {/* results */}
        {hotels.length > 0 ? (
          <div className="nz-sr-grid">
            {hotels.map((h) => <HotelCard key={h.id} hotel={h} />)}
          </div>
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
        .nz-sr-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 26px; }
        .nz-sr-empty { text-align: center; padding: 80px 0; }
        .nz-sr-empty p { font-size: 22px; font-weight: 600; color: var(--ink); margin-bottom: 8px; }
        .nz-sr-empty span { font-size: 14px; color: var(--gray-400); }
        @media (max-width: 860px) {
          .nz-sr-grid { grid-template-columns: 1fr; }
          .nz-sr-sort { margin-inline-start: 0; }
        }
        @media (max-width: 560px) {
          .nz-sr-head { padding: 32px 0; }
          .nz-sr-head h1 { font-size: 26px; }
          .nz-sr-filters { flex-direction: column; align-items: stretch; gap: 10px; }
          .nz-sr-filters select { width: 100%; }
          .nz-sr-stars { justify-content: space-between; }
          .nz-sr-stars button { flex: 1; text-align: center; }
        }
      `}</style>
    </>
  );
}
