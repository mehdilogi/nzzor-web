"use client";

// =============================================================================
// Admin → Groups
// -----------------------------------------------------------------------------
// The pipeline for group requests (10+ travellers) left on /groupes:
//   NEW → QUOTED → WON | LOST
// One row per request. Contact by WhatsApp in one click, record the quoted
// total and private notes, move the status. Inline styles only, like the
// Analytics panel, so nothing depends on scoped CSS reaching the rows.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { getToken } from "../../lib/adminApi";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.nzzor.com";

const T = {
  ink: "#16161A", bg: "#F7F6F2", white: "#fff", red: "#E63946", teal: "#1B8A5A", amber: "#B4801A",
  border: "rgba(22,22,26,0.10)", mute: "rgba(22,22,26,0.55)", soft: "rgba(22,22,26,0.04)",
};
const STATUS = {
  NEW: { label: "New", color: T.red },
  QUOTED: { label: "Quoted", color: T.amber },
  WON: { label: "Won", color: T.teal },
  LOST: { label: "Lost", color: "#8a8a90" },
};
const TYPE = {
  COMPANY: "Company / seminar", WEDDING: "Wedding / party", SPORTS: "Sports team",
  SCHOOL: "School / university", ASSOCIATION: "Association / club", OTHER: "Other",
};

async function call(path, opts = {}) {
  const res = await fetch(API + "/api/admin/groups" + path, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + getToken(), ...(opts.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Request failed (HTTP " + res.status + ")");
  return json;
}

const fmtDA = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(Number(n) || 0)).replace(/[  ]/g, " ") + " DA";
const fmtDay = (d) => (d ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(d)) : "—");
const fmtAgo = (d) => {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `${m} min ago`;
  if (m < 48 * 60) return `${Math.round(m / 60)} h ago`;
  return `${Math.round(m / 1440)} days ago`;
};
function waLink(phone, text) {
  let d = String(phone || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "213" + d.slice(1);
  return `https://wa.me/${d}${text ? "?text=" + encodeURIComponent(text) : ""}`;
}
function greeting(g) {
  const name = (g.contactName || "").split(" ")[0];
  if (g.lang === "ar") return `مرحباً ${name}، معكم فريق نزور بخصوص طلب المجموعة ${g.reference}.`;
  if (g.lang === "en") return `Hello ${name}, this is the Nzzor team about your group request ${g.reference}.`;
  return `Bonjour ${name}, ici l'équipe Nzzor au sujet de votre demande de groupe ${g.reference}.`;
}

export default function GroupsPanel() {
  const [filter, setFilter] = useState("");
  const [rows, setRows] = useState(null);
  const [counts, setCounts] = useState({});
  const [wonTotal, setWonTotal] = useState(0);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const j = await call(filter ? `?status=${filter}` : "");
      setRows(j.data);
      setCounts(j.counts || {});
      setWonTotal(j.wonTotal || 0);
    } catch (e) {
      setError(e.message);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function save(id, patch) {
    const j = await call(`/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    setRows((list) => list.map((r) => (r.id === id ? j.data : r)));
    load();
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "20px 24px", color: T.ink }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Groups</h1>
          <p style={{ fontSize: 11, color: T.mute, margin: "3px 0 0" }}>Requests from nzzor.com/groupes · 10+ travellers, quoted by the agency</p>
        </div>
        <button onClick={load} style={btn()}>↻ Refresh</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 8, marginBottom: 14 }}>
        {[
          ["", "All", total, T.ink],
          ["NEW", "New", counts.NEW, T.red],
          ["QUOTED", "Quoted", counts.QUOTED, T.amber],
          ["WON", "Won", counts.WON, T.teal],
          ["LOST", "Lost", counts.LOST, "#8a8a90"],
        ].map(([k, label, n, color]) => (
          <button key={label} onClick={() => setFilter(k)} style={{
            textAlign: "start", background: T.white, cursor: "pointer", fontFamily: "inherit",
            border: `1px solid ${filter === k ? T.ink : T.border}`, borderRadius: 8, padding: "10px 12px",
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.mute, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color, marginTop: 2 }}>{n || 0}</div>
            {k === "WON" && wonTotal > 0 && <div style={{ fontSize: 10, color: T.mute, marginTop: 2 }}>{fmtDA(wonTotal)}</div>}
          </button>
        ))}
      </div>

      {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B", borderRadius: 8, padding: 12, fontSize: 12, marginBottom: 12 }}>{error}</div>}

      {!rows ? (
        <div style={{ color: T.mute, fontSize: 12 }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: "40px 16px", textAlign: "center", color: T.mute, fontSize: 13 }}>
          No group requests {filter ? `with status ${STATUS[filter].label}` : "yet"}. Share nzzor.com/groupes with companies, wedding planners and sports clubs.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((g) => (
            <GroupRow key={g.id} g={g} open={open === g.id} onToggle={() => setOpen(open === g.id ? null : g.id)} onSave={save} />
          ))}
        </div>
      )}
    </div>
  );
}

function GroupRow({ g, open, onToggle, onSave }) {
  const [quote, setQuote] = useState(g.quoteAmount ?? "");
  const [notes, setNotes] = useState(g.adminNotes || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const st = STATUS[g.status] || STATUS.NEW;

  async function patch(p) {
    setSaving(true); setMsg(null);
    try { await onSave(g.id, p); setMsg("Saved"); } catch (e) { setMsg(e.message); }
    setSaving(false);
  }

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <button onClick={onToggle} style={{
        width: "100%", display: "grid", gridTemplateColumns: "110px 1.3fr 1fr 1fr 90px", gap: 12, alignItems: "center",
        padding: "12px 14px", background: "transparent", border: 0, cursor: "pointer", textAlign: "start", fontFamily: "inherit", color: T.ink,
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.03em" }}>{g.reference}</div>
          <div style={{ fontSize: 10, color: T.mute }}>{fmtAgo(g.createdAt)}</div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {g.contactName}{g.organization ? ` · ${g.organization}` : ""}
          </div>
          <div style={{ fontSize: 11, color: T.mute }}>{TYPE[g.groupType] || g.groupType}</div>
        </div>
        <div style={{ fontSize: 12 }}>
          <strong>{g.people}</strong> people{g.rooms ? ` · ${g.rooms} rooms` : ""}
          <div style={{ fontSize: 11, color: T.mute }}>{g.destination || "Destination TBD"}</div>
        </div>
        <div style={{ fontSize: 12 }}>
          {g.checkIn ? `${fmtDay(g.checkIn)} → ${fmtDay(g.checkOut)}` : "Dates TBD"}
          {g.quoteAmount != null && <div style={{ fontSize: 11, color: T.mute }}>Quote {fmtDA(g.quoteAmount)}</div>}
        </div>
        <span style={{ justifySelf: "end", fontSize: 10, fontWeight: 700, color: "#fff", background: st.color, borderRadius: 980, padding: "4px 10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {st.label}
        </span>
      </button>

      {open && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, background: T.soft }}>
          <div style={{ fontSize: 12, lineHeight: 1.8 }}>
            <Line k="Phone" v={g.phone} />
            {g.email && <Line k="Email" v={<a href={`mailto:${g.email}`} style={{ color: T.ink }}>{g.email}</a>} />}
            <Line k="Budget" v={g.budget || "—"} />
            <Line k="Language" v={g.lang} />
            {g.country && <Line k="From" v={[g.region, g.country].filter(Boolean).join(", ")} />}
            {g.message && (
              <div style={{ marginTop: 8, background: T.white, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 10px", whiteSpace: "pre-line" }}>{g.message}</div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <a href={waLink(g.phone, greeting(g))} target="_blank" rel="noopener noreferrer" style={{ ...btn(), background: "#25D366", color: "#fff", border: 0, textDecoration: "none" }}>WhatsApp</a>
              <a href={`tel:${g.phone}`} style={{ ...btn(), textDecoration: "none" }}>Call</a>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <div style={lbl}>Status</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Object.entries(STATUS).map(([k, s]) => (
                  <button key={k} disabled={saving} onClick={() => patch({ status: k })} style={{
                    ...btn(), background: g.status === k ? s.color : T.white, color: g.status === k ? "#fff" : T.ink,
                    border: `1px solid ${g.status === k ? s.color : T.border}`,
                  }}>{s.label}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={lbl}>Quoted total (DA)</div>
              <input type="number" min="0" value={quote} onChange={(e) => setQuote(e.target.value)} style={inp} placeholder="e.g. 450000" />
            </div>
            <div>
              <div style={lbl}>Private notes</div>
              <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...inp, resize: "vertical" }} placeholder="Hotel contacted, group rate, deposit…" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button disabled={saving} onClick={() => patch({ quoteAmount: quote === "" ? null : Number(quote), adminNotes: notes || null })}
                style={{ ...btn(), background: T.ink, color: "#fff", border: 0 }}>{saving ? "Saving…" : "Save"}</button>
              {msg && <span style={{ fontSize: 11, color: msg === "Saved" ? T.teal : T.red }}>{msg}</span>}
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1", borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
            {g.bookingRef ? (
              <BookedBox g={g} />
            ) : (
              <ConvertForm g={g} onDone={() => onSave(g.id, {})} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// The group is booked: show the reference and the payment link.
// -----------------------------------------------------------------------------
function BookedBox({ g }) {
  const payUrl = `https://nzzor.com/pay/${g.bookingRef}?lang=${g.lang || "fr"}`;
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 12 }}>
      <span style={{ background: T.teal, color: "#fff", borderRadius: 980, padding: "4px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.04em" }}>BOOKED</span>
      <span>Booking <strong style={{ letterSpacing: "0.03em" }}>{g.bookingRef}</strong> — find it in the Bookings tab (payment, voucher resend, cancellation).</span>
      <button style={btn()} onClick={() => { navigator.clipboard?.writeText(payUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
        {copied ? "Copied" : "Copy card payment link"}
      </button>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Turn the request into a real booking.
// -----------------------------------------------------------------------------
const PAY_OPTIONS = [
  ["BANK_TRANSFER", "Bank transfer to the agency", "Confirmed now: voucher to the customer and email to the hotel. Mark it PAID in Bookings when the transfer clears."],
  ["CASH", "Paid at the hotel", "Confirmed now. The hotel collects; it owes Nzzor the commission in Accounting."],
  ["CIB", "Card online (CIB / Edahabia)", "Waits for payment. You get a link to send; it confirms itself once paid. Rooms are not held while unpaid."],
];

function ConvertForm({ g, onDone }) {
  const [openForm, setOpenForm] = useState(false);
  const [q, setQ] = useState(g.destination || "");
  const [hotels, setHotels] = useState([]);
  const [hotelId, setHotelId] = useState("");
  const [lines, setLines] = useState({}); // roomId -> { quantity, pricePerNight }
  const ymd = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
  const [checkIn, setCheckIn] = useState(ymd(g.checkIn));
  const [checkOut, setCheckOut] = useState(ymd(g.checkOut));
  const [pay, setPay] = useState("BANK_TRANSFER");
  const [email, setEmail] = useState(g.email || "");
  const [commission, setCommission] = useState("");
  const [note, setNote] = useState("");
  const [force, setForce] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!openForm) return;
    let off = false;
    const id = setTimeout(() => {
      call(`/hotels?q=${encodeURIComponent(q)}`).then((j) => { if (!off) setHotels(j.data || []); }).catch((e) => setErr(e.message));
    }, 250);
    return () => { off = true; clearTimeout(id); };
  }, [q, openForm]);

  const hotel = hotels.find((h) => h.id === hotelId);
  const nights = checkIn && checkOut ? Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000) : 0;
  const chosen = Object.entries(lines)
    .map(([roomId, l]) => ({ roomId, quantity: Number(l.quantity) || 0, pricePerNight: Number(l.pricePerNight) || 0 }))
    .filter((l) => l.quantity > 0);
  const roomsCount = chosen.reduce((a, l) => a + l.quantity, 0);
  const total = chosen.reduce((a, l) => a + l.quantity * l.pricePerNight * Math.max(nights, 0), 0);

  function pickHotel(id) {
    setHotelId(id);
    setLines({});
    setErr(null);
  }
  function setLine(room, field, value) {
    setLines((x) => ({ ...x, [room.id]: { quantity: x[room.id]?.quantity ?? "", pricePerNight: x[room.id]?.pricePerNight ?? room.basePrice, [field]: value } }));
  }

  async function create() {
    setErr(null);
    if (!hotelId) return setErr("Choose a hotel.");
    if (!chosen.length) return setErr("Enter at least one room quantity.");
    if (nights < 1) return setErr("Check the dates.");
    setBusy(true);
    try {
      const j = await call(`/${g.id}/booking`, {
        method: "POST",
        body: JSON.stringify({
          hotelId, rooms: chosen, checkIn, checkOut, paymentMethod: pay,
          guestEmail: email || null,
          commissionAmount: commission === "" ? null : Number(commission),
          specialRequests: note || null,
          force,
        }),
      });
      setResult(j.data);
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  }

  if (result) {
    return (
      <div style={{ fontSize: 12, lineHeight: 1.7 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.teal }}>Booking {result.reference} created · {fmtDA(result.total)}</div>
        {result.payUrl ? (
          <>
            <div>Send this payment link to the customer. The booking confirms itself (voucher + hotel email) once paid:</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
              <code style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 8px" }}>{result.payUrl}</code>
              <a href={waLink(g.phone, result.payUrl)} target="_blank" rel="noopener noreferrer" style={{ ...btn(), background: "#25D366", color: "#fff", border: 0, textDecoration: "none" }}>Send on WhatsApp</a>
            </div>
          </>
        ) : (
          <div>Confirmed. The voucher went to the customer and the notification to the hotel.</div>
        )}
        <button style={{ ...btn(), marginTop: 10 }} onClick={onDone}>Done</button>
      </div>
    );
  }

  if (!openForm) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button onClick={() => setOpenForm(true)} style={{ ...btn(), background: T.teal, color: "#fff", border: 0, padding: "8px 14px", fontSize: 12 }}>
          Create booking from this request
        </button>
        <span style={{ fontSize: 11, color: T.mute }}>Once the customer accepts the quote: real booking, voucher, hotel email, Accounting.</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>Create booking</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <div style={lbl}>Hotel</div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search hotel or city" style={inp} />
          <div style={{ maxHeight: 150, overflowY: "auto", marginTop: 6, border: `1px solid ${T.border}`, borderRadius: 6, background: T.white }}>
            {hotels.length === 0 ? (
              <div style={{ padding: 8, color: T.mute }}>No hotel found</div>
            ) : hotels.map((h) => (
              <button key={h.id} onClick={() => pickHotel(h.id)} style={{
                display: "block", width: "100%", textAlign: "start", padding: "7px 10px", border: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                background: h.id === hotelId ? T.ink : "transparent", color: h.id === hotelId ? "#fff" : T.ink,
                borderBottom: `1px solid ${T.soft}`,
              }}>
                {h.nameFr} <span style={{ opacity: 0.6 }}>· {h.cityFr || h.city}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, alignContent: "start" }}>
          <div><div style={lbl}>Check-in</div><input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} style={inp} /></div>
          <div><div style={lbl}>Check-out</div><input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} style={inp} /></div>
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={lbl}>Customer email (voucher)</div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="If empty, the voucher comes to contact@nzzor.com" style={inp} />
          </div>
        </div>
      </div>

      {hotel && (
        <div>
          <div style={lbl}>Rooms · negotiated group price per room per night</div>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.white }}>
            {hotel.rooms.length === 0 && <div style={{ padding: 8, color: T.mute }}>This hotel has no active room types. Add one in Hotels first.</div>}
            {hotel.rooms.map((r) => (
              <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr 90px 130px", gap: 8, alignItems: "center", padding: "6px 10px", borderBottom: `1px solid ${T.soft}` }}>
                <div>{r.typeFr} <span style={{ color: T.mute }}>· public {fmtDA(r.basePrice)} · {r.totalUnits} on Nzzor</span></div>
                <input type="number" min="0" placeholder="Qty" value={lines[r.id]?.quantity ?? ""} onChange={(e) => setLine(r, "quantity", e.target.value)} style={inp} />
                <input type="number" min="0" placeholder="DA / night" value={lines[r.id]?.pricePerNight ?? ""} onChange={(e) => setLine(r, "pricePerNight", e.target.value)} style={inp} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={lbl}>Payment</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {PAY_OPTIONS.map(([k, label, help]) => (
            <label key={k} style={{ display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer" }}>
              <input type="radio" name={`pay-${g.id}`} checked={pay === k} onChange={() => setPay(k)} style={{ marginTop: 2 }} />
              <span><strong>{label}</strong> <span style={{ color: T.mute }}>— {help}</span></span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
        <div>
          <div style={lbl}>Nzzor commission (DA, optional)</div>
          <input type="number" min="0" value={commission} onChange={(e) => setCommission(e.target.value)} placeholder={hotel ? (hotel.commissionType === "FIXED_PER_NIGHT" ? `Default ${hotel.commissionFixed} DA/night` : `Default ${hotel.commissionRate} %`) : "Hotel default"} style={inp} />
        </div>
        <div>
          <div style={lbl}>Note on the voucher (optional)</div>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Breakfast included, meeting room…" style={inp} />
        </div>
      </div>

      <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
        <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
        <span><strong>Confirmed with the hotel</strong> <span style={{ color: T.mute }}>— book even if Nzzor shows fewer free rooms than the group needs.</span></span>
      </label>

      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", background: T.white, border: `1px solid ${T.border}`, borderRadius: 6, padding: "10px 12px" }}>
        <span>{roomsCount} room{roomsCount === 1 ? "" : "s"} × {Math.max(nights, 0)} night{nights === 1 ? "" : "s"}</span>
        <strong style={{ fontSize: 16 }}>{fmtDA(total)}</strong>
        <span style={{ flex: 1 }} />
        <button onClick={() => setOpenForm(false)} style={btn()}>Cancel</button>
        <button disabled={busy} onClick={create} style={{ ...btn(), background: T.teal, color: "#fff", border: 0, padding: "8px 14px", fontSize: 12 }}>
          {busy ? "Creating…" : pay === "CIB" ? "Create & get payment link" : "Create & confirm booking"}
        </button>
      </div>
      {err && <div style={{ color: T.red, fontWeight: 600 }}>{err}</div>}
    </div>
  );
}

function Line({ k, v }) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <span style={{ color: T.mute, width: 70, flexShrink: 0 }}>{k}</span>
      <strong style={{ fontWeight: 600 }}>{v}</strong>
    </div>
  );
}

const lbl = { fontSize: 10, fontWeight: 600, color: T.mute, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 5 };
const inp = { width: "100%", boxSizing: "border-box", border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 10px", fontSize: 12, fontFamily: "inherit", color: T.ink, background: T.white };
function btn() {
  return { border: `1px solid ${T.border}`, background: T.white, color: T.ink, borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "inline-block" };
}
