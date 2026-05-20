"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getToken, clearToken, adminLogin, adminMe, adminDashboard,
  adminHotels, adminBookings, adminBookingDetail, adminUpdateBookingStatus,
  adminCreateHotel, adminUpdateHotel, adminDeleteHotel,
  adminAddRoom, adminUpdateRoom, adminDeleteRoom,
  adminAddPhoto, adminDeletePhoto,
  adminHotelManagers, adminAddHotelManager, adminRemoveHotelManager,
} from "../../lib/adminApi";

const fmt = (n) => Number(n || 0).toLocaleString("en") + " DZD";

// =============================================================================
// ROOT
// =============================================================================
export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!getToken()) { setChecking(false); return; }
    adminMe()
      .then((u) => {
        if (["ADMIN", "SUPER_ADMIN"].includes(u.role)) setUser(u);
        else clearToken();
      })
      .catch(() => clearToken())
      .finally(() => setChecking(false));
  }, []);

  if (checking) return <Splash />;
  if (!user) return <Login onLogin={setUser} />;
  return <Dashboard user={user} onLogout={() => { clearToken(); setUser(null); }} />;
}

// =============================================================================
// SPLASH
// =============================================================================
function Splash() {
  return (
    <div className="ad-splash">
      <div className="ad-logo-mark" />
      <span>Loading Nzzor Admin…</span>
      <style jsx>{`
        .ad-splash {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 16px;
          background: var(--ink); color: rgba(255,255,255,0.6); font-size: 14px;
        }
        .ad-logo-mark { width: 36px; height: 36px; border-radius: 50%; background: var(--red); animation: blink 1.4s infinite; }
      `}</style>
    </div>
  );
}

// =============================================================================
// LOGIN
// =============================================================================
function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr(""); setBusy(true);
    try {
      const u = await adminLogin(email.trim(), password);
      onLogin(u);
    } catch (e) {
      setErr(e.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ad-login">
      <div className="ad-login-card">
        <div className="ad-login-brand">
          <span className="ad-logo-mark" />
          <div>
            <div className="ad-login-name display">Nzzor</div>
            <div className="ad-login-sub">Admin Dashboard</div>
          </div>
        </div>
        <h1>Sign in</h1>
        <p className="ad-login-hint">Allouni Travel Agency staff only.</p>

        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="admin@nzzor.com" type="email" />

        <label>Password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="••••••••" type="password" />

        {err && <div className="ad-login-err">{err}</div>}

        <button className="ad-login-btn" onClick={submit} disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </div>

      <style jsx>{`
        .ad-login {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          background: var(--ink); padding: 24px;
        }
        .ad-login-card {
          width: 100%; max-width: 380px; background: #fff;
          border-radius: var(--r-lg); padding: 36px;
        }
        .ad-login-brand { display: flex; align-items: center; gap: 11px; margin-bottom: 28px; }
        .ad-logo-mark { width: 34px; height: 34px; border-radius: 50%; background: var(--red); flex-shrink: 0; position: relative; }
        .ad-logo-mark::after {
          content: ''; position: absolute; inset: 0; border-radius: 50%;
          background: var(--red); animation: ping 3s cubic-bezier(0,0,0.2,1) infinite;
        }
        .ad-login-name { font-size: 21px; font-weight: 600; letter-spacing: -0.02em; }
        .ad-login-sub { font-size: 10px; letter-spacing: 0.07em; text-transform: uppercase; font-weight: 700; color: var(--gray-400); }
        .ad-login-card h1 { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 4px; }
        .ad-login-hint { font-size: 13px; color: var(--gray-400); margin-bottom: 24px; }
        .ad-login-card label { display: block; font-size: 12px; font-weight: 700; color: var(--gray-400); margin-bottom: 6px; margin-top: 14px; }
        .ad-login-card input {
          width: 100%; padding: 11px 14px; border: 1.5px solid var(--gray-200);
          border-radius: var(--r-sm); font-size: 14px; outline: none;
        }
        .ad-login-card input:focus { border-color: var(--red); }
        .ad-login-err {
          margin-top: 14px; padding: 10px 12px; background: var(--red-soft);
          color: var(--red-deep); border-radius: var(--r-sm); font-size: 13px; font-weight: 600;
        }
        .ad-login-btn {
          width: 100%; margin-top: 22px; padding: 13px; background: var(--red);
          color: #fff; border: none; border-radius: var(--r-sm);
          font-size: 15px; font-weight: 700; cursor: pointer;
        }
        .ad-login-btn:disabled { opacity: 0.6; }
      `}</style>
    </div>
  );
}

// =============================================================================
// DASHBOARD SHELL
// =============================================================================
function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState("overview");

  return (
    <div className="ad-shell">
      <aside className="ad-sidebar">
        <div className="ad-side-brand">
          <span className="ad-logo-mark" />
          <div>
            <div className="ad-side-name display">Nzzor</div>
            <div className="ad-side-sub">Admin</div>
          </div>
        </div>
        <nav>
          {[
            ["overview", "Overview"],
            ["hotels", "Hotels"],
            ["bookings", "Bookings"],
          ].map(([k, label]) => (
            <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="ad-side-foot">
          <div className="ad-side-user">
            <strong>{user.firstName || "Admin"}</strong>
            <span>{user.email}</span>
          </div>
          <button className="ad-logout" onClick={onLogout}>Sign out</button>
        </div>
      </aside>

      <main className="ad-main">
        {tab === "overview" && <Overview />}
        {tab === "hotels" && <HotelsManager />}
        {tab === "bookings" && <BookingsManager />}
      </main>

      <style jsx>{`
        .ad-shell { display: flex; min-height: 100vh; background: var(--cream); }
        .ad-sidebar {
          width: 240px; flex-shrink: 0; background: var(--ink); color: #fff;
          display: flex; flex-direction: column; padding: 24px 16px;
        }
        .ad-side-brand { display: flex; align-items: center; gap: 10px; padding: 0 8px 28px; }
        .ad-logo-mark { width: 32px; height: 32px; border-radius: 50%; background: var(--red); flex-shrink: 0; position: relative; }
        .ad-logo-mark::after {
          content: ''; position: absolute; inset: 0; border-radius: 50%;
          background: var(--red); animation: ping 3s cubic-bezier(0,0,0.2,1) infinite;
        }
        .ad-side-name { font-size: 19px; font-weight: 600; letter-spacing: -0.02em; }
        .ad-side-sub { font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; color: rgba(255,255,255,0.5); }
        .ad-sidebar nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .ad-sidebar nav button {
          text-align: left; padding: 11px 14px; border: none; background: transparent;
          color: rgba(255,255,255,0.7); font-size: 14px; font-weight: 600;
          border-radius: var(--r-sm); cursor: pointer; font-family: inherit;
        }
        .ad-sidebar nav button:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .ad-sidebar nav button.on { background: var(--red); color: #fff; }
        .ad-side-foot { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; }
        .ad-side-user { padding: 0 8px 12px; }
        .ad-side-user strong { display: block; font-size: 13px; }
        .ad-side-user span { font-size: 11px; color: rgba(255,255,255,0.5); }
        .ad-logout {
          width: 100%; padding: 9px; background: rgba(255,255,255,0.08);
          color: #fff; border: none; border-radius: var(--r-sm);
          font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
        }
        .ad-logout:hover { background: rgba(255,255,255,0.14); }
        .ad-main { flex: 1; padding: 32px 40px; overflow-x: hidden; }
        @media (max-width: 720px) {
          .ad-shell { flex-direction: column; }
          .ad-sidebar { width: 100%; flex-direction: row; flex-wrap: wrap; align-items: center; padding: 12px 16px; }
          .ad-side-brand { padding: 0; }
          .ad-sidebar nav { flex-direction: row; flex: 0; gap: 4px; }
          .ad-side-foot { border: none; padding: 0; display: flex; align-items: center; gap: 8px; }
          .ad-side-user { display: none; }
          .ad-main { padding: 20px; }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// OVERVIEW
// =============================================================================
function Overview() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    adminDashboard().then(setData).catch((e) => setErr(e.message));
  }, []);

  if (err) return <ErrorBox msg={err} />;
  if (!data) return <Loading />;

  return (
    <div>
      <PageHead title="Overview" subtitle="Your platform at a glance" />

      <div className="ad-stats">
        <Stat label="Total bookings" value={data.bookings.total} />
        <Stat label="Bookings · last 7 days" value={data.bookings.last7Days} />
        <Stat label="Revenue · last 30 days" value={fmt(data.revenue.last30Days)} />
        <Stat label="Active hotels" value={data.hotels.total} />
      </div>

      <div className="ad-panel">
        <h3>Bookings by status</h3>
        <div className="ad-status-row">
          {Object.entries(data.bookings.byStatus || {}).length === 0 && (
            <span className="ad-empty-inline">No bookings yet.</span>
          )}
          {Object.entries(data.bookings.byStatus || {}).map(([s, n]) => (
            <div className="ad-status-chip" key={s}>
              <strong>{n}</strong> <span>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ad-panel">
        <h3>Top hotels by revenue</h3>
        {(!data.topHotels || data.topHotels.length === 0) ? (
          <span className="ad-empty-inline">No bookings yet — top hotels will appear here.</span>
        ) : (
          <table className="ad-table">
            <thead><tr><th>Hotel</th><th>Bookings</th><th>Revenue</th></tr></thead>
            <tbody>
              {data.topHotels.map((h, i) => (
                <tr key={i}>
                  <td>{h.hotel}</td>
                  <td>{h.bookings}</td>
                  <td>{fmt(h.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style jsx>{`
        .ad-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
        .ad-status-row { display: flex; gap: 10px; flex-wrap: wrap; }
        .ad-status-chip {
          padding: 10px 16px; background: var(--cream); border: 1px solid var(--gray-200);
          border-radius: var(--r-sm); font-size: 13px;
        }
        .ad-status-chip strong { font-size: 16px; font-weight: 800; }
        .ad-status-chip span { color: var(--gray-400); font-weight: 600; font-size: 11px; }
        .ad-empty-inline { color: var(--gray-400); font-size: 13px; }
        @media (max-width: 720px) { .ad-stats { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </div>
  );
}

// =============================================================================
// HOTELS MANAGER
// =============================================================================
function HotelsManager() {
  const [hotels, setHotels] = useState(null);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(null); // hotel object, or "new", or null

  const load = useCallback(() => {
    setHotels(null);
    adminHotels().then(setHotels).catch((e) => setErr(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (editing) {
    return <HotelEditor hotel={editing === "new" ? null : editing}
      onClose={() => setEditing(null)}
      onSaved={() => { setEditing(null); load(); }} />;
  }

  return (
    <div>
      <PageHead title="Hotels" subtitle="Add and manage your hotel inventory"
        action={<button className="ad-btn-primary" onClick={() => setEditing("new")}>+ New hotel</button>} />

      {err && <ErrorBox msg={err} />}
      {!hotels && !err && <Loading />}

      {hotels && (
        <div className="ad-hotel-list">
          {hotels.length === 0 && <div className="ad-panel"><span className="ad-empty-inline">No hotels yet. Click &quot;New hotel&quot; to add your first one.</span></div>}
          {hotels.map((h) => (
            <div className="ad-hotel-row" key={h.id}>
              <div className="ad-hotel-thumb">
                {h.primaryPhoto
                  /* eslint-disable-next-line @next/next/no-img-element */
                  ? <img src={h.primaryPhoto} alt={h.name} />
                  : <div className="ad-noimg">No photo</div>}
              </div>
              <div className="ad-hotel-meta">
                <div className="ad-hotel-name">
                  {h.name}
                  {!h.isActive && <span className="ad-tag-off">Inactive</span>}
                  {h.isFeatured && <span className="ad-tag-feat">Featured</span>}
                </div>
                <div className="ad-hotel-sub">
                  {"★".repeat(h.stars)} · {h.city} · {h.rooms?.length || 0} room types · from {fmt(h.priceFrom)}
                </div>
              </div>
              <button className="ad-btn-ghost" onClick={() => setEditing(h)}>Manage</button>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .ad-hotel-list { display: flex; flex-direction: column; gap: 10px; }
        .ad-hotel-row {
          display: flex; align-items: center; gap: 16px; padding: 12px;
          background: #fff; border: 1px solid var(--gray-200); border-radius: var(--r-md);
        }
        .ad-hotel-thumb { width: 80px; height: 60px; border-radius: var(--r-sm); overflow: hidden; flex-shrink: 0; background: var(--gray-100); }
        .ad-hotel-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .ad-noimg { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: var(--gray-400); }
        .ad-hotel-meta { flex: 1; }
        .ad-hotel-name { font-weight: 700; font-size: 15px; display: flex; align-items: center; gap: 8px; }
        .ad-hotel-sub { font-size: 12.5px; color: var(--gray-400); font-weight: 600; margin-top: 2px; }
        .ad-tag-off { font-size: 10px; background: var(--gray-100); color: var(--gray-400); padding: 2px 7px; border-radius: 980px; font-weight: 700; }
        .ad-tag-feat { font-size: 10px; background: var(--red-soft); color: var(--red-deep); padding: 2px 7px; border-radius: 980px; font-weight: 700; }
        .ad-empty-inline { color: var(--gray-400); font-size: 13px; }
      `}</style>
    </div>
  );
}

// =============================================================================
// HOTEL EDITOR
// =============================================================================
const BLANK_HOTEL = {
  nameEn: "", nameFr: "", nameAr: "",
  descEn: "", descFr: "", descAr: "",
  stars: 4, city: "",
  cityEn: "", cityFr: "", cityAr: "",
  regionEn: "", regionFr: "", regionAr: "",
  address: "", contactEmail: "", contactPhone: "",
  checkInTime: "14:00", checkOutTime: "12:00", cancellationHours: 48,
  childrenAllowed: true, petsAllowed: false, parkingFree: true,
  instantConfirmation: true, verifiedPartner: true,
  isActive: true, isFeatured: false,
};

function HotelEditor({ hotel, onClose, onSaved }) {
  const isNew = !hotel;
  const [form, setForm] = useState(() => {
    if (!hotel) return { ...BLANK_HOTEL };
    return {
      nameEn: hotel.nameEn ?? hotel.name ?? "", nameFr: hotel.nameFr ?? "", nameAr: hotel.nameAr ?? "",
      descEn: hotel.descEn ?? hotel.description ?? "", descFr: hotel.descFr ?? "", descAr: hotel.descAr ?? "",
      stars: hotel.stars ?? 4, city: hotel.city ?? "",
      cityEn: hotel.cityEn ?? "", cityFr: hotel.cityFr ?? "", cityAr: hotel.cityAr ?? "",
      regionEn: hotel.regionEn ?? "", regionFr: hotel.regionFr ?? "", regionAr: hotel.regionAr ?? "",
      address: hotel.address ?? "", contactEmail: hotel.contactEmail ?? "", contactPhone: hotel.contactPhone ?? "",
      checkInTime: hotel.checkInTime ?? "14:00", checkOutTime: hotel.checkOutTime ?? "12:00",
      cancellationHours: hotel.cancellationHours ?? 48,
      childrenAllowed: hotel.childrenAllowed ?? true,
      petsAllowed: hotel.petsAllowed ?? false,
      parkingFree: hotel.parkingFree ?? true,
      instantConfirmation: hotel.trustSignals?.instantConfirmation ?? hotel.instantConfirmation ?? true,
      verifiedPartner: hotel.trustSignals?.verifiedPartner ?? hotel.verifiedPartner ?? true,
      isActive: hotel.isActive ?? true,
      isFeatured: hotel.isFeatured ?? false,
    };
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [savedId, setSavedId] = useState(hotel?.id || null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setErr(""); setBusy(true);
    try {
      const payload = {
        ...form,
        stars: Number(form.stars),
        cancellationHours: Number(form.cancellationHours),
      };
      if (isNew && !savedId) {
        const created = await adminCreateHotel(payload);
        setSavedId(created.id);
      } else {
        await adminUpdateHotel(savedId, payload);
      }
      onSaved();
    } catch (e) {
      setErr(e.message + (e.details ? ` (${e.details.map((d) => d.path?.join?.(".")).join(", ")})` : ""));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Deactivate this hotel? It will be hidden from the public site.")) return;
    setBusy(true);
    try {
      await adminDeleteHotel(savedId);
      onSaved();
    } catch (e) { setErr(e.message); setBusy(false); }
  }

  return (
    <div>
      <PageHead
        title={isNew ? "New hotel" : `Edit · ${form.nameEn || "Hotel"}`}
        subtitle={isNew ? "Add a new hotel to the platform" : "Update hotel details"}
        action={<button className="ad-btn-ghost" onClick={onClose}>← Back to hotels</button>}
      />

      {err && <ErrorBox msg={err} />}

      <div className="ad-panel">
        <h3>Names (3 languages)</h3>
        <div className="ad-grid3">
          <Field label="Name (English)" v={form.nameEn} onChange={(v) => set("nameEn", v)} />
          <Field label="Name (French)" v={form.nameFr} onChange={(v) => set("nameFr", v)} />
          <Field label="Name (Arabic)" v={form.nameAr} onChange={(v) => set("nameAr", v)} rtl />
        </div>
      </div>

      <div className="ad-panel">
        <h3>Description (3 languages)</h3>
        <div className="ad-grid3">
          <Field label="Description (EN)" v={form.descEn} onChange={(v) => set("descEn", v)} area />
          <Field label="Description (FR)" v={form.descFr} onChange={(v) => set("descFr", v)} area />
          <Field label="Description (AR)" v={form.descAr} onChange={(v) => set("descAr", v)} area rtl />
        </div>
      </div>

      <div className="ad-panel">
        <h3>Location &amp; rating</h3>
        <div className="ad-grid3">
          <Field label="City key (lowercase, e.g. algiers)" v={form.city} onChange={(v) => set("city", v)} />
          <Field label="Stars (1–5)" v={form.stars} onChange={(v) => set("stars", v)} type="number" />
          <Field label="Address" v={form.address} onChange={(v) => set("address", v)} />
          <Field label="City (EN)" v={form.cityEn} onChange={(v) => set("cityEn", v)} />
          <Field label="City (FR)" v={form.cityFr} onChange={(v) => set("cityFr", v)} />
          <Field label="City (AR)" v={form.cityAr} onChange={(v) => set("cityAr", v)} rtl />
          <Field label="Region (EN)" v={form.regionEn} onChange={(v) => set("regionEn", v)} />
          <Field label="Region (FR)" v={form.regionFr} onChange={(v) => set("regionFr", v)} />
          <Field label="Region (AR)" v={form.regionAr} onChange={(v) => set("regionAr", v)} rtl />
        </div>
      </div>

      <div className="ad-panel">
        <h3>Policies &amp; contact</h3>
        <div className="ad-grid3">
          <Field label="Check-in time" v={form.checkInTime} onChange={(v) => set("checkInTime", v)} />
          <Field label="Check-out time" v={form.checkOutTime} onChange={(v) => set("checkOutTime", v)} />
          <Field label="Free cancellation (hours)" v={form.cancellationHours} onChange={(v) => set("cancellationHours", v)} type="number" />
          <Field label="Contact email" v={form.contactEmail} onChange={(v) => set("contactEmail", v)} />
          <Field label="Contact phone" v={form.contactPhone} onChange={(v) => set("contactPhone", v)} />
        </div>
        <div className="ad-toggles">
          <Toggle label="Children allowed" v={form.childrenAllowed} onChange={(v) => set("childrenAllowed", v)} />
          <Toggle label="Pets allowed" v={form.petsAllowed} onChange={(v) => set("petsAllowed", v)} />
          <Toggle label="Free parking" v={form.parkingFree} onChange={(v) => set("parkingFree", v)} />
          <Toggle label="Instant confirmation" v={form.instantConfirmation} onChange={(v) => set("instantConfirmation", v)} />
          <Toggle label="Verified partner" v={form.verifiedPartner} onChange={(v) => set("verifiedPartner", v)} />
          <Toggle label="Active (visible on site)" v={form.isActive} onChange={(v) => set("isActive", v)} />
          <Toggle label="Featured on homepage" v={form.isFeatured} onChange={(v) => set("isFeatured", v)} />
        </div>
      </div>

      <div className="ad-editor-actions">
        <button className="ad-btn-primary" onClick={save} disabled={busy}>
          {busy ? "Saving…" : isNew && !savedId ? "Create hotel" : "Save changes"}
        </button>
        {!isNew && (
          <button className="ad-btn-danger" onClick={remove} disabled={busy}>Deactivate hotel</button>
        )}
      </div>

      {savedId && (
        <RoomsPanel hotelId={savedId} initialRooms={hotel?.rooms || []} />
      )}
      {savedId && (
        <PhotosPanel hotelId={savedId} initialPhotos={hotel?.photos || []} />
      )}
      {savedId && (
        <ManagersPanel hotelId={savedId} />
      )}
      {isNew && !savedId && (
        <div className="ad-note">Save the hotel first to add rooms, photos and partner accounts.</div>
      )}

      <style jsx>{`
        .ad-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .ad-toggles { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
        .ad-editor-actions { display: flex; gap: 10px; margin-bottom: 24px; }
        .ad-note { padding: 16px; background: var(--cream); border: 1px dashed var(--gray-300); border-radius: var(--r-md); font-size: 13px; color: var(--gray-400); }
        @media (max-width: 720px) { .ad-grid3 { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

// =============================================================================
// ROOMS PANEL
// =============================================================================
const BLANK_ROOM = {
  typeEn: "", typeFr: "", typeAr: "",
  capacity: 2, sizeSqm: 30, bedType: "King",
  basePrice: 20000, totalUnits: 5, isActive: true,
};

function RoomsPanel({ hotelId, initialRooms }) {
  const [rooms, setRooms] = useState(initialRooms);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(BLANK_ROOM);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  async function addRoom() {
    setErr(""); setBusy(true);
    try {
      const payload = {
        ...draft,
        capacity: Number(draft.capacity),
        sizeSqm: Number(draft.sizeSqm),
        basePrice: Number(draft.basePrice),
        totalUnits: Number(draft.totalUnits),
      };
      const created = await adminAddRoom(hotelId, payload);
      setRooms((r) => [...r, created]);
      setDraft(BLANK_ROOM);
      setAdding(false);
    } catch (e) {
      setErr(e.message);
    } finally { setBusy(false); }
  }

  async function delRoom(id) {
    if (!confirm("Remove this room type?")) return;
    try {
      await adminDeleteRoom(id);
      setRooms((r) => r.filter((x) => x.id !== id));
    } catch (e) { setErr(e.message); }
  }

  return (
    <div className="ad-panel">
      <div className="ad-panel-head">
        <h3>Rooms</h3>
        {!adding && <button className="ad-btn-ghost" onClick={() => setAdding(true)}>+ Add room</button>}
      </div>
      {err && <ErrorBox msg={err} />}

      {rooms.length === 0 && !adding && (
        <span className="ad-empty-inline">No rooms yet. Add at least one room type.</span>
      )}

      {rooms.map((r) => (
        <div className="ad-room-row" key={r.id}>
          <div>
            <strong>{r.typeEn || r.type}</strong>
            <span> · {r.capacity} guests · {r.bedType} · {fmt(r.basePrice ?? r.price)}/night</span>
          </div>
          <button className="ad-btn-mini-danger" onClick={() => delRoom(r.id)}>Remove</button>
        </div>
      ))}

      {adding && (
        <div className="ad-room-form">
          <div className="ad-grid3">
            <Field label="Type (EN)" v={draft.typeEn} onChange={(v) => set("typeEn", v)} />
            <Field label="Type (FR)" v={draft.typeFr} onChange={(v) => set("typeFr", v)} />
            <Field label="Type (AR)" v={draft.typeAr} onChange={(v) => set("typeAr", v)} rtl />
            <Field label="Price / night (DZD)" v={draft.basePrice} onChange={(v) => set("basePrice", v)} type="number" />
            <Field label="Capacity (guests)" v={draft.capacity} onChange={(v) => set("capacity", v)} type="number" />
            <Field label="Size (m²)" v={draft.sizeSqm} onChange={(v) => set("sizeSqm", v)} type="number" />
            <Field label="Bed type" v={draft.bedType} onChange={(v) => set("bedType", v)} />
            <Field label="Number of rooms" v={draft.totalUnits} onChange={(v) => set("totalUnits", v)} type="number" />
          </div>
          <div className="ad-editor-actions">
            <button className="ad-btn-primary" onClick={addRoom} disabled={busy}>
              {busy ? "Adding…" : "Add room"}
            </button>
            <button className="ad-btn-ghost" onClick={() => { setAdding(false); setDraft(BLANK_ROOM); }}>Cancel</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .ad-panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .ad-panel-head h3 { margin: 0; }
        .ad-room-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 14px; background: var(--cream); border-radius: var(--r-sm); margin-bottom: 8px;
        }
        .ad-room-row strong { font-size: 14px; }
        .ad-room-row span { font-size: 12.5px; color: var(--gray-400); font-weight: 600; }
        .ad-room-form { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--gray-100); }
        .ad-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .ad-editor-actions { display: flex; gap: 10px; margin-top: 14px; }
        .ad-empty-inline { color: var(--gray-400); font-size: 13px; }
        @media (max-width: 720px) { .ad-grid3 { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

// =============================================================================
// PHOTOS PANEL
// =============================================================================
function PhotosPanel({ hotelId, initialPhotos }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function add() {
    if (!url.trim()) return;
    setErr(""); setBusy(true);
    try {
      const p = await adminAddPhoto(hotelId, url.trim(), photos.length === 0);
      setPhotos((ps) => [...ps, p]);
      setUrl("");
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }
  async function del(id) {
    try {
      await adminDeletePhoto(id);
      setPhotos((ps) => ps.filter((x) => x.id !== id));
    } catch (e) { setErr(e.message); }
  }

  return (
    <div className="ad-panel">
      <h3>Photos</h3>
      <p className="ad-photo-hint">Paste an image URL (hosted on Cloudflare R2, Unsplash, etc.). Direct upload comes later.</p>
      {err && <ErrorBox msg={err} />}

      <div className="ad-photo-grid">
        {photos.map((p) => (
          <div className="ad-photo" key={p.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" />
            {p.isPrimary && <span className="ad-photo-primary">Primary</span>}
            <button className="ad-photo-del" onClick={() => del(p.id)}>×</button>
          </div>
        ))}
      </div>

      <div className="ad-photo-add">
        <input value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…/photo.jpg"
          onKeyDown={(e) => e.key === "Enter" && add()} />
        <button className="ad-btn-primary" onClick={add} disabled={busy}>
          {busy ? "Adding…" : "Add photo"}
        </button>
      </div>

      <style jsx>{`
        .ad-photo-hint { font-size: 12.5px; color: var(--gray-400); margin-bottom: 14px; }
        .ad-photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; margin-bottom: 14px; }
        .ad-photo { position: relative; height: 90px; border-radius: var(--r-sm); overflow: hidden; background: var(--gray-100); }
        .ad-photo img { width: 100%; height: 100%; object-fit: cover; }
        .ad-photo-primary {
          position: absolute; bottom: 4px; left: 4px; background: var(--red); color: #fff;
          font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 980px;
        }
        .ad-photo-del {
          position: absolute; top: 4px; right: 4px; width: 22px; height: 22px;
          border-radius: 50%; border: none; background: rgba(0,0,0,0.6); color: #fff;
          font-size: 14px; cursor: pointer; line-height: 1;
        }
        .ad-photo-add { display: flex; gap: 8px; }
        .ad-photo-add input {
          flex: 1; padding: 10px 12px; border: 1.5px solid var(--gray-200);
          border-radius: var(--r-sm); font-size: 13px; outline: none;
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// MANAGERS PANEL — admin creates hotel-partner accounts that log into /partner
// =============================================================================
function ManagersPanel({ hotelId }) {
  const [list, setList] = useState(null);
  const [err, setErr] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });

  const load = useCallback(() => {
    adminHotelManagers(hotelId).then(setList).catch((e) => setErr(e.message));
  }, [hotelId]);
  useEffect(() => { load(); }, [load]);

  async function create() {
    setErr("");
    try {
      await adminAddHotelManager(hotelId, form);
      setForm({ email: "", password: "", firstName: "", lastName: "" });
      setCreating(false);
      load();
    } catch (e) { setErr(e.message); }
  }
  async function remove(userId) {
    if (!window.confirm("Remove this partner's access to this hotel?")) return;
    try { await adminRemoveHotelManager(hotelId, userId); load(); }
    catch (e) { setErr(e.message); }
  }

  return (
    <div className="ad-panel ad-mgr">
      <div className="ad-panel-head">
        <h3>Hotel partner accounts</h3>
        {!creating && <button className="ad-btn" onClick={() => setCreating(true)}>+ Add partner</button>}
      </div>
      <p className="ad-sub">These are the people at the hotel who log into the partner portal to confirm bookings and manage availability.</p>
      {err && <ErrorBox msg={err} />}

      {creating && (
        <div className="ad-mgr-form">
          <div className="ad-grid2">
            <Field label="Email"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="reception@hotel.dz" /></Field>
            <Field label="Password (initial)"><input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" /></Field>
            <Field label="First name"><input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></Field>
            <Field label="Last name"><input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></Field>
          </div>
          <div className="ad-mgr-actions">
            <button className="ad-btn ghost" onClick={() => { setCreating(false); setForm({ email: "", password: "", firstName: "", lastName: "" }); }}>Cancel</button>
            <button className="ad-btn primary" onClick={create}>Create partner account</button>
          </div>
        </div>
      )}

      {list && list.length === 0 && !creating && (
        <span className="ad-empty-inline">No partner accounts yet for this hotel.</span>
      )}
      {list && list.length > 0 && (
        <table className="ad-table">
          <thead><tr><th>Email</th><th>Name</th><th>Added</th><th></th></tr></thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.email}</strong></td>
                <td>{[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}</td>
                <td className="ad-dim">{fmtDT(u.createdAt)}</td>
                <td><button className="ad-link-danger" onClick={() => remove(u.id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <style jsx>{`
        .ad-mgr { margin-top: 28px; }
        .ad-sub { font-size: 13px; color: var(--gray-400); margin-bottom: 14px; line-height: 1.5; }
        .ad-mgr-form { background: var(--cream); padding: 18px; border-radius: var(--r-sm); margin-bottom: 16px; }
        .ad-mgr-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px; }
        .ad-link-danger { background: none; border: none; color: var(--red); font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .ad-dim { color: var(--gray-400); font-size: 12px; }
        .ad-empty-inline { color: var(--gray-400); font-size: 13px; }
      `}</style>
    </div>
  );
}

// =============================================================================
// BOOKINGS MANAGER
// =============================================================================
function BookingsManager() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState(null); // booking id for the detail panel

  const load = useCallback(() => {
    adminBookings({ limit: 50 }).then((r) => setData(r.data || [])).catch((e) => setErr(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function setStatus(id, status) {
    try {
      await adminUpdateBookingStatus(id, status);
      load();
    } catch (e) { setErr(e.message); }
  }

  return (
    <div>
      <PageHead title="Bookings" subtitle="All reservations across every hotel" />
      {err && <ErrorBox msg={err} />}
      {!data && !err && <Loading />}

      {data && data.length === 0 && (
        <div className="ad-panel"><span className="ad-empty-inline">No bookings yet.</span></div>
      )}

      {data && data.length > 0 && (
        <div className="ad-panel">
          <table className="ad-table">
            <thead>
              <tr><th>Reference</th><th>Guest</th><th>Hotel</th><th>Dates</th><th>Total</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {data.map((b) => (
                <tr key={b.id} className="ad-brow" onClick={() => setSelected(b.id)}>
                  <td><strong>{b.reference}</strong></td>
                  <td>{b.guest?.firstName} {b.guest?.lastName}<br /><span className="ad-dim">{b.guest?.phone}</span></td>
                  <td>{b.hotel?.name}</td>
                  <td className="ad-dim">{(b.checkIn || "").slice(0, 10)} → {(b.checkOut || "").slice(0, 10)}</td>
                  <td>{fmt(b.pricing?.total)}</td>
                  <td><span className={`ad-bstatus s-${b.status}`}>{b.status}</span></td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select value={b.status} onChange={(e) => setStatus(b.id, e.target.value)}>
                      {["PENDING", "CONFIRMED", "REJECTED", "CANCELLED", "COMPLETED", "NO_SHOW", "REFUNDED"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <BookingDetailPanel
          id={selected}
          onClose={() => setSelected(null)}
          onChanged={() => { load(); }}
        />
      )}

      <style jsx>{`
        .ad-brow { cursor: pointer; }
        .ad-brow:hover { background: var(--gray-100); }
        .ad-dim { color: var(--gray-400); font-size: 12px; }
        .ad-empty-inline { color: var(--gray-400); font-size: 13px; }
        .ad-bstatus { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 980px; }
        .s-CONFIRMED, .s-COMPLETED { background: var(--teal-soft); color: var(--teal); }
        .s-PENDING { background: #FFF4E0; color: #9A6700; }
        .s-REJECTED, .s-CANCELLED, .s-NO_SHOW, .s-REFUNDED { background: var(--red-soft); color: var(--red-deep); }
        select { padding: 6px 8px; border: 1.5px solid var(--gray-200); border-radius: var(--r-sm); font-size: 12px; }
      `}</style>
    </div>
  );
}

// =============================================================================
// Booking detail modal — shows everything about one booking and lets
// the admin confirm or reject it directly.
// =============================================================================
function BookingDetailPanel({ id, onClose, onChanged }) {
  const [b, setB] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminBookingDetail(id).then(setB).catch((e) => setErr(e.message));
  }, [id]);

  async function confirm() {
    setBusy(true);
    try {
      await adminUpdateBookingStatus(id, "CONFIRMED");
      onChanged();
      onClose();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }
  async function reject() {
    if (!window.confirm("Reject this booking? The guest will need to be refunded.")) return;
    setBusy(true);
    try {
      await adminUpdateBookingStatus(id, "REJECTED");
      onChanged();
      onClose();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <div className="bd-back" onClick={onClose}>
      <div className="bd-panel" onClick={(e) => e.stopPropagation()}>
        <button className="bd-close" onClick={onClose} aria-label="Close">×</button>
        {err && <ErrorBox msg={err} />}
        {!b && !err && <Loading />}
        {b && (
          <>
            <div className="bd-head">
              <div>
                <div className="bd-ref">{b.reference}</div>
                <span className={`ad-bstatus s-${b.status}`}>{b.status}</span>
              </div>
              <div className="bd-total">
                <span>Total</span>
                <strong>{fmt(b.pricing?.total)}</strong>
              </div>
            </div>

            <div className="bd-grid">
              <Section title="Guest">
                <Row label="Name" value={`${b.guest?.firstName || ""} ${b.guest?.lastName || ""}`.trim()} />
                <Row label="Email" value={b.guest?.email} link={b.guest?.email ? `mailto:${b.guest.email}` : null} />
                <Row label="Phone" value={b.guest?.phone} link={b.guest?.phone ? `https://wa.me/${(b.guest.phone || "").replace(/\D/g, "")}` : null} />
              </Section>

              <Section title="Stay">
                <Row label="Hotel" value={b.hotel?.name} />
                <Row label="City" value={b.hotel?.city} />
                <Row label="Check-in" value={(b.checkIn || "").slice(0, 10)} />
                <Row label="Check-out" value={(b.checkOut || "").slice(0, 10)} />
                <Row label="Nights" value={b.nights} />
              </Section>

              <Section title="Rooms">
                {(b.rooms || []).map((r, i) => (
                  <Row key={i} label={r.type || `Room ${i + 1}`} value={`× ${r.quantity} · ${fmt(r.pricePerNight)} / night`} />
                ))}
              </Section>

              <Section title="Pricing">
                <Row label="Subtotal" value={fmt(b.pricing?.subtotal)} />
                {b.pricing?.discount > 0 && (
                  <Row label="Discount" value={`− ${fmt(b.pricing.discount)}`} />
                )}
                <Row label="Taxes & fees" value="Included" />
                <Row label="Total" value={fmt(b.pricing?.total)} strong />
              </Section>

              <Section title="Payment">
                <Row label="Method" value={b.payment?.method} />
                <Row label="Status" value={b.payment?.status} />
              </Section>

              {b.specialRequests && (
                <Section title="Special requests" full>
                  <p className="bd-notes">{b.specialRequests}</p>
                </Section>
              )}

              <Section title="Timestamps" full>
                <Row label="Created" value={fmtDT(b.createdAt)} />
                {b.confirmedAt && <Row label="Confirmed" value={fmtDT(b.confirmedAt)} />}
                {b.cancelledAt && <Row label="Cancelled" value={fmtDT(b.cancelledAt)} />}
                {b.cancellationReason && <Row label="Reason" value={b.cancellationReason} />}
              </Section>
            </div>

            {b.status === "PENDING" && (
              <div className="bd-actions">
                <button className="bd-reject" onClick={reject} disabled={busy}>Reject booking</button>
                <button className="bd-confirm" onClick={confirm} disabled={busy}>Confirm booking</button>
              </div>
            )}
          </>
        )}

        <style jsx>{`
          .bd-back {
            position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.45);
            display: flex; align-items: center; justify-content: center;
            padding: 24px; overflow-y: auto;
          }
          .bd-panel {
            position: relative; background: #fff; border-radius: var(--r-lg);
            max-width: 760px; width: 100%; max-height: 92vh; overflow-y: auto;
            padding: 28px 32px;
          }
          .bd-close {
            position: absolute; top: 14px; right: 14px;
            width: 36px; height: 36px; border-radius: 50%; border: none;
            background: var(--gray-100); font-size: 22px; line-height: 1; cursor: pointer;
          }
          .bd-head {
            display: flex; justify-content: space-between; align-items: flex-start;
            margin-bottom: 22px; padding-bottom: 18px; border-bottom: 1px solid var(--gray-100);
          }
          .bd-ref { font-size: 22px; font-weight: 800; letter-spacing: 0.02em; margin-bottom: 8px; color: var(--ink); }
          .bd-total { text-align: right; }
          .bd-total span { display: block; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--gray-400); margin-bottom: 4px; }
          .bd-total strong { font-size: 22px; font-weight: 800; color: var(--ink); }
          .bd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
          .bd-notes { font-size: 14px; line-height: 1.6; color: var(--ink-2); white-space: pre-wrap; }
          .bd-actions {
            display: flex; gap: 10px; justify-content: flex-end;
            margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--gray-100);
          }
          .bd-confirm, .bd-reject {
            padding: 12px 22px; border-radius: var(--r-sm); border: none; cursor: pointer;
            font-size: 14px; font-weight: 700; font-family: inherit;
          }
          .bd-confirm { background: var(--teal); color: #fff; }
          .bd-reject { background: var(--red-soft); color: var(--red-deep); }
          .bd-confirm:disabled, .bd-reject:disabled { opacity: 0.6; cursor: default; }
          @media (max-width: 640px) {
            .bd-grid { grid-template-columns: 1fr; }
            .bd-panel { padding: 22px; }
          }
        `}</style>
      </div>
    </div>
  );
}

function Section({ title, children, full }) {
  return (
    <div className={`bd-section ${full ? "full" : ""}`}>
      <h4>{title}</h4>
      <div className="bd-rows">{children}</div>
      <style jsx>{`
        .bd-section.full { grid-column: 1 / -1; }
        h4 { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gray-400); margin-bottom: 10px; }
        .bd-rows { display: flex; flex-direction: column; gap: 6px; }
      `}</style>
    </div>
  );
}
function Row({ label, value, link, strong }) {
  if (!value && value !== 0) return null;
  return (
    <div className="bd-row">
      <span>{label}</span>
      {link ? <a href={link} target="_blank" rel="noreferrer"><strong>{value}</strong></a>
            : <strong className={strong ? "is-strong" : ""}>{value}</strong>}
      <style jsx>{`
        .bd-row { display: flex; justify-content: space-between; gap: 12px; font-size: 13.5px; }
        .bd-row > span { color: var(--gray-400); font-weight: 500; }
        .bd-row strong { color: var(--ink); font-weight: 700; }
        .bd-row .is-strong { font-size: 15px; }
        .bd-row a { text-decoration: none; color: var(--red); }
        .bd-row a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
function fmtDT(s) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleString("en", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return s; }
}

// =============================================================================
// SHARED BITS
// =============================================================================
function PageHead({ title, subtitle, action }) {
  return (
    <div className="ad-pagehead">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
      <style jsx>{`
        .ad-pagehead { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; }
        .ad-pagehead h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }
        .ad-pagehead p { font-size: 13.5px; color: var(--gray-400); margin-top: 3px; }
      `}</style>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="ad-stat">
      <div className="ad-stat-value display">{value}</div>
      <div className="ad-stat-label">{label}</div>
      <style jsx>{`
        .ad-stat { background: #fff; border: 1px solid var(--gray-200); border-radius: var(--r-md); padding: 18px; }
        .ad-stat-value { font-size: 26px; font-weight: 600; letter-spacing: -0.02em; }
        .ad-stat-label { font-size: 12px; color: var(--gray-400); font-weight: 600; margin-top: 4px; }
      `}</style>
    </div>
  );
}

function Field({ label, v, onChange, type = "text", area, rtl }) {
  return (
    <div className="ad-field">
      <label>{label}</label>
      {area
        ? <textarea value={v} onChange={(e) => onChange(e.target.value)} dir={rtl ? "rtl" : "ltr"} rows={3} />
        : <input type={type} value={v} onChange={(e) => onChange(e.target.value)} dir={rtl ? "rtl" : "ltr"} />}
      <style jsx>{`
        .ad-field label { display: block; font-size: 11.5px; font-weight: 700; color: var(--gray-400); margin-bottom: 5px; }
        .ad-field input, .ad-field textarea {
          width: 100%; padding: 9px 12px; border: 1.5px solid var(--gray-200);
          border-radius: var(--r-sm); font-size: 13px; outline: none; font-family: inherit;
        }
        .ad-field input:focus, .ad-field textarea:focus { border-color: var(--red); }
        .ad-field textarea { resize: vertical; }
      `}</style>
    </div>
  );
}

function Toggle({ label, v, onChange }) {
  return (
    <button className={`ad-toggle ${v ? "on" : ""}`} onClick={() => onChange(!v)} type="button">
      <span className="ad-toggle-dot" />
      {label}
      <style jsx>{`
        .ad-toggle {
          display: flex; align-items: center; gap: 8px; padding: 8px 12px;
          border: 1.5px solid var(--gray-200); background: #fff; border-radius: 980px;
          font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit; color: var(--gray-400);
        }
        .ad-toggle.on { border-color: var(--red); color: var(--ink); background: var(--red-soft); }
        .ad-toggle-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--gray-300); }
        .ad-toggle.on .ad-toggle-dot { background: var(--red); }
      `}</style>
    </button>
  );
}

function Loading() {
  return <div className="ad-loading">Loading…<style jsx>{`
    .ad-loading { padding: 40px; text-align: center; color: var(--gray-400); font-size: 14px; }
  `}</style></div>;
}

function ErrorBox({ msg }) {
  return <div className="ad-errbox">{msg}<style jsx>{`
    .ad-errbox {
      padding: 12px 14px; background: var(--red-soft); color: var(--red-deep);
      border-radius: var(--r-sm); font-size: 13px; font-weight: 600; margin-bottom: 16px;
    }
  `}</style></div>;
}
