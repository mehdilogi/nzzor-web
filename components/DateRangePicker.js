"use client";

// =============================================================================
// Nzzor — Date Range Picker
// A real range calendar: click start date, click end date, range highlighted.
// Used in the search bar. Mobile-friendly.
// =============================================================================

import { useState } from "react";

const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
// Parse a "YYYY-MM-DD" string as a LOCAL date (avoids the UTC off-by-one bug
// where new Date("2026-05-20") becomes the previous day in UTC+ timezones).
function parseYmd(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function sameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function startOfDay(d) {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
}

export default function DateRangePicker({ checkIn, checkOut, onChange, onComplete }) {
  const today = startOfDay(new Date());
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const ci = checkIn ? startOfDay(parseYmd(checkIn)) : null;
  const co = checkOut ? startOfDay(parseYmd(checkOut)) : null;

  function pick(day) {
    if (!ci || (ci && co)) {
      // start fresh
      onChange({ checkIn: ymd(day), checkOut: "" });
    } else {
      // we have a start, no end
      if (day <= ci) {
        onChange({ checkIn: ymd(day), checkOut: "" });
      } else {
        onChange({ checkIn: ymd(ci), checkOut: ymd(day) });
        if (onComplete) onComplete();
      }
    }
  }

  function buildMonth(base) {
    const year = base.getFullYear();
    const month = base.getMonth();
    const first = new Date(year, month, 1);
    // Monday-first offset
    let lead = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }

  const cells = buildMonth(view);
  const canGoBack = view > new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <div className="drp">
      <div className="drp-head">
        <button
          className="drp-nav"
          disabled={!canGoBack}
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          aria-label="Previous month"
        >‹</button>
        <span className="drp-title">{MONTHS[view.getMonth()]} {view.getFullYear()}</span>
        <button
          className="drp-nav"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          aria-label="Next month"
        >›</button>
      </div>

      <div className="drp-dow">
        {DOW.map((d) => <span key={d}>{d}</span>)}
      </div>

      <div className="drp-grid">
        {cells.map((day, i) => {
          if (!day) return <span key={i} className="drp-cell empty" />;
          const past = day < today;
          const isStart = sameDay(day, ci);
          const isEnd = sameDay(day, co);
          const inRange = ci && co && day > ci && day < co;
          return (
            <button
              key={i}
              className={`drp-cell ${past ? "past" : ""} ${isStart ? "start" : ""} ${isEnd ? "end" : ""} ${inRange ? "range" : ""}`}
              disabled={past}
              onClick={() => pick(day)}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      <div className="drp-foot">
        {ci && !co && <span className="drp-hint">Now pick your check-out date</span>}
        {ci && co && (
          <span className="drp-hint done">
            {Math.round((co - ci) / 86400000)} night{Math.round((co - ci) / 86400000) === 1 ? "" : "s"} selected
          </span>
        )}
        {!ci && <span className="drp-hint">Pick your check-in date</span>}
      </div>

      <style jsx>{`
        .drp { width: 100%; }
        .drp-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .drp-title { font-size: 14px; font-weight: 700; color: var(--ink); }
        .drp-nav {
          width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid var(--gray-200);
          background: #fff; font-size: 18px; line-height: 1; color: var(--ink); cursor: pointer;
        }
        .drp-nav:disabled { opacity: 0.3; cursor: default; }
        .drp-nav:not(:disabled):hover { border-color: var(--ink); }
        .drp-dow { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 6px; }
        .drp-dow span {
          text-align: center; font-size: 11px; font-weight: 700; color: var(--gray-400);
        }
        .drp-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
        .drp-cell {
          aspect-ratio: 1; border: none; background: transparent; cursor: pointer;
          font-size: 13px; font-weight: 600; color: var(--ink); border-radius: 8px;
          font-family: inherit;
        }
        .drp-cell.empty { cursor: default; }
        .drp-cell.past { color: var(--gray-300); cursor: default; }
        .drp-cell:not(.past):not(.empty):hover { background: var(--red-soft); }
        .drp-cell.range { background: var(--red-soft); border-radius: 0; }
        .drp-cell.start { background: var(--red); color: #fff; border-radius: 8px 0 0 8px; }
        .drp-cell.end { background: var(--red); color: #fff; border-radius: 0 8px 8px 0; }
        .drp-cell.start.end { border-radius: 8px; }
        .drp-foot { margin-top: 12px; text-align: center; }
        .drp-hint { font-size: 12.5px; font-weight: 600; color: var(--gray-400); }
        .drp-hint.done { color: var(--teal); }
      `}</style>
    </div>
  );
}
