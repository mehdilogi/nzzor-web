"use client";

// =============================================================================
// GroupRequest — /groupes
// -----------------------------------------------------------------------------
// Groups of 10+ never go through instant booking. This page takes a short
// request and hands it to the agency, which answers with a group quote.
// Trilingual through LangContext; Arabic flips the whole page RTL.
// =============================================================================

import { useState } from "react";
import { useLang } from "../lib/LangContext";
import { MOCK_CITIES } from "../lib/mockData";
import ArabesqueGlow from "./ArabesqueGlow";

const API = process.env.NEXT_PUBLIC_API_URL || "";
const WHATSAPP = "213770080830";

const TYPES = ["COMPANY", "WEDDING", "SPORTS", "SCHOOL", "ASSOCIATION", "OTHER"];
const BUDGETS = ["lt5", "5to10", "10to20", "gt20", "open"];

const S = {
  fr: {
    kicker: "Voyages de groupe",
    title: "Un groupe à loger ? On s'occupe de tout.",
    intro: "Séminaire, mariage, équipe sportive, sortie scolaire : à partir de 10 personnes, notre agence négocie directement avec les hôtels un tarif de groupe et vous envoie un devis.",
    p1: "Tarif de groupe négocié", p1d: "Meilleur que le prix public, chambres bloquées pour vos dates.",
    p2: "Devis sous 24 h", p2d: "Par WhatsApp ou e-mail, avec les options adaptées à votre budget.",
    p3: "Un interlocuteur unique", p3d: "Agence agréée par le Ministère du Tourisme, de la demande au séjour.",
    form: "Votre demande",
    type: "Type de groupe",
    types: { COMPANY: "Entreprise / séminaire", WEDDING: "Mariage / fête", SPORTS: "Équipe sportive", SCHOOL: "École / université", ASSOCIATION: "Association / club", OTHER: "Autre" },
    destination: "Destination", dest_any: "Plusieurs villes / à définir",
    checkIn: "Arrivée", checkOut: "Départ",
    people: "Nombre de personnes", rooms: "Chambres (approx.)",
    budget: "Budget par chambre et par nuit",
    budgets: { lt5: "Moins de 5 000 DA", "5to10": "5 000 – 10 000 DA", "10to20": "10 000 – 20 000 DA", gt20: "Plus de 20 000 DA", open: "À discuter" },
    organization: "Entreprise / organisme (facultatif)",
    name: "Nom et prénom", phone: "Téléphone (WhatsApp)", email: "E-mail (facultatif)",
    message: "Précisions (facultatif)", message_ph: "Salle de réunion, repas, transport, chambres simples…",
    submit: "Demander un devis", sending: "Envoi…",
    err: "Vérifiez les champs en rouge.", err_net: "L'envoi a échoué. Réessayez ou écrivez-nous sur WhatsApp.",
    err_dates: "La date de départ doit être après l'arrivée.",
    ok_title: "Demande reçue", ok_body: "Notre équipe vous contacte sous 24 heures avec un devis. Votre référence :",
    ok_wa: "Accélérer sur WhatsApp", again: "Nouvelle demande",
    wa_msg: (r) => `Bonjour Nzzor, je viens d'envoyer une demande de groupe (réf. ${r}).`,
    dir: "ltr",
  },
  en: {
    kicker: "Group travel",
    title: "Booking for a group? We handle it.",
    intro: "Seminar, wedding, sports team, school trip: from 10 people, our agency negotiates a group rate directly with hotels and sends you a quote.",
    p1: "Negotiated group rate", p1d: "Better than the public price, rooms held for your dates.",
    p2: "Quote within 24 h", p2d: "By WhatsApp or email, with options that fit your budget.",
    p3: "One point of contact", p3d: "Licensed by the Ministry of Tourism, from request to stay.",
    form: "Your request",
    type: "Type of group",
    types: { COMPANY: "Company / seminar", WEDDING: "Wedding / party", SPORTS: "Sports team", SCHOOL: "School / university", ASSOCIATION: "Association / club", OTHER: "Other" },
    destination: "Destination", dest_any: "Several cities / to be defined",
    checkIn: "Check-in", checkOut: "Check-out",
    people: "Number of people", rooms: "Rooms (approx.)",
    budget: "Budget per room per night",
    budgets: { lt5: "Under 5,000 DA", "5to10": "5,000 – 10,000 DA", "10to20": "10,000 – 20,000 DA", gt20: "Over 20,000 DA", open: "Open" },
    organization: "Company / organisation (optional)",
    name: "Full name", phone: "Phone (WhatsApp)", email: "Email (optional)",
    message: "Details (optional)", message_ph: "Meeting room, meals, transport, single rooms…",
    submit: "Request a quote", sending: "Sending…",
    err: "Please check the fields in red.", err_net: "Sending failed. Try again or message us on WhatsApp.",
    err_dates: "Check-out must be after check-in.",
    ok_title: "Request received", ok_body: "Our team will contact you within 24 hours with a quote. Your reference:",
    ok_wa: "Speed it up on WhatsApp", again: "New request",
    wa_msg: (r) => `Hello Nzzor, I just sent a group request (ref. ${r}).`,
    dir: "ltr",
  },
  ar: {
    kicker: "رحلات المجموعات",
    title: "تحجزون لمجموعة؟ نتكفّل بكل شيء.",
    intro: "ندوة، عرس، فريق رياضي، رحلة مدرسية: ابتداءً من 10 أشخاص، تتفاوض وكالتنا مباشرة مع الفنادق على سعر المجموعات وترسل لكم عرض سعر.",
    p1: "سعر مجموعات تفاوضي", p1d: "أفضل من السعر العادي، مع حجز الغرف لتواريخكم.",
    p2: "عرض سعر خلال 24 ساعة", p2d: "عبر واتساب أو البريد، مع خيارات تناسب ميزانيتكم.",
    p3: "محاور واحد", p3d: "وكالة معتمدة من وزارة السياحة، من الطلب إلى الإقامة.",
    form: "طلبكم",
    type: "نوع المجموعة",
    types: { COMPANY: "شركة / ندوة", WEDDING: "عرس / حفل", SPORTS: "فريق رياضي", SCHOOL: "مدرسة / جامعة", ASSOCIATION: "جمعية / نادٍ", OTHER: "أخرى" },
    destination: "الوجهة", dest_any: "عدة مدن / لم تُحدَّد بعد",
    checkIn: "الوصول", checkOut: "المغادرة",
    people: "عدد الأشخاص", rooms: "عدد الغرف (تقريباً)",
    budget: "الميزانية لكل غرفة في الليلة",
    budgets: { lt5: "أقل من 5,000 دج", "5to10": "5,000 – 10,000 دج", "10to20": "10,000 – 20,000 دج", gt20: "أكثر من 20,000 دج", open: "للنقاش" },
    organization: "الشركة / الهيئة (اختياري)",
    name: "الاسم واللقب", phone: "الهاتف (واتساب)", email: "البريد الإلكتروني (اختياري)",
    message: "تفاصيل إضافية (اختياري)", message_ph: "قاعة اجتماعات، وجبات، نقل، غرف فردية…",
    submit: "اطلبوا عرض سعر", sending: "جارٍ الإرسال…",
    err: "يرجى التحقق من الحقول المحددة بالأحمر.", err_net: "تعذّر الإرسال. أعيدوا المحاولة أو راسلونا عبر واتساب.",
    err_dates: "يجب أن يكون تاريخ المغادرة بعد تاريخ الوصول.",
    ok_title: "تم استلام طلبكم", ok_body: "سيتصل بكم فريقنا خلال 24 ساعة مع عرض السعر. رقم طلبكم:",
    ok_wa: "تسريع الطلب عبر واتساب", again: "طلب جديد",
    wa_msg: (r) => `مرحباً نزور، أرسلت للتو طلب حجز لمجموعة (المرجع ${r}).`,
    dir: "rtl",
  },
};

const today = () => {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
};

export default function GroupRequest() {
  const { lang } = useLang();
  const s = S[lang] || S.fr;

  const [f, setF] = useState({
    groupType: "COMPANY", destination: "", checkIn: "", checkOut: "",
    people: "", rooms: "", budget: "", organization: "",
    contactName: "", phone: "", email: "", message: "", website: "",
  });
  const [bad, setBad] = useState({});
  const [state, setState] = useState("idle"); // idle | sending | done
  const [error, setError] = useState(null);
  const [ref, setRef] = useState(null);

  const set = (k) => (e) => { const v = e && e.target ? e.target.value : e; setF((x) => ({ ...x, [k]: v })); setBad((b) => ({ ...b, [k]: false })); };

  function validate() {
    const b = {};
    const n = Number(f.people);
    if (!Number.isInteger(n) || n < 2) b.people = true;
    if (f.contactName.trim().length < 2) b.contactName = true;
    if (f.phone.replace(/\D/g, "").length < 9) b.phone = true;
    if (f.email && !/.+@.+\..+/.test(f.email)) b.email = true;
    if (f.checkIn && f.checkOut && f.checkOut <= f.checkIn) { b.checkOut = true; }
    setBad(b);
    if (b.checkOut && Object.keys(b).length === 1) setError(s.err_dates);
    else setError(Object.keys(b).length ? s.err : null);
    return Object.keys(b).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    setState("sending");
    try {
      const res = await fetch(`${API}/api/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          people: Number(f.people),
          rooms: f.rooms ? Number(f.rooms) : null,
          destination: f.destination || null,
          budget: f.budget ? (S.fr.budgets[f.budget] || f.budget) : null,
          lang,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.data) throw new Error(j.error || "failed");
      setRef(j.data.reference);
      setState("done");
      try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {}
    } catch {
      setError(s.err_net);
      setState("idle");
    }
  }

  const cls = (k) => `gr-in${bad[k] ? " bad" : ""}`;

  return (
    <main className="gr" dir={s.dir} lang={lang}>
      <ArabesqueGlow tone="light" clearAt="30% 30%" />
      <div className="wrap gr-wrap">
        <section className="gr-copy">
          <div className="gr-kicker">{s.kicker}</div>
          <h1 className="display">{s.title}</h1>
          <p className="gr-intro">{s.intro}</p>
          <ul className="gr-points">
            {[[s.p1, s.p1d], [s.p2, s.p2d], [s.p3, s.p3d]].map(([h, d], i) => (
              <li key={i}>
                <span className="gr-num">{i + 1}</span>
                <div><strong>{h}</strong><span>{d}</span></div>
              </li>
            ))}
          </ul>
        </section>

        <section className="gr-card">
          {state === "done" ? (
            <div className="gr-done">
              <div className="gr-check">✓</div>
              <h2 className="display">{s.ok_title}</h2>
              <p>{s.ok_body}</p>
              <div className="gr-ref" dir="ltr">{ref}</div>
              <a className="gr-btn wa" href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(s.wa_msg(ref))}`} target="_blank" rel="noopener noreferrer">{s.ok_wa}</a>
              <button className="gr-link" onClick={() => { setState("idle"); setRef(null); }}>{s.again}</button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <h2 className="display gr-form-title">{s.form}</h2>

              <div className="gr-label">{s.type}</div>
              <div className="gr-chips">
                {TYPES.map((k) => (
                  <button type="button" key={k} className={`gr-chip${f.groupType === k ? " on" : ""}`} onClick={() => set("groupType")(k)}>
                    {s.types[k]}
                  </button>
                ))}
              </div>

              <div className="gr-grid">
                <label className="gr-f span2">
                  <span>{s.destination}</span>
                  <select className={cls("destination")} value={f.destination} onChange={set("destination")}>
                    <option value="">{s.dest_any}</option>
                    {MOCK_CITIES.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
                  </select>
                </label>
                <label className="gr-f">
                  <span>{s.checkIn}</span>
                  <input type="date" className={cls("checkIn")} min={today()} value={f.checkIn} onChange={set("checkIn")} />
                </label>
                <label className="gr-f">
                  <span>{s.checkOut}</span>
                  <input type="date" className={cls("checkOut")} min={f.checkIn || today()} value={f.checkOut} onChange={set("checkOut")} />
                </label>
                <label className="gr-f">
                  <span>{s.people} *</span>
                  <input type="number" inputMode="numeric" min="2" className={cls("people")} value={f.people} onChange={set("people")} placeholder="25" />
                </label>
                <label className="gr-f">
                  <span>{s.rooms}</span>
                  <input type="number" inputMode="numeric" min="1" className={cls("rooms")} value={f.rooms} onChange={set("rooms")} placeholder="12" />
                </label>
                <label className="gr-f span2">
                  <span>{s.budget}</span>
                  <select className={cls("budget")} value={f.budget} onChange={set("budget")}>
                    <option value="">—</option>
                    {BUDGETS.map((k) => <option key={k} value={k}>{s.budgets[k]}</option>)}
                  </select>
                </label>
                <label className="gr-f span2">
                  <span>{s.organization}</span>
                  <input className={cls("organization")} value={f.organization} onChange={set("organization")} />
                </label>
                <label className="gr-f span2">
                  <span>{s.name} *</span>
                  <input className={cls("contactName")} value={f.contactName} onChange={set("contactName")} autoComplete="name" />
                </label>
                <label className="gr-f">
                  <span>{s.phone} *</span>
                  <input type="tel" dir="ltr" className={cls("phone")} value={f.phone} onChange={set("phone")} placeholder="0550 00 00 00" autoComplete="tel" />
                </label>
                <label className="gr-f">
                  <span>{s.email}</span>
                  <input type="email" dir="ltr" className={cls("email")} value={f.email} onChange={set("email")} autoComplete="email" />
                </label>
                <label className="gr-f span2">
                  <span>{s.message}</span>
                  <textarea rows={3} className={cls("message")} value={f.message} onChange={set("message")} placeholder={s.message_ph} />
                </label>
                {/* Honeypot: invisible to people, irresistible to bots. */}
                <input className="gr-hp" tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} aria-hidden="true" />
              </div>

              {error && <div className="gr-err">{error}</div>}
              <button className="gr-btn" type="submit" disabled={state === "sending"}>
                {state === "sending" ? s.sending : s.submit}
              </button>
            </form>
          )}
        </section>
      </div>

      <style jsx>{`
        .gr { position: relative; overflow: hidden; isolation: isolate; background: var(--cream, #FAF8F4); min-height: 80vh; }
        .gr-wrap { position: relative; z-index: 2; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 56px; padding-top: 64px; padding-bottom: 96px; align-items: start; }
        /* A soft cream halo behind the text column: the zellige glow keeps
           moving around it, but never under the words. */
        .gr-copy { position: relative; isolation: isolate; }
        .gr-copy::before {
          content: ""; position: absolute; z-index: -1; pointer-events: none;
          inset: -56px -72px -48px -72px;
          background: radial-gradient(ellipse 62% 60% at 45% 48%, var(--cream, #FAF8F4) 62%, rgba(250, 248, 244, 0.85) 76%, rgba(250, 248, 244, 0) 100%);
        }
        .gr-kicker { font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--red); margin-bottom: 14px; }
        .gr-copy h1 { font-size: clamp(34px, 4.4vw, 54px); line-height: 1.04; letter-spacing: -0.03em; font-weight: 600; color: var(--ink); margin: 0; }
        .gr-intro { font-size: 16.5px; line-height: 1.7; color: var(--ink-2); margin: 20px 0 32px; max-width: 520px; }
        .gr-points { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 18px; }
        .gr-points li { display: flex; gap: 14px; align-items: flex-start; }
        .gr-num { flex-shrink: 0; width: 30px; height: 30px; border-radius: 50%; background: var(--ink); color: #fff; font-size: 13px; font-weight: 700; display: grid; place-items: center; }
        .gr-points strong { display: block; font-size: 15.5px; color: var(--ink); }
        .gr-points span { font-size: 14px; color: var(--gray-400); line-height: 1.55; }
        .gr-card { background: #fff; border: 1px solid var(--gray-200); border-radius: 20px; padding: 28px; box-shadow: 0 30px 60px -30px rgba(22,22,26,.25); }
        .gr-form-title { font-size: 22px; font-weight: 600; margin: 0 0 18px; color: var(--ink); }
        .gr-label { font-size: 12px; font-weight: 700; color: var(--gray-400); margin-bottom: 8px; }
        .gr-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
        .gr-chip { border: 1.5px solid var(--gray-200); background: #fff; color: var(--ink); border-radius: 980px; padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .gr-chip.on { background: var(--ink); border-color: var(--ink); color: #fff; }
        .gr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 12px; }
        .gr-f { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .gr-f.span2 { grid-column: 1 / -1; }
        .gr-f > span { font-size: 12px; font-weight: 700; color: var(--gray-400); }
        .gr-in { width: 100%; box-sizing: border-box; border: 1.5px solid var(--gray-200); border-radius: 12px; padding: 11px 13px; font-size: 14.5px; font-family: inherit; color: var(--ink); background: #fff; outline: none; }
        .gr-in:focus { border-color: var(--ink); }
        .gr-in.bad { border-color: var(--red); background: #fff7f7; }
        textarea.gr-in { resize: vertical; }
        .gr-hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
        .gr-err { color: var(--red); font-size: 13.5px; font-weight: 600; margin-top: 14px; }
        .gr-btn { display: block; width: 100%; margin-top: 18px; background: var(--red); color: #fff; border: 0; border-radius: 980px; padding: 15px; font-size: 15px; font-weight: 700; font-family: inherit; cursor: pointer; text-align: center; text-decoration: none; box-sizing: border-box; }
        .gr-btn:hover { background: var(--red-deep); }
        .gr-btn:disabled { opacity: .6; cursor: default; }
        .gr-btn.wa { background: #1B8A5A; }
        .gr-done { text-align: center; padding: 18px 4px; }
        .gr-check { width: 64px; height: 64px; border-radius: 50%; background: #1B8A5A; color: #fff; font-size: 28px; display: grid; place-items: center; margin: 0 auto 16px; }
        .gr-done h2 { font-size: 26px; margin: 0 0 10px; color: var(--ink); }
        .gr-done p { color: var(--gray-400); font-size: 15px; line-height: 1.6; margin: 0 0 14px; }
        .gr-ref { display: inline-block; border: 1px dashed var(--gray-300); border-radius: 12px; padding: 10px 18px; font-size: 20px; font-weight: 700; letter-spacing: .05em; color: var(--ink); }
        .gr-link { margin-top: 14px; background: none; border: 0; color: var(--gray-400); font-size: 14px; cursor: pointer; font-family: inherit; text-decoration: underline; }
        @media (max-width: 900px) {
          .gr-copy::before { inset: -24px -20px; background: radial-gradient(ellipse 80% 70% at 50% 50%, var(--cream, #FAF8F4) 70%, rgba(250, 248, 244, 0) 100%); }
          .gr-wrap { grid-template-columns: 1fr; gap: 32px; padding-top: 36px; padding-bottom: 72px; }
        }
        @media (max-width: 520px) {
          .gr-card { padding: 20px 16px; border-radius: 16px; }
          .gr-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
}
