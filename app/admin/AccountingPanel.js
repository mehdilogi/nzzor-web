"use client";

// =============================================================================
// Admin → Accounting
// -----------------------------------------------------------------------------
// The booking total is the GROSS the customer pays. Nzzor keeps a commission
// (per hotel, %), the hotel gets the rest. This tab answers, for any month:
//   - how much came in, and how much of it is Nzzor's
//   - what Nzzor owes each hotel (paid online: Nzzor holds the money)
//   - what each hotel owes Nzzor (paid at the hotel: the hotel holds it)
// and records each settlement (transfer reference + date), so the balance
// only ever shows what is still to move. Export gives the accountant a CSV.
// =============================================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { getToken } from "../../lib/adminApi";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.nzzor.com";

async function call(path, opts = {}) {
  const res = await fetch(API + "/api/admin" + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken(),
      ...(opts.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Request failed (HTTP " + res.status + ")");
  return json.data;
}

const fmt = (n) =>
  new Intl.NumberFormat("fr-FR").format(Math.round(Number(n) || 0)).replace(/ | /g, " ") + " DA";
const fmtDate = (d) =>
  d ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(d)) : "";
const ymd = (d) => d.toISOString().slice(0, 10);
const METHOD = { CIB: "CIB / Edahabia", EDDAHABIA: "Edahabia", BANK_TRANSFER: "Virement", CASH: "Espèces", WHATSAPP_ASSISTED: "WhatsApp" };

function monthRange(offset) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset + 1, 0));
  const label = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(start);
  return { start: ymd(start), end: ymd(end), label };
}

function toCsv(rows) {
  const head = ["Reference", "Hotel", "Client", "Arrivee", "Depart", "Nuits", "Paiement", "Encaisse par", "Brut (DA)", "Commission (%)", "Commission (DA)", "Net hotel (DA)", "Regle", "Date reglement", "Ref reglement"];
  const q = (v) => {
    const s = String(v == null ? "" : v);
    return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = rows.map((l) => [
    l.reference, l.hotelName, l.guest, fmtDate(l.checkIn), fmtDate(l.checkOut), l.nights,
    METHOD[l.paymentMethod] || l.paymentMethod, l.collectedBy === "NZZOR" ? "Nzzor" : "Hotel",
    l.gross, l.rate, l.commission, l.net, l.settled ? "Oui" : "Non", fmtDate(l.hotelPaidAt), l.hotelPayoutRef || "",
  ].map(q).join(";"));
  // BOM so Excel opens accents correctly; semicolons for French Excel.
  return "﻿" + [head.join(";"), ...lines].join("\n");
}

export default function AccountingPanel() {
  const [offset, setOffset] = useState(0);
  const [allTime, setAllTime] = useState(false);
  const [hotelId, setHotelId] = useState("");
  const [settled, setSettled] = useState("");
  const [data, setData] = useState(null);
  const [rates, setRates] = useState([]);
  const [showRates, setShowRates] = useState(false);
  const [sel, setSel] = useState(() => new Set());
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [settleFor, setSettleFor] = useState(null); // { ids, label, amount, direction }
  const [payRef, setPayRef] = useState("");
  const [payDate, setPayDate] = useState(ymd(new Date()));
  const [rateDraft, setRateDraft] = useState({});

  const range = useMemo(() => monthRange(offset), [offset]);

  const load = useCallback(() => {
    setErr("");
    const p = new URLSearchParams();
    if (!allTime) { p.set("start", range.start); p.set("end", range.end); }
    if (hotelId) p.set("hotelId", hotelId);
    if (settled) p.set("settled", settled);
    call("/accounting?" + p.toString())
      .then((d) => { setData(d); setSel(new Set()); })
      .catch((e) => setErr(e.message));
  }, [allTime, range, hotelId, settled]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { call("/accounting/rates").then(setRates).catch(() => {}); }, []);

  const lines = data ? data.bookings : [];
  const s = data ? data.summary : null;

  function toggle(id) {
    setSel((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }
  function toggleAll() {
    setSel((prev) => (prev.size === lines.length ? new Set() : new Set(lines.map((l) => l.id))));
  }

  function openSettleHotel(h) {
    const ids = lines.filter((l) => l.hotelId === h.hotelId && !l.settled).map((l) => l.id);
    setSettleFor({
      ids,
      label: h.hotelName,
      amount: Math.abs(h.balance),
      direction: h.balance >= 0 ? "out" : "in",
    });
    setPayRef(""); setPayDate(ymd(new Date()));
  }
  function openSettleSelected() {
    const chosen = lines.filter((l) => sel.has(l.id) && !l.settled);
    const bal = chosen.reduce((a, l) => a + l.owedToHotel - l.owedByHotel, 0);
    setSettleFor({ ids: chosen.map((l) => l.id), label: chosen.length + " réservation(s)", amount: Math.abs(bal), direction: bal >= 0 ? "out" : "in" });
    setPayRef(""); setPayDate(ymd(new Date()));
  }

  async function doSettle() {
    if (!settleFor || !settleFor.ids.length) return;
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await call("/accounting/settle", {
        method: "POST",
        body: JSON.stringify({ bookingIds: settleFor.ids, reference: payRef, paidAt: payDate }),
      });
      setMsg(r.settled + " réservation(s) réglée(s).");
      setSettleFor(null);
      load();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }
  async function doUnsettle() {
    const ids = lines.filter((l) => sel.has(l.id) && l.settled).map((l) => l.id);
    if (!ids.length) return;
    if (!window.confirm("Annuler le règlement de " + ids.length + " réservation(s) ?")) return;
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await call("/accounting/unsettle", { method: "POST", body: JSON.stringify({ bookingIds: ids }) });
      setMsg(r.unsettled + " règlement(s) annulé(s).");
      load();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }
  async function saveRate(id) {
    const v = rateDraft[id];
    if (v === undefined || v === "") return;
    setErr("");
    try {
      const h = await call("/hotels/" + id + "/commission", { method: "PATCH", body: JSON.stringify({ commissionRate: Number(v) }) });
      setRates((rs) => rs.map((r) => (r.id === id ? { ...r, commissionRate: h.commissionRate } : r)));
      setRateDraft((d) => { const n = { ...d }; delete n[id]; return n; });
      setMsg("Commission mise à jour.");
      load();
    } catch (e) { setErr(e.message); }
  }

  function exportCsv() {
    const blob = new Blob([toCsv(lines)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "nzzor-comptabilite-" + (allTime ? "tout" : range.start.slice(0, 7)) + ".csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const selectedUnsettled = lines.filter((l) => sel.has(l.id) && !l.settled).length;
  const selectedSettled = lines.filter((l) => sel.has(l.id) && l.settled).length;

  return (
    <div className="acc">
      <header className="acc-head">
        <div>
          <h1 className="display">Accounting</h1>
          <p>Gross = what the customer pays. Nzzor keeps the commission, the hotel gets the rest.</p>
        </div>
        <div className="acc-period">
          <button onClick={() => { setAllTime(false); setOffset(offset - 1); }} aria-label="Previous month">‹</button>
          <span>{allTime ? "All time" : range.label}</span>
          <button onClick={() => { setAllTime(false); setOffset(offset + 1); }} aria-label="Next month">›</button>
          <button className={"acc-pill" + (allTime ? " on" : "")} onClick={() => setAllTime(!allTime)}>All time</button>
        </div>
      </header>

      <div className="acc-filters">
        <select value={hotelId} onChange={(e) => setHotelId(e.target.value)}>
          <option value="">All hotels</option>
          {rates.map((h) => <option key={h.id} value={h.id}>{h.nameFr || h.nameEn}</option>)}
        </select>
        <select value={settled} onChange={(e) => setSettled(e.target.value)}>
          <option value="">Settled and unsettled</option>
          <option value="no">Unsettled only</option>
          <option value="yes">Settled only</option>
        </select>
        <button className="acc-btn ghost" onClick={() => setShowRates(!showRates)}>
          {showRates ? "Hide commission rates" : "Commission rates"}
        </button>
        <button className="acc-btn ghost" onClick={exportCsv} disabled={!lines.length}>Export CSV</button>
      </div>

      {err && <div className="acc-err">{err}</div>}
      {msg && <div className="acc-ok">{msg}</div>}

      {showRates && (
        <section className="acc-card">
          <h2>Commission rates</h2>
          <p className="acc-sub">Percent of the gross Nzzor keeps, per hotel. Applies to every booking not yet settled; settled bookings keep the rate they were settled at.</p>
          <div className="acc-rates">
            {rates.map((h) => (
              <div key={h.id} className="acc-rate">
                <span className="acc-rate-name">{h.nameFr || h.nameEn}{h.isActive ? "" : " (inactive)"}</span>
                <input
                  type="number" min="0" max="50" step="0.5"
                  value={rateDraft[h.id] !== undefined ? rateDraft[h.id] : h.commissionRate}
                  onChange={(e) => setRateDraft({ ...rateDraft, [h.id]: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") saveRate(h.id); }}
                />
                <span className="acc-pct">%</span>
                <button className="acc-btn small" onClick={() => saveRate(h.id)} disabled={rateDraft[h.id] === undefined}>Save</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {s && (
        <div className="acc-kpis">
          <div className="acc-kpi">
            <span>Gross</span>
            <strong>{fmt(s.gross)}</strong>
            <em>{s.count} booking{s.count === 1 ? "" : "s"}</em>
          </div>
          <div className="acc-kpi red">
            <span>Nzzor commission</span>
            <strong>{fmt(s.commission)}</strong>
            <em>{s.gross ? ((s.commission / s.gross) * 100).toFixed(1) : "0"} % of gross</em>
          </div>
          <div className="acc-kpi">
            <span>Nzzor owes hotels</span>
            <strong>{fmt(s.owedToHotels)}</strong>
            <em>paid online, not yet transferred</em>
          </div>
          <div className="acc-kpi">
            <span>Hotels owe Nzzor</span>
            <strong>{fmt(s.owedByHotels)}</strong>
            <em>commission on stays paid at the hotel</em>
          </div>
        </div>
      )}

      {data && data.hotels.length > 0 && (
        <section className="acc-card">
          <h2>Balance per hotel</h2>
          <table className="acc-table">
            <thead>
              <tr><th>Hotel</th><th className="r">Rate</th><th className="r">Bookings</th><th className="r">Gross</th><th className="r">Commission</th><th className="r">Balance</th><th></th></tr>
            </thead>
            <tbody>
              {data.hotels.map((h) => (
                <tr key={h.hotelId}>
                  <td>{h.hotelName}</td>
                  <td className="r">{h.rate} %</td>
                  <td className="r">{h.count}</td>
                  <td className="r">{fmt(h.gross)}</td>
                  <td className="r">{fmt(h.commission)}</td>
                  <td className="r">
                    {h.balance === 0
                      ? <span className="acc-zero">Settled</span>
                      : h.balance > 0
                        ? <span className="acc-out">Pay hotel {fmt(h.balance)}</span>
                        : <span className="acc-in">Collect {fmt(-h.balance)}</span>}
                  </td>
                  <td className="r">
                    {h.balance !== 0 && <button className="acc-btn small" onClick={() => openSettleHotel(h)}>Settle</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {settleFor && (
        <div className="acc-modal-back" onClick={() => setSettleFor(null)}>
          <div className="acc-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Settle {settleFor.label}</h2>
            <p className="acc-sub">
              {settleFor.direction === "out"
                ? "You transferred " + fmt(settleFor.amount) + " to the hotel."
                : "The hotel paid Nzzor " + fmt(settleFor.amount) + " in commission."}
              {" "}{settleFor.ids.length} booking(s) will be marked settled and their commission frozen.
            </p>
            <label>Transfer / cheque reference
              <input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="e.g. VIR-2026-1104" />
            </label>
            <label>Date
              <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </label>
            <div className="acc-modal-actions">
              <button className="acc-btn ghost" onClick={() => setSettleFor(null)}>Cancel</button>
              <button className="acc-btn" onClick={doSettle} disabled={busy || !settleFor.ids.length}>{busy ? "Saving…" : "Mark as settled"}</button>
            </div>
          </div>
        </div>
      )}

      <section className="acc-card">
        <div className="acc-bar">
          <h2>Bookings</h2>
          <div className="acc-bar-actions">
            {selectedUnsettled > 0 && <button className="acc-btn small" onClick={openSettleSelected} disabled={busy}>Settle {selectedUnsettled}</button>}
            {selectedSettled > 0 && <button className="acc-btn small ghost" onClick={doUnsettle} disabled={busy}>Undo {selectedSettled}</button>}
          </div>
        </div>
        {!data && !err && <p className="acc-sub">Loading…</p>}
        {data && lines.length === 0 && <p className="acc-sub">No paid bookings in this period.</p>}
        {lines.length > 0 && (
          <div className="acc-scroll">
            <table className="acc-table">
              <thead>
                <tr>
                  <th><input type="checkbox" checked={sel.size === lines.length} onChange={toggleAll} aria-label="Select all" /></th>
                  <th>Reference</th><th>Hotel</th><th>Guest</th><th>Stay</th><th>Payment</th>
                  <th className="r">Gross</th><th className="r">Commission</th><th className="r">Net hotel</th><th>Settled</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id} className={sel.has(l.id) ? "sel" : ""}>
                    <td><input type="checkbox" checked={sel.has(l.id)} onChange={() => toggle(l.id)} aria-label={"Select " + l.reference} /></td>
                    <td className="mono">{l.reference}</td>
                    <td>{l.hotelName}</td>
                    <td>{l.guest}</td>
                    <td className="nowrap">{fmtDate(l.checkIn)} → {fmtDate(l.checkOut)}</td>
                    <td>
                      {METHOD[l.paymentMethod] || l.paymentMethod}
                      <span className={"acc-by " + (l.collectedBy === "NZZOR" ? "n" : "h")}>{l.collectedBy === "NZZOR" ? "Nzzor holds" : "Hotel holds"}</span>
                    </td>
                    <td className="r">{fmt(l.gross)}</td>
                    <td className="r">{fmt(l.commission)}<span className="acc-rt">{l.rate} %{l.rateFrozen ? " · frozen" : ""}</span></td>
                    <td className="r">{fmt(l.net)}</td>
                    <td>
                      {l.settled
                        ? <span className="acc-zero">{fmtDate(l.hotelPaidAt)}{l.hotelPayoutRef ? " · " + l.hotelPayoutRef : ""}</span>
                        : <span className="acc-pending">Unsettled</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style jsx>{`
        .acc { display: flex; flex-direction: column; gap: 20px; }
        .acc-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
        .acc-head h1 { font-size: 30px; margin: 0 0 4px; }
        .acc-head p { margin: 0; color: var(--gray-400); font-size: 13px; }
        .acc-period { display: flex; align-items: center; gap: 8px; }
        .acc-period span { min-width: 140px; text-align: center; font-weight: 700; text-transform: capitalize; }
        .acc-period button { width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--gray-200); background: #fff; cursor: pointer; font-size: 18px; line-height: 1; }
        .acc-period .acc-pill { width: auto; border-radius: 999px; padding: 0 14px; font-size: 13px; font-weight: 600; }
        .acc-period .acc-pill.on { background: var(--ink); color: #fff; border-color: var(--ink); }
        .acc-filters { display: flex; gap: 10px; flex-wrap: wrap; }
        .acc-filters select { height: 38px; border-radius: var(--r-sm); border: 1px solid var(--gray-200); padding: 0 12px; font-family: inherit; font-size: 13px; background: #fff; }
        .acc-btn { height: 38px; padding: 0 16px; border-radius: var(--r-sm); border: none; background: var(--ink); color: #fff; font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
        .acc-btn.ghost { background: #fff; color: var(--ink); border: 1px solid var(--gray-200); }
        .acc-btn.small { height: 30px; padding: 0 12px; font-size: 12px; }
        .acc-btn:disabled { opacity: 0.45; cursor: default; }
        .acc-err { background: var(--red-soft); color: var(--red-deep); padding: 12px 16px; border-radius: var(--r-sm); font-size: 13px; }
        .acc-ok { background: #e5f4e4; color: #1f6b33; padding: 12px 16px; border-radius: var(--r-sm); font-size: 13px; }
        .acc-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
        .acc-kpi { background: #fff; border: 1px solid var(--gray-100); border-radius: var(--r-lg); padding: 18px 20px; }
        .acc-kpi span { display: block; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gray-400); }
        .acc-kpi strong { display: block; font-size: 24px; font-weight: 800; margin: 8px 0 4px; color: var(--ink); }
        .acc-kpi.red strong { color: var(--red); }
        .acc-kpi em { font-style: normal; font-size: 12px; color: var(--gray-400); }
        .acc-card { background: #fff; border: 1px solid var(--gray-100); border-radius: var(--r-lg); padding: 22px 24px; }
        .acc-card h2, .acc-modal h2 { font-size: 16px; margin: 0 0 12px; }
        .acc-sub { color: var(--gray-400); font-size: 13px; margin: 0 0 14px; line-height: 1.5; }
        .acc-rates { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 8px 24px; }
        .acc-rate { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--gray-100); }
        .acc-rate-name { flex: 1; font-size: 13px; }
        .acc-rate input { width: 70px; height: 30px; border: 1px solid var(--gray-200); border-radius: var(--r-sm); padding: 0 8px; font-family: inherit; text-align: right; }
        .acc-pct { font-size: 13px; color: var(--gray-400); }
        .acc-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .acc-bar h2 { margin: 0; }
        .acc-bar-actions { display: flex; gap: 8px; }
        .acc-scroll { overflow-x: auto; }
        .acc-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .acc-table th { text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--gray-400); padding: 10px 10px; border-bottom: 1px solid var(--gray-100); white-space: nowrap; }
        .acc-table td { padding: 11px 10px; border-bottom: 1px solid var(--gray-100); vertical-align: top; }
        .acc-table tr.sel td { background: #fdf6f6; }
        .acc-table .r { text-align: right; white-space: nowrap; }
        .acc-table .mono { font-weight: 700; letter-spacing: 0.02em; white-space: nowrap; }
        .acc-table .nowrap { white-space: nowrap; }
        .acc-by { display: block; font-size: 11px; margin-top: 3px; font-weight: 600; }
        .acc-by.n { color: var(--teal); }
        .acc-by.h { color: #b26a00; }
        .acc-rt { display: block; font-size: 11px; color: var(--gray-400); margin-top: 3px; }
        .acc-out { color: var(--red-deep); font-weight: 700; }
        .acc-in { color: #b26a00; font-weight: 700; }
        .acc-zero { color: #1f6b33; font-weight: 600; }
        .acc-pending { color: var(--gray-400); }
        .acc-modal-back { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; padding: 24px; }
        .acc-modal { background: #fff; border-radius: var(--r-lg); padding: 26px 28px; width: 100%; max-width: 460px; display: flex; flex-direction: column; gap: 12px; }
        .acc-modal label { display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 700; color: var(--ink-2); }
        .acc-modal input { height: 40px; border: 1px solid var(--gray-200); border-radius: var(--r-sm); padding: 0 12px; font-family: inherit; font-size: 14px; font-weight: 400; }
        .acc-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }
        @media (max-width: 980px) { .acc-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 560px) { .acc-kpis { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
