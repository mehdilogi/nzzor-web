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
        </div>
      )}
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
