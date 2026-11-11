"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Icon, { AMENITY_ICON } from "./Icon";
import Lightbox from "./Lightbox";
import HotelMap from "./HotelMap";
import { formatPrice, formatPriceShort } from "../lib/format";
import { useLang } from "../lib/LangContext";
import { todayInAlgiers, validateBookingDates, localizeDateError } from "../lib/dates";

// Group flat quote options into one entry per room type (each with its boards).
function groupOptionsByRoom(options) {
  const byRoom = new Map();
  for (const o of options || []) {
    if (!byRoom.has(o.roomId)) {
      byRoom.set(o.roomId, { roomId: o.roomId, roomType: o.roomType, availability: o.availability, boards: [] });
    }
    byRoom.get(o.roomId).boards.push(o);
  }
  return Array.from(byRoom.values());
}

// Inline copy for the strings this page owned in English. A missing dictionary
// key humanises into English in production ("Tab location"), so these never go
// through t(). Three languages, French as the fallback.
const TX = {
  fr: {
    overview: "Aperçu", location: "Emplacement", rooms: "Chambres", amenities: "Équipements", policies: "Conditions",
    all_meals: "Toutes formules", night: "nuit", nights: "nuits", guest: "voyageur", guests: "voyageurs",
    breakfast: "Petit-déjeuner inclus", total_stay: "total du séjour", select: "Choisir", selected: "Choisie ✓",
    cart: (n, q) => `Votre réservation · ${n} sur ${q} chambre${q > 1 ? "s" : ""}`,
    cart_empty: "Touchez « Choisir » sur un tarif pour ajouter une chambre.",
    book_now: "Réserver", on_request: "Sur demande", loading: "Chargement des tarifs…",
    too_small: (c, g) => `${c} pers. max · trop petite pour ${g}`,
    cap_one: (c, g) => `Cette chambre accueille ${c} pers., vous êtes ${g}. Choisissez une chambre plus grande.`,
    cap_many: (c, g) => `Vos chambres accueillent ${c} pers., vous êtes ${g}. Ajoutez une chambre ou prenez-en une plus grande.`,
    check_in: "Arrivée", check_out: "Départ", rooms_n: "chambres", your_selection: "Votre sélection", from: "À partir de",
    pick_dates: "Choisissez vos dates pour voir les tarifs et les formules.",
    wa_head: "Réservation via WhatsApp",
    wa_body: "Cet hôtel n'est pas encore réservable en ligne. Notre équipe le réserve pour vous et vous confirme le prix sur WhatsApp.",
    wa_cta: "Réserver via WhatsApp", wa_room: "Demander cette chambre",
    wa_steps: ["Envoyez-nous vos dates", "Nous vérifions et confirmons le prix", "Vous payez, nous vous envoyons le bon"],
    wa_rooms_note: "Prix et disponibilité confirmés par notre équipe sur WhatsApp.",
    wa_msg: (h, c, ci, co, g, r) => `Bonjour Nzzor, je souhaite réserver ${h} (${c})${r ? ` — ${r}` : ""}, du ${ci} au ${co}, pour ${g} personne(s).`,
  },
  en: {
    overview: "Overview", location: "Location", rooms: "Rooms", amenities: "Amenities", policies: "Policies",
    all_meals: "All meal plans", night: "night", nights: "nights", guest: "guest", guests: "guests",
    breakfast: "Breakfast included", total_stay: "total stay", select: "Select", selected: "Selected ✓",
    cart: (n, q) => `Your booking · ${n} of ${q} room${q > 1 ? "s" : ""}`,
    cart_empty: "Tap Select on a rate to add a room.",
    book_now: "Book", on_request: "On request", loading: "Loading rates…",
    too_small: (c, g) => `Sleeps ${c} · too small for ${g}`,
    cap_one: (c, g) => `This room sleeps ${c}, but you are ${g}. Please choose a larger room.`,
    cap_many: (c, g) => `Your rooms sleep ${c}, but you are ${g}. Add a room or pick a larger one.`,
    check_in: "Check in", check_out: "Check out", rooms_n: "rooms", your_selection: "Your selection", from: "From",
    pick_dates: "Choose your dates to see rates and meal plans.",
    wa_head: "Booked via WhatsApp",
    wa_body: "This hotel can't be booked online yet. Our team books it for you and confirms the price on WhatsApp.",
    wa_cta: "Book via WhatsApp", wa_room: "Ask for this room",
    wa_steps: ["Send us your dates", "We check and confirm the price", "You pay, we send your voucher"],
    wa_rooms_note: "Price and availability confirmed by our team on WhatsApp.",
    wa_msg: (h, c, ci, co, g, r) => `Hello Nzzor, I'd like to book ${h} (${c})${r ? ` — ${r}` : ""}, from ${ci} to ${co}, for ${g} guest(s).`,
  },
  ar: {
    overview: "نظرة عامة", location: "الموقع", rooms: "الغرف", amenities: "المرافق", policies: "الشروط",
    all_meals: "كل الصيغ", night: "ليلة", nights: "ليالٍ", guest: "شخص", guests: "أشخاص",
    breakfast: "الإفطار مشمول", total_stay: "مجموع الإقامة", select: "اختيار", selected: "تم الاختيار ✓",
    cart: (n, q) => `حجزك · ${n} من ${q} غرفة`,
    cart_empty: "اضغط «اختيار» على سعر لإضافة غرفة.",
    book_now: "احجز", on_request: "حسب الطلب", loading: "جارٍ تحميل الأسعار…",
    too_small: (c, g) => `تتسع لـ ${c} · صغيرة على ${g}`,
    cap_one: (c, g) => `هذه الغرفة تتسع لـ ${c} وأنتم ${g}. اختر غرفة أكبر.`,
    cap_many: (c, g) => `غرفك تتسع لـ ${c} وأنتم ${g}. أضف غرفة أو اختر غرفة أكبر.`,
    check_in: "الوصول", check_out: "المغادرة", rooms_n: "غرف", your_selection: "اختيارك", from: "ابتداءً من",
    pick_dates: "اختر تواريخك لرؤية الأسعار والصيغ.",
    wa_head: "الحجز عبر واتساب",
    wa_body: "هذا الفندق غير متاح للحجز عبر الإنترنت بعد. فريقنا يحجزه لك ويؤكد السعر عبر واتساب.",
    wa_cta: "احجز عبر واتساب", wa_room: "اطلب هذه الغرفة",
    wa_steps: ["أرسل لنا تواريخك", "نتحقق ونؤكد السعر", "تدفع ونرسل لك القسيمة"],
    wa_rooms_note: "السعر والتوفر يؤكدهما فريقنا عبر واتساب.",
    wa_msg: (h, c, ci, co, g, r) => `مرحبا Nzzor، أريد حجز ${h} (${c})${r ? ` — ${r}` : ""} من ${ci} إلى ${co} لـ ${g} شخص.`,
  },
};
const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP || "213770080830";

function localized(obj, lang) {
  if (!obj) return "";
  return obj[lang] || obj.en || obj.fr || "";
}

export default function HotelDetail({ hotel }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rooms = hotel.rooms || [];
  // How many units the guest is booking, carried from the search picker via
  // ?rooms=N. Named roomsQty to avoid clashing with `rooms` (the hotel's room
  // list above). Clamped 1..10. Drives the widget total so the preview here
  // matches the booking page (which reads the same param).
  const roomsQty = (() => {
    const n = parseInt(searchParams.get("rooms") || "1", 10);
    if (Number.isNaN(n)) return 1;
    return Math.min(10, Math.max(1, n));
  })();
  const { t, lang } = useLang();
  const L = (k) => (TX[lang] && TX[lang][k]) || TX.fr[k];
  // No contract with Nzzor: the hotel is shown, but booked over WhatsApp.
  // No live rates, no prices, no checkout, no promises only a contract keeps.
  const waOnly = hotel.onlineBooking === false;
  const [selectedRoom, setSelectedRoom] = useState(rooms[0] || null);
  // Pre-fill dates from the URL (carried over from the search bar). When the
  // user lands here directly from /hotels (no dates in URL), default to
  // tomorrow + the day after, so a quote loads and the new room picker shows
  // instead of the old static fallback. The user can change the dates inline.
  const defaultDates = (() => {
    const d1 = new Date(); d1.setDate(d1.getDate() + 1);
    const d2 = new Date(); d2.setDate(d2.getDate() + 2);
    const fmt = (d) => d.toISOString().slice(0, 10);
    return { ci: fmt(d1), co: fmt(d2) };
  })();
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || defaultDates.ci);
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || defaultDates.co);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // ---- Direction A: per-room slots + live quote (Phase C2) ----------------
  // Occupancy from search (?occ=2-0_2-1) gives the number of room slots.
  const occupancy = (() => {
    const occ = searchParams.get("occ");
    if (occ) {
      const parsed = occ.split("_").map((r) => {
        const [a, c] = r.split("-").map((n) => parseInt(n, 10));
        return { adults: a || 1, children: c || 0 };
      });
      if (parsed.length) return parsed;
    }
    const adults = parseInt(searchParams.get("adults") || "2", 10) || 2;
    const children = parseInt(searchParams.get("children") || "0", 10) || 0;
    const n = Math.min(10, Math.max(1, parseInt(searchParams.get("rooms") || "1", 10) || 1));
    const pa = Math.max(1, Math.round(adults / n));
    const pc = Math.round(children / n);
    return Array.from({ length: n }, () => ({ adults: pa, children: pc }));
  })();

  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  // Cart: rooms the guest has added by clicking Select on a rate card. Each
  // entry { roomId, board }. Order = add order. Length is independent of
  // occupancy (the guest adds as many rooms as they want).
  const [cart, setCart] = useState([]);
  // Active meal-plan filter (board code) or null = all. Drives the chips.
  const [mealFilter, setMealFilter] = useState(null);

  useEffect(() => {
    if (waOnly || !checkIn || !checkOut || validateBookingDates(checkIn, checkOut)) {
      setQuote(null);
      return;
    }
    let live = true;
    setQuoteLoading(true);
    const API = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${API}/api/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hotelSlug: hotel.slug, checkIn, checkOut, occupancy }),
    })
      .then((r) => r.json())
      .then((j) => { if (live) setQuote(j.data || null); })
      .catch(() => { if (live) setQuote(null); })
      .finally(() => { if (live) setQuoteLoading(false); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut, hotel.slug]);

  // Quote options grouped by room type.
  const roomGroups = quote ? groupOptionsByRoom(quote.options || []) : [];
  const findOption = (roomId, board) =>
    (quote?.options || []).find((o) => o.roomId === roomId && o.board === board) || null;

  // Distinct boards present across the quote, for the Meals filter chip.
  const availableBoards = (() => {
    const seen = new Map();
    for (const o of (quote?.options || [])) {
      if (!seen.has(o.board)) seen.set(o.board, o.boardLabel);
    }
    return Array.from(seen.entries()).map(([board, boardLabel]) => ({ board, boardLabel }));
  })();

  // Cart = list of picked rooms, each entry { roomId, board } = ONE physical
  // room. Model A: the guest picks up to roomsQty rooms, mixing types freely
  // (and may pick the same type more than once). Rules:
  //  (1) clicking a rate that's the ONLY copy currently picked -> toggle OFF
  //  (2) below the cap -> add this room (allows a second, different, or same type)
  //  (3) at the cap -> replace the OLDEST picked room with this one
  function cartRoomsUsed(list) {
    return list.length; // one entry = one room in Model A
  }
  // Total beds across picked rooms (for the strict capacity check).
  function cartCapacity(list) {
    return list.reduce((sum, c) => {
      const opt = findOption(c.roomId, c.board);
      return sum + (opt?.capacity || 1);
    }, 0);
  }

  function addToCart(roomId, board) {
    setCart((prev) => {
      // (1) toggle OFF only if this exact rate is the single selected copy
      const sameRate = prev.filter((c) => c.roomId === roomId && c.board === board);
      const isOnlyThisRate = prev.length === 1 && sameRate.length === 1;
      if (isOnlyThisRate) return [];

      const entry = { roomId, board };
      // (2) room available under the cap -> append
      if (prev.length < roomsQty) {
        return [...prev, entry];
      }
      // (3) at the cap -> replace the OLDEST selection with this one
      return [...prev.slice(1), entry];
    });
  }
  function removeFromCart(i) {
    setCart((prev) => prev.filter((_, idx) => idx !== i));
  }

  // ---- Date validation for the inline booking widget ----------------------
  // The widget uses native <input type="date"> elements. Native inputs honor
  // a `min` attribute but won't enforce client-side validation past that —
  // a determined user could still paste a past date. So we also re-validate
  // inside reserve() before navigating. If the URL was carried over from a
  // stale search ("yesterday's dates") this also catches that on render.
  const today = todayInAlgiers();
  const dateError = checkIn && checkOut
    ? validateBookingDates(checkIn, checkOut)
    : null;

  // ---- Sticky scroll-spy tabs (item #4) ------------------------------------
  // The four sections (about, rooms, amenities, policies) are anchored by ID
  // so the tab bar can scroll-link to them. An IntersectionObserver watches
  // which section currently sits in the upper viewport and highlights that
  // tab. On click, we set the active tab AND smooth-scroll — the IO will
  // confirm the selection once the scroll lands.
  //
  // We use a one-shot `lockSpyUntil` timestamp to ignore IO updates for
  // ~600ms after a click. Without this, the intermediate sections passing
  // through the viewport during the scroll cause the underline to flicker.
  const TABS = [
    { id: "about",     labelKey: "detail.tab_overview"  },
    { id: "location",  labelKey: "detail.tab_location"  },
    { id: "rooms",     labelKey: "detail.tab_rooms"     },
    { id: "amenities", labelKey: "detail.tab_amenities" },
    { id: "policies",  labelKey: "detail.tab_policies"  },
  ];
  // Fallback labels so a missing translation key never renders as the raw
  // "detail.tab_xxx" string (e.g. before the i18n files get the new keys).
  const TAB_FALLBACKS = {
    "detail.tab_overview": "Overview",
    "detail.tab_location": "Location",
    "detail.tab_rooms": "Rooms",
    "detail.tab_amenities": "Amenities",
    "detail.tab_policies": "Policies",
  };
  // The translator humanises a missing key ("Tab location") instead of echoing
  // it, so the old fallback never fired. Tab labels come from TX now.
  const labelFor = (_tt, tab) => L(tab.id === "about" ? "overview" : tab.id) || TAB_FALLBACKS[tab.labelKey] || tab.id;
  const [activeTab, setActiveTab] = useState("about");
  const lockSpyUntil = useRef(0);

  useEffect(() => {
    // Only the four section IDs we care about. Margin on top pushes the
    // detection line just below the sticky tab bar so the tab flips as a
    // section's heading crosses under the tabs, not as it leaves the screen.
    const sectionIds = TABS.map((t) => t.id);
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < lockSpyUntil.current) return;
        // Pick the topmost section currently intersecting.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) {
          setActiveTab(visible[0].target.id);
        }
      },
      {
        // Detection line: 140px from the top of the viewport, accounting for
        // the nav (~90px) plus the sticky tab bar (~52px). Bottom margin is
        // negative so a section only "counts" while its top is visible.
        rootMargin: "-140px 0px -60% 0px",
        threshold: 0,
      }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function jumpToTab(id) {
    setActiveTab(id);
    lockSpyUntil.current = Date.now() + 600; // suppress flicker during scroll
    const el = document.getElementById(id);
    if (!el) return;
    // Manual scroll so we control the offset (account for nav + tab bar)
    const top = el.getBoundingClientRect().top + window.scrollY - 132;
    window.scrollTo({ top, behavior: "smooth" });
  }

  // nights — default to 1 for preview if dates not set
  let nights = 1;
  if (checkIn && checkOut) {
    const d = Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000);
    if (d > 0) nights = d;
  }
  // Resolved quote option for each cart entry (roomId + board -> full option).
  const cartOptions = cart.map((c) => findOption(c.roomId, c.board)).filter(Boolean);

  // Cheapest quote option across all rooms (for an empty-cart "from" preview).
  const cheapestOption = quote && Array.isArray(quote.options) && quote.options.length > 0
    ? quote.options.reduce((min, o) => (o.total < min.total ? o : min), quote.options[0])
    : null;

  // Widget total:
  //  - quote + items in cart -> sum the cart's per-stay totals
  //  - quote + empty cart -> show the cheapest rate as a "from" preview (NOT 0)
  //  - no quote -> static room preview
  const cartHasItems = cartOptions.length > 0;
  const subtotal = quote
    ? (cartHasItems
        ? cartOptions.reduce((sum, o) => sum + o.total, 0)
        : (cheapestOption ? cheapestOption.total : 0))
    : (selectedRoom ? selectedRoom.price * nights * roomsQty : 0);

  function reserve() {
    // Block on invalid/missing dates (CTA is also disabled in these states).
    if (!checkIn || !checkOut) return;
    if (dateError) return;

    const params = new URLSearchParams({ hotel: hotel.slug, nights: String(nights) });
    params.set("checkIn", checkIn);
    params.set("checkOut", checkOut);

    if (quote && cartOptions.length > 0) {
      // Multi-room path: ?sel=roomId:BOARD:pricePerNight:qty per cart entry.
      // qty = how many of that room type (bundling to fit guests). Comma
      // between entries (board codes contain underscores).
      const sel = cartOptions
        .map((o) => `${o.roomId}:${o.board}:${o.pricePerNightPerRoom}:${o.roomsCount || 1}`)
        .join(",");
      params.set("sel", sel);
    } else if (selectedRoom) {
      // Legacy fallback (no quote / static list): single room.
      params.set("room", selectedRoom.id);
      const roomsParam = searchParams.get("rooms");
      if (roomsParam) params.set("rooms", roomsParam);
    } else {
      return;
    }

    // Forward occupancy for display/consistency.
    const adultsParam = searchParams.get("adults");
    const childrenParam = searchParams.get("children");
    const occParam = searchParams.get("occ");
    if (adultsParam) params.set("adults", adultsParam);
    if (childrenParam) params.set("children", childrenParam);
    if (occParam) params.set("occ", occParam);

    router.push(`/booking?${params.toString()}`);
  }

  // Total guests from occupancy, for the header subline + capacity check.
  const totalGuests = occupancy.reduce((s, o) => s + (o.adults || 0) + (o.children || 0), 0);
  // Strict capacity: the picked rooms must seat all guests.
  const pickedCapacity = cartCapacity(cart);
  const capacityShort = quote && cart.length > 0 && pickedCapacity < totalGuests;

  const canReserve = !!checkIn && !!checkOut && !dateError &&
    ((quote && cartOptions.length > 0 && !capacityShort) || (!quote && !!selectedRoom));

  const photos = hotel.photos || [];

  function waHref(roomName) {
    const fmtD = (d) => (d ? d.split("-").reverse().join("/") : "…");
    const msg = L("wa_msg")(hotel.name, hotel.city, fmtD(checkIn), fmtD(checkOut), totalGuests, roomName || "");
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  }

  return (
    <div className="nz-detail">
      {/* breadcrumb */}
      <div className="wrap nz-bc">
        <Link href="/">{t("detail.home")}</Link><span>/</span>
        <Link href="/hotels">{t("nav.hotels")}</Link><span>/</span>
        <Link href={`/hotels?city=${hotel.city}`}>{hotel.city}</Link><span>/</span>
        <span className="cur">{hotel.name}</span>
      </div>

      {/* gallery — skipped entirely when the hotel has no photo yet, instead
          of a 480px grey block */}
      {photos.length > 0 && (
      <div className="wrap">
        <div className={`nz-gallery n${Math.min(photos.length, 5)}`}>
          {photos.slice(0, 5).map((p, i) => (
            <button
              className={`nz-gal-item ${i === 4 && photos.length > 5 ? "more" : ""}`}
              key={p.id || i}
              onClick={() => setLightboxIndex(i)}
              aria-label="View photo"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={hotel.name} loading={i === 0 ? "eager" : "lazy"} />
              {i === 4 && photos.length > 5 && (
                <div className="nz-gal-overlay">
                  <Icon name="view" size={18} style={{ color: "#fff" }} />
                  +{photos.length - 5} photos
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* layout */}
      <div className="wrap nz-detail-layout">
        <div className="nz-detail-main">
          {/* header */}
          <div className="nz-hotel-head">
            <div className="nz-hotel-badges">
              <span className="nz-badge stars">{hotel.stars > 0 ? "★".repeat(hotel.stars) : "N/C"}</span>
              {waOnly && (
                <span className="nz-badge wa"><Icon name="whatsapp" size={13} strokeWidth={0} /> {L("wa_head")}</span>
              )}
              {hotel.trustSignals?.verifiedPartner && (
                <span className="nz-badge verified">
                  <Icon name="check" size={13} strokeWidth={2.2} /> {t("detail.verified")}
                </span>
              )}
              {hotel.trustSignals?.instantConfirmation && (
                <span className="nz-badge instant"><span className="live" /> {t("detail.instant")}</span>
              )}
            </div>
            <h1 className="display">{hotel.name}</h1>
            <div className="nz-hotel-sub">
              <span className="loc"><Icon name="pin" size={16} /> {hotel.city} · {hotel.region}</span>
              {hotel.reviewCount > 0 && (
                <span className="rate">
                  <span className="pill">{hotel.rating}</span>
                  <span className="rtext"><strong>{t(ratingKey(hotel.rating))}</strong> · {hotel.reviewCount} {t("detail.reviews")}</span>
                </span>
              )}
            </div>
          </div>

          {/* Sticky scroll-spy tabs — click to jump, underline tracks scroll */}
          <nav className="nz-dtabs">
            {TABS.filter((tab) =>
              (tab.id !== "location" || hotel.location) &&
              (tab.id !== "amenities" || (hotel.amenities || []).length > 0)
            ).map((tab) => (
              <button
                key={tab.id}
                className={`nz-dtab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => jumpToTab(tab.id)}
                aria-current={activeTab === tab.id ? "true" : undefined}
              >
                {labelFor(t, tab)}
              </button>
            ))}
          </nav>

          {/* about */}
          <section id="about" className="nz-dsection">
            <h2 className="display">{t("detail.about")}</h2>
            <p className="nz-about">{hotel.description}</p>
          </section>

          {/* location — renders nothing if the hotel has no coordinates yet */}
          {hotel.location && (
            <section id="location" className="nz-dsection">
              <h2 className="display">{t("detail.location") || "Location"}</h2>
              <HotelMap hotel={hotel} t={t} />
            </section>
          )}

          {/* rooms */}
          <section id="rooms" className="nz-dsection">
            <h2 className="display">{t("detail.choose_room")}</h2>

            {quoteLoading && (
              <div className="nz-quote-loading">{L("loading")}</div>
            )}

            {!quoteLoading && quote && roomGroups.length > 0 ? (
              <div className="nz-opts">
                {/* header: subline + meal filter chips */}
                <div className="nz-opts-head">
                  <div className="nz-opts-sub">
                    {nights} {nights === 1 ? L("night") : L("nights")} · {totalGuests} {totalGuests === 1 ? L("guest") : L("guests")}
                  </div>
                  {availableBoards.length > 1 && (
                    <div className="nz-opts-chips">
                      <button
                        className={`nz-chip ${mealFilter === null ? "on" : ""}`}
                        onClick={() => setMealFilter(null)}
                      >
                        {L("all_meals")}
                      </button>
                      {availableBoards.map((b) => (
                        <button
                          key={b.board}
                          className={`nz-chip ${mealFilter === b.board ? "on" : ""}`}
                          onClick={() => setMealFilter(mealFilter === b.board ? null : b.board)}
                        >
                          {localized(b.boardLabel, lang)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* one block per room type; rates scroll horizontally */}
                {roomGroups.map((grp) => {
                  const staticRoom = rooms.find((r) => r.id === grp.roomId);
                  const boards = grp.boards
                    .filter((o) => !mealFilter || o.board === mealFilter)
                    .slice()
                    .sort((a, b) => a.total - b.total);
                  if (boards.length === 0) return null;
                  const onReq = grp.availability !== "AVAILABLE";
                  const nRooms = boards[0]?.roomsCount || 1;
                  const roomCap = boards[0]?.capacity || staticRoom?.capacity || 1;
                  // When only 1 room is searched, a room that can't seat all
                  // guests is too small to book on its own — flag it so the user
                  // picks a bigger one instead of getting stuck at checkout.
                  const tooSmall = roomsQty === 1 && roomCap < totalGuests;
                  const roomTitle = nRooms > 1
                    ? `${nRooms} × ${localized(grp.roomType, lang)}`
                    : localized(grp.roomType, lang);
                  return (
                    <div className={`nz-rblock ${tooSmall ? "toosmall" : ""}`} key={grp.roomId}>
                      {/* room card — pinned left */}
                      <div className="nz-rcard">
                        <div className="nz-rcard-photo">
                          {staticRoom?.photos?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={staticRoom.photos[0]} alt={localized(grp.roomType, lang)} loading="lazy" />
                          ) : <Icon name="bed" size={24} />}
                        </div>
                        <div className="nz-rcard-name display">{roomTitle}</div>
                        {staticRoom?.bedType && <div className="nz-rcard-bed">{staticRoom.bedType}</div>}
                        <div className="nz-rcard-specs">
                          <span><Icon name="guest" size={14} /> {staticRoom?.capacity} {staticRoom?.capacity === 1 ? L("guest") : L("guests")}</span>
                          {staticRoom?.sizeSqm && <span><Icon name="size" size={14} /> {staticRoom.sizeSqm} m²</span>}
                        </div>
                        {tooSmall && (
                          <div className="nz-rcard-toosmall">{L("too_small")(roomCap, totalGuests)}</div>
                        )}
                      </div>

                      {/* rate cards — scroll right */}
                      <div className="nz-rates">
                        {boards.map((opt, i) => {
                          const isSelected = cart.some((c) => c.roomId === grp.roomId && c.board === opt.board);
                          return (
                            <div className={`nz-rate ${isSelected ? "selected" : ""}`} key={opt.board}>
                              <div className="nz-rate-tag">
                                {onReq && <span className="nz-rate-req">{L("on_request")}</span>}
                              </div>
                              <div className="nz-rate-board">{localized(opt.boardLabel, lang)}</div>
                              <div className="nz-rate-lines">
                                {staticRoom?.bedType && <div><Icon name="bed" size={14} /> {staticRoom.bedType}</div>}
                                <div><Icon name="check" size={13} strokeWidth={2.5} /> {t("detail.free_cancel")}</div>
                                {/* Never on a room-only rate: "Chambre seule" next to
                                    "Breakfast included" is a contradiction a guest
                                    can hold us to. */}
                                {opt.breakfastIncluded && opt.board !== "ROOM_ONLY" && opt.board !== "BREAKFAST" && (
                                  <div><Icon name="check" size={13} strokeWidth={2.5} /> {L("breakfast")}</div>
                                )}
                              </div>
                              <div className="nz-rate-foot">
                                <div className="nz-rate-price">
                                  <span className="amt display">{formatPrice(opt.total)}</span>
                                  <span className="per">
                                    {opt.roomsCount > 1 ? `${opt.roomsCount} ${L("rooms_n")} · ` : ""}
                                    {nights} {nights === 1 ? L("night") : L("nights")} · {L("total_stay")}
                                  </span>
                                </div>
                                <button className={`nz-rate-btn ${isSelected ? "on" : ""}`} onClick={() => addToCart(grp.roomId, opt.board)}>
                                  {isSelected ? L("selected") : L("select")}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* cart */}
                <div className="nz-cart">
                  <div className="nz-cart-main">
                    <div className="nz-cart-title">
                      {L("cart")(cartRoomsUsed(cart), roomsQty)}
                    </div>
                    {capacityShort && (
                      <div className="nz-cart-cap">
                        {roomsQty === 1 ? L("cap_one")(pickedCapacity, totalGuests) : L("cap_many")(pickedCapacity, totalGuests)}
                      </div>
                    )}
                    {cartOptions.length === 0 ? (
                      <div className="nz-cart-empty">{L("cart_empty")}</div>
                    ) : (
                      cartOptions.map((o, i) => (
                        <div className="nz-cart-row" key={i}>
                          <div className="nz-cart-info">
                            <strong>{localized(o.roomType, lang)}</strong>
                            <span>{localized(o.boardLabel, lang)}{o.availability !== "AVAILABLE" ? ` · ${L("on_request")}` : ""}</span>
                          </div>
                          <div className="nz-cart-rprice">
                            {formatPrice(o.total)}
                            <button className="nz-cart-x" onClick={() => removeFromCart(i)} aria-label="Remove">×</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="nz-cart-foot">
                    {cartOptions.length > 0 && (
                      <div className="nz-cart-total">
                        <span className="lbl">{L("total_stay")}</span>
                        <span className="amt display">{formatPrice(subtotal)}</span>
                      </div>
                    )}
                    <button className="nz-cart-cta" onClick={reserve} disabled={!canReserve}>
                      {L("book_now")}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              !quoteLoading && (
                <>
                  <div className="nz-rooms">
                    {rooms.map((r) => {
                      const selected = selectedRoom?.id === r.id;
                      return (
                        <div className={`nz-room ${selected ? "selected" : ""}`} key={r.id}>
                          <div className="nz-room-photo">
                            {r.photos?.[0]
                              /* eslint-disable-next-line @next/next/no-img-element */
                              ? <img src={r.photos[0]} alt={r.type} loading="lazy" />
                              : <Icon name="bed" size={26} style={{ color: "var(--gray-300)" }} />}
                          </div>
                          <div className="nz-room-info">
                            <h3 className="display">{r.type}</h3>
                            <div className="nz-room-specs">
                              <span><Icon name="guest" size={15} /> {r.capacity} {t("detail.guests")}</span>
                              {r.sizeSqm && <span><Icon name="size" size={15} /> {r.sizeSqm} m²</span>}
                              <span><Icon name="bed" size={15} /> {r.bedType}</span>
                            </div>
                            {!waOnly && (
                              <div className="nz-room-perks">
                                <span><Icon name="check" size={13} strokeWidth={2.5} /> {t("detail.free_cancel")}</span>
                              </div>
                            )}
                          </div>
                          {waOnly ? (
                            <div className="nz-room-action">
                              <a className="nz-room-wa" href={waHref(r.type)} target="_blank" rel="noopener noreferrer">
                                <Icon name="whatsapp" size={15} strokeWidth={0} /> {L("wa_room")}
                              </a>
                            </div>
                          ) : (
                          <div className="nz-room-action">
                            <div className="nz-room-price">
                              <span className="amt display">{formatPriceShort(r.price)}</span>
                              <span className="unit">{t("detail.per_night")}</span>
                            </div>
                            <button
                              className={`nz-room-btn ${selected ? "sel" : ""}`}
                              onClick={() => setSelectedRoom(r)}
                            >
                              {selected ? L("selected") : L("select")}
                            </button>
                          </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {waOnly && rooms.length > 0 && <p className="nz-rooms-hint">{L("wa_rooms_note")}</p>}
                  {waOnly && rooms.length === 0 && (
                    <a className="nz-wa-inline" href={waHref("")} target="_blank" rel="noopener noreferrer">
                      <Icon name="whatsapp" size={18} strokeWidth={0} /> {L("wa_cta")}
                    </a>
                  )}
                  {!waOnly && (!checkIn || !checkOut) && (
                    <p className="nz-rooms-hint">{L("pick_dates")}</p>
                  )}
                </>
              )
            )}
          </section>

          {/* amenities — hidden when the hotel lists none */}
          {(hotel.amenities || []).length > 0 && (
          <section id="amenities" className="nz-dsection">
            <h2 className="display">{t("detail.offers")}</h2>
            <div className="nz-amenities">
              {(hotel.amenities || []).map((a) => (
                <div className="nz-amenity" key={a.key}>
                  <Icon name={AMENITY_ICON[a.key] || "check"} size={19} style={{ color: "var(--red)" }} />
                  {a.name}
                </div>
              ))}
            </div>
          </section>
          )}

          {/* policies */}
          <section id="policies" className="nz-dsection">
            <h2 className="display">{t("detail.policies")}</h2>
            <div className="nz-policies">
              <Policy icon="clock" label={t("detail.checkin")} value={`${t("detail.from")} ${hotel.checkInTime}`} />
              <Policy icon="clock" label={t("detail.checkout")} value={`${t("detail.until")} ${hotel.checkOutTime}`} />
              {!waOnly && (
                <Policy icon="check" label={t("detail.cancellation")}
                  value={`${t("detail.cancel_free")} ${hotel.policies?.cancellationHours || 48}h ${t("detail.before_arrival")}`} good />
              )}
              <Policy icon="child" label={t("detail.children")}
                value={hotel.policies?.childrenAllowed ? t("detail.children_ok") : t("detail.children_no")} />
              <Policy icon="pet" label={t("detail.pets")}
                value={hotel.policies?.petsAllowed ? t("detail.pets_ok") : t("detail.pets_no")} />
              <Policy icon="parking" label={t("detail.parking")}
                value={hotel.policies?.parkingFree ? t("detail.parking_free") : t("detail.parking_paid")}
                good={hotel.policies?.parkingFree} />
            </div>
          </section>
        </div>

        {/* sticky booking widget */}
        <aside>
          {waOnly ? (
          <div className="nz-widget wa">
            <div className="nz-widget-head wa">
              <Icon name="whatsapp" size={15} strokeWidth={0} /> {L("wa_head")}
            </div>
            <div className="nz-widget-body">
              <p className="nz-wa-body">{L("wa_body")}</p>
              <div className="nz-widget-dates">
                <div className="wf">
                  <label>{L("check_in")}</label>
                  <input type="date" value={checkIn} min={today}
                    onChange={(e) => { const v = e.target.value; setCheckIn(v); if (checkOut && v && v >= checkOut) setCheckOut(""); }} />
                </div>
                <div className="wf">
                  <label>{L("check_out")}</label>
                  <input type="date" value={checkOut} min={checkIn || today} onChange={(e) => setCheckOut(e.target.value)} />
                </div>
              </div>
              <ol className="nz-wa-steps">
                {L("wa_steps").map((s, i) => <li key={i}><span>{i + 1}</span>{s}</li>)}
              </ol>
              <a className="nz-wa-cta" href={waHref("")} target="_blank" rel="noopener noreferrer">
                <Icon name="whatsapp" size={19} strokeWidth={0} /> {L("wa_cta")}
              </a>
            </div>
            <div className="nz-widget-foot">
              <Icon name="shield" size={24} style={{ color: "var(--gray-300)" }} />
              {t("detail.secured")}
            </div>
          </div>
          ) : (
          <div className="nz-widget">
            <div className="nz-widget-head">
              <span className="live" /> {t("detail.widget_head")}
            </div>
            <div className="nz-widget-body">
              <div className="nz-widget-price">
                <span className="amt display">{
                  quote
                    ? (cheapestOption ? formatPriceShort(cheapestOption.pricePerNightPerRoom) : "—")
                    : (selectedRoom ? formatPriceShort(selectedRoom.price) : "—")
                }</span>
                <span className="unit">{t("detail.per_night")}</span>
              </div>

              <div className="nz-widget-dates">
                <div className="wf">
                  <label>{L("check_in")}</label>
                  <input
                    type="date"
                    value={checkIn}
                    min={today}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCheckIn(v);
                      // If the new check-in pushes past check-out, clear
                      // check-out so the user doesn't end up with an
                      // invalid reversed range carried over silently.
                      if (checkOut && v && v >= checkOut) setCheckOut("");
                    }}
                  />
                </div>
                <div className="wf">
                  <label>{L("check_out")}</label>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn || today}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </div>
              </div>

              {/* Inline date error. Shows when the URL had stale dates or
                  the user managed to enter an invalid range despite the
                  min attributes (paste, devtools, etc). The Reserve button
                  is disabled in this state so the user can't proceed. */}
              {dateError && (
                <div className="nz-widget-date-err" role="alert">
                  <Icon name="shield" size={15} style={{ color: "var(--red)" }} />
                  <span>{localizeDateError(dateError, t)}</span>
                </div>
              )}

              {quote ? (
                <div className="nz-widget-room">
                  <div className="wr-label">
                    {cartHasItems
                      ? L("your_selection")
                      : L("from")}
                  </div>
                  {cartHasItems ? (
                    cartOptions.map((o, i) => (
                      <div className="wr-calc" key={i}>
                        <span>
                          {o.roomsCount > 1 ? `${o.roomsCount} × ` : ""}{localized(o.roomType, lang)} · {localized(o.boardLabel, lang)}
                        </span>
                        <span>{formatPrice(o.total)}</span>
                      </div>
                    ))
                  ) : (
                    cheapestOption && (
                      <>
                        <div className="wr-name display">{localized(cheapestOption.roomType, lang)}</div>
                        <div className="wr-calc">
                          <span>{localized(cheapestOption.boardLabel, lang)} · {nights} {nights === 1 ? L("night") : L("nights")}</span>
                          <span>{formatPrice(cheapestOption.total)}</span>
                        </div>
                      </>
                    )
                  )}
                </div>
              ) : selectedRoom && (
                <div className="nz-widget-room">
                  <div className="wr-label">{t("detail.selected_room")}</div>
                  <div className="wr-name display">{selectedRoom.type}</div>
                  <div className="wr-calc">
                    <span>
                      {roomsQty > 1 ? `${roomsQty} × ` : ""}{formatPrice(selectedRoom.price)} × {nights} {nights === 1 ? L("night") : L("nights")}
                    </span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                </div>
              )}

              <div className="nz-widget-breakdown">
                <div className="bd-row"><span>{t("detail.taxes")}</span><span>{t("detail.included")}</span></div>
                <div className="bd-row total">
                  <span>{t("detail.total")}</span>
                  <span className="display">{formatPrice(subtotal)}</span>
                </div>
              </div>

              <button
                className="nz-widget-cta"
                onClick={reserve}
                disabled={!canReserve}
              >
                {t("detail.reserve")}
              </button>
              <div className="nz-widget-reassure">
                <Icon name="check" size={14} strokeWidth={2.5} />
                {t("detail.reassure")}
              </div>

              <a
                className="nz-widget-wa"
                href={waHref("")}
                target="_blank" rel="noopener noreferrer"
              >
                <span className="ww-ic"><Icon name="whatsapp" size={20} style={{ color: "#fff" }} strokeWidth={0} /></span>
                <span className="ww-tx">
                  <strong>{t("detail.wa_title")}</strong>
                  <span>{t("detail.wa_sub")}</span>
                </span>
              </a>
            </div>
            <div className="nz-widget-foot">
              <Icon name="shield" size={24} style={{ color: "var(--gray-300)" }} />
              {t("detail.secured")}
            </div>
          </div>
          )}
        </aside>
      </div>

      {/* sticky mobile reserve bar */}
      {waOnly ? (
        <div className="nz-mobile-reserve">
          <a className="nz-mr-btn wa" href={waHref("")} target="_blank" rel="noopener noreferrer">
            <Icon name="whatsapp" size={17} strokeWidth={0} /> {L("wa_cta")}
          </a>
        </div>
      ) : (
      <div className="nz-mobile-reserve">
        <div className="nz-mr-price">
          <span className="amt display">{
            quote
              ? (cheapestOption ? formatPriceShort(cheapestOption.pricePerNightPerRoom) : "—")
              : (selectedRoom ? formatPriceShort(selectedRoom.price) : "—")
          }</span>
          <span className="unit">{t("detail.per_night")}</span>
        </div>
        <button className="nz-mr-btn" onClick={reserve}>{t("detail.reserve")}</button>
      </div>
      )}

      <DetailStyles />
    </div>
  );
}

function Policy({ icon, label, value, good }) {
  return (
    <div className="nz-policy-row">
      <span className="pl"><Icon name={icon} size={17} style={{ color: "var(--gray-400)" }} /> {label}</span>
      <span className={`pv ${good ? "good" : ""}`}>{value}</span>
    </div>
  );
}

function DetailStyles() {
  return (
    <style>{`
      .nz-detail { padding-bottom: 20px; }
      .nz-bc {
        display: flex; align-items: center; gap: 8px; padding-top: 20px;
        font-size: 13px; color: var(--gray-400); font-weight: 600;
      }
      .nz-bc :global(a) { color: var(--gray-400); transition: color .2s; }
      .nz-bc :global(a:hover) { color: var(--red); }
      .nz-bc span { opacity: 0.5; }
      .nz-bc .cur { color: var(--ink); opacity: 1; }

      .nz-gallery {
        display: grid; grid-template-columns: 2fr 1fr 1fr; grid-template-rows: 1fr 1fr;
        gap: 8px; height: 480px; border-radius: var(--r-lg); overflow: hidden; margin-top: 20px;
      }
      .nz-gal-item { position: relative; overflow: hidden; background: var(--gray-100); border: none; padding: 0; cursor: pointer; }
      .nz-gal-item:nth-child(1) { grid-row: span 2; }
      .nz-gal-item img { width: 100%; height: 100%; object-fit: cover; transition: transform .8s cubic-bezier(0.16,1,0.3,1); }
      .nz-gal-item:hover img { transform: scale(1.06); }
      .nz-gal-overlay {
        position: absolute; inset: 0; background: rgba(22,22,26,0.6);
        display: flex; align-items: center; justify-content: center; gap: 8px;
        color: #fff; font-weight: 700; font-size: 15px;
      }

      .nz-detail-layout {
        display: grid; grid-template-columns: 1fr 380px; gap: 48px;
        align-items: start; padding-top: 36px; padding-bottom: 60px;
      }
      /* The aside must STRETCH to the full grid track height so the widget
         has room to "scroll within" — that's what makes position:sticky
         actually stick. Without align-self:stretch the aside is exactly
         the widget's height and sticky becomes a no-op. We use align-self
         on the aside specifically rather than removing align-items:start
         from the parent because the start alignment is correct for the
         main column (we want it to size to its content, not stretch).

         z-index keeps the widget above the sticky scroll-spy tabs that
         sit at top:80px in the main column. */
      .nz-detail-layout > aside {
        align-self: stretch;
        position: relative;
        z-index: 2;
      }
      /* Both grid children must be allowed to shrink below their min-content,
         or an over-wide child (e.g. the booking widget on mobile) widens the
         whole single-column track past the viewport and clips siblings. */
      .nz-detail-layout > * { min-width: 0; }
      .nz-hotel-head { margin-bottom: 32px; }
      .nz-hotel-badges { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
      .nz-badge {
        display: inline-flex; align-items: center; gap: 7px;
        padding: 7px 13px; border-radius: 980px; font-size: 12px; font-weight: 700;
      }
      .nz-badge.verified { background: var(--teal-soft); color: var(--teal); }
      .nz-badge.instant { background: var(--red-soft); color: var(--red-deep); }
      .nz-badge.instant .live { width: 6px; height: 6px; border-radius: 50%; background: var(--red); animation: blink 1.6s infinite; }
      .nz-badge.stars { background: var(--ink); color: #fff; }
      .nz-badge.wa { background: #E7F4EC; color: #1B8A5A; }
      /* Galleries with fewer than five photos: no empty grey cells. */
      .nz-gallery.n1 { grid-template-columns: 1fr; grid-template-rows: 1fr; }
      .nz-gallery.n2 { grid-template-columns: 2fr 1fr; grid-template-rows: 1fr; }
      .nz-gallery.n2 .nz-gal-item:nth-child(1), .nz-gallery.n1 .nz-gal-item:nth-child(1) { grid-row: auto; }
      .nz-gallery.n3 { grid-template-columns: 2fr 1fr; }
      .nz-gallery.n4 { grid-template-columns: 2fr 1fr 1fr; }
      .nz-gallery.n4 .nz-gal-item:nth-child(4) { grid-column: span 2; }

      .nz-room-photo { display: flex; align-items: center; justify-content: center; background: var(--cream, #FAF8F4); }
      .nz-room-wa, .nz-wa-inline {
        display: inline-flex; align-items: center; gap: 8px; white-space: nowrap;
        background: #25D366; color: #fff; padding: 11px 20px; border-radius: 980px;
        font-size: 13px; font-weight: 700; transition: background .2s;
      }
      .nz-room-wa:hover, .nz-wa-inline:hover { background: #1DA851; }
      .nz-widget-head.wa { background: #E7F4EC; color: #1B8A5A; }
      .nz-wa-body { font-size: 14px; line-height: 1.6; color: var(--ink-2); margin: 0 0 18px; }
      .nz-wa-steps { list-style: none; padding: 0; margin: 4px 0 18px; display: flex; flex-direction: column; gap: 10px; }
      .nz-wa-steps li { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; color: var(--ink-2); }
      .nz-wa-steps li span {
        width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        background: var(--cream, #FAF8F4); border: 1px solid var(--gray-200); font-size: 11px; font-weight: 800; color: #1B8A5A;
      }
      .nz-wa-cta {
        display: flex; align-items: center; justify-content: center; gap: 9px; width: 100%; padding: 15px;
        background: #25D366; color: #fff; border-radius: var(--r-md);
        font-family: 'Clash Display', sans-serif; font-size: 16px; font-weight: 600; transition: background .2s;
      }
      .nz-wa-cta:hover { background: #1DA851; }
      .nz-hotel-head h1 { font-size: clamp(32px, 4vw, 46px); font-weight: 600; letter-spacing: -0.03em; line-height: 1.05; margin-bottom: 12px; }
      .nz-hotel-sub { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
      .nz-hotel-sub .loc { display: flex; align-items: center; gap: 7px; font-size: 14px; color: var(--gray-400); font-weight: 600; }
      .nz-hotel-sub .rate { display: flex; align-items: center; gap: 9px; }
      .nz-hotel-sub .pill { background: var(--ink); color: #fff; font-family: 'Clash Display', sans-serif; font-weight: 600; font-size: 15px; padding: 5px 10px; border-radius: 9px; }
      .nz-hotel-sub .rtext { font-size: 13px; color: var(--gray-400); font-weight: 600; }
      .nz-hotel-sub .rtext strong { color: var(--ink); }

      /* ---- Sticky scroll-spy tabs ---- */
      /* Sits below the global nav (which is ~90px tall when sticky) and
         tracks the four sections as the user scrolls. The underline slides
         left/right based on which section the IntersectionObserver picks. */
      .nz-dtabs {
        position: sticky;
        top: 80px;
        z-index: 5;
        display: flex;
        gap: 4px;
        margin: 0 -16px 28px;
        padding: 0 16px;
        background: var(--white);
        border-bottom: 1px solid var(--gray-200);
        /* Slight backdrop blur so content scrolling underneath doesn't
           bleed through (e.g. if the user has a complex theme). */
        backdrop-filter: saturate(180%) blur(8px);
        -webkit-backdrop-filter: saturate(180%) blur(8px);
      }
      .nz-dtab {
        position: relative;
        padding: 16px 18px;
        background: transparent;
        border: none;
        cursor: pointer;
        font-family: inherit;
        font-size: 14.5px;
        font-weight: 600;
        color: var(--gray-400);
        transition: color 0.15s ease;
      }
      .nz-dtab::after {
        content: "";
        position: absolute;
        left: 18px; right: 18px; bottom: -1px;
        height: 2px;
        background: var(--red);
        border-radius: 1px;
        transform: scaleX(0);
        transform-origin: center;
        transition: transform 0.22s ease;
      }
      .nz-dtab:hover { color: var(--ink); }
      .nz-dtab.active {
        color: var(--ink);
      }
      .nz-dtab.active::after {
        transform: scaleX(1);
      }

      .nz-dsection { margin-bottom: 44px; }
      .nz-dsection h2 { font-size: 24px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 18px; }
      .nz-about { font-size: 15.5px; line-height: 1.75; color: var(--ink-2); }

      .nz-rooms { display: flex; flex-direction: column; gap: 16px; }
      .nz-rooms-hint { font-size: 13.5px; color: var(--gray-400); margin-top: 12px; }
      .nz-quote-loading { font-size: 14px; color: var(--gray-400); padding: 20px 0; }
      .nz-opts {
        display: flex; flex-direction: column;
        border: 1px solid var(--gray-200); border-radius: var(--r-lg, 14px);
        background: var(--white); overflow: hidden;
      }
      .nz-opts-head {
        display: flex; flex-direction: column; gap: 12px;
        padding: 18px 20px; border-bottom: 1px solid var(--gray-100);
      }
      .nz-opts-sub { font-size: 13.5px; color: var(--gray-500); font-weight: 600; }
      .nz-opts-chips { display: flex; flex-wrap: wrap; gap: 8px; }
      .nz-chip {
        font-size: 12.5px; font-weight: 600; color: var(--gray-600, #5F5E5A);
        border: 1px solid var(--gray-200); background: var(--white);
        padding: 6px 14px; border-radius: 980px; cursor: pointer; transition: all .15s;
      }
      .nz-chip:hover { border-color: var(--gray-300); }
      .nz-chip.on { background: var(--ink); color: var(--white); border-color: var(--ink); }
      .nz-avail { font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 980px; white-space: nowrap; }
      .nz-avail.ok { background: rgba(27,138,90,0.12); color: #1B8A5A; }
      .nz-avail.req { background: rgba(230,57,70,0.10); color: var(--red-deep, #A32D2D); }

      .nz-rblock { display: flex; gap: 18px; align-items: flex-start; padding: 20px; border-bottom: 1px solid var(--gray-100); }
      .nz-rcard {
        flex: 0 0 180px; width: 180px; align-self: stretch;
        display: flex; flex-direction: column; gap: 6px;
      }
      .nz-rcard-photo {
        width: 100%; height: 120px; border-radius: var(--r-md); overflow: hidden;
        background: var(--cream, #FAF8F4); display: flex; align-items: center; justify-content: center; color: var(--gray-300);
        margin-bottom: 4px;
      }
      .nz-rcard-photo img { width: 100%; height: 100%; object-fit: cover; }
      .nz-rcard-name { font-size: 16px; font-weight: 700; line-height: 1.25; color: var(--ink); }
      .nz-rcard-bed { font-size: 12.5px; color: var(--gray-500); }
      .nz-rcard-specs { display: flex; flex-direction: column; gap: 3px; margin-top: 4px; }
      .nz-rcard-specs span { font-size: 12px; color: var(--gray-400); display: flex; align-items: center; gap: 5px; }
      .nz-rcard-toosmall { font-size: 11.5px; font-weight: 700; color: var(--red-deep, #A32D2D); margin-top: 6px; line-height: 1.35; }
      .nz-rblock.toosmall { opacity: 0.62; }
      .nz-rblock.toosmall .nz-rate-btn { background: var(--gray-300, #c9c9c9); }

      .nz-rates {
        flex: 1; min-width: 0; display: flex; gap: 10px; overflow-x: auto;
        scroll-snap-type: x mandatory; padding: 2px 2px 10px; -webkit-overflow-scrolling: touch;
      }
      .nz-rate {
        flex: 0 0 200px; scroll-snap-align: start; display: flex; flex-direction: column;
        border: 1px solid var(--gray-200); border-radius: var(--r-md); padding: 12px 13px; background: var(--white);
      }
      .nz-rate.selected { border: 2px solid var(--red, #E63946); padding: 11px 12px; box-shadow: 0 0 0 3px rgba(230,57,70,0.12); }
      .nz-rate-tag { min-height: 18px; margin-bottom: 6px; }
      .nz-rate-req { font-size: 10.5px; font-weight: 700; color: var(--red-deep, #A32D2D); background: rgba(230,57,70,0.10); padding: 2px 8px; border-radius: 980px; }
      .nz-rate-board { font-size: 14.5px; font-weight: 700; color: var(--ink); margin-bottom: 8px; line-height: 1.3; }
      .nz-rate-lines { font-size: 12px; color: var(--gray-500); line-height: 1.8; flex: 1; }
      .nz-rate-lines > div { display: flex; align-items: center; gap: 5px; }
      .nz-rate-foot { margin-top: 12px; }
      .nz-rate-price .amt { font-size: 18px; font-weight: 600; color: var(--ink); display: block; }
      .nz-rate-price .per { font-size: 11px; color: var(--gray-400); }
      .nz-rate-btn {
        width: 100%; margin-top: 10px; font-size: 13px; font-weight: 700; padding: 8px;
        border: none; border-radius: var(--r-sm); background: var(--ink); color: var(--white); cursor: pointer; transition: opacity .15s;
      }
      .nz-rate-btn:hover { opacity: .88; }
      .nz-rate-btn.on { background: var(--red, #E63946); }

      .nz-rblock:last-of-type { border-bottom: none; }
      .nz-cart {
        padding: 18px 20px; background: var(--cream, #FAF8F4);
        display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px;
      }
      .nz-cart-main { flex: 1; min-width: 240px; }
      .nz-cart-title { font-size: 14px; font-weight: 700; color: var(--ink); margin-bottom: 8px; }
      .nz-cart-cap { font-size: 12.5px; font-weight: 600; color: var(--red-deep, #A32D2D); background: rgba(230,57,70,0.10); padding: 7px 11px; border-radius: var(--r-sm); margin-bottom: 8px; }
      .nz-cart-empty { font-size: 13px; color: var(--gray-400); padding: 6px 0; }
      .nz-cart-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--gray-100); }
      .nz-cart-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
      .nz-cart-info strong { font-size: 13.5px; font-weight: 700; color: var(--ink); }
      .nz-cart-info span { font-size: 12px; color: var(--gray-400); }
      .nz-cart-rprice { font-size: 13.5px; font-weight: 700; color: var(--ink); white-space: nowrap; display: flex; align-items: center; gap: 8px; }
      .nz-cart-x { border: none; background: none; cursor: pointer; color: var(--gray-300); padding: 0; font-size: 18px; line-height: 1; }
      .nz-cart-x:hover { color: var(--red, #E63946); }
      .nz-cart-foot { text-align: right; }
      .nz-cart-total { margin-bottom: 8px; }
      .nz-cart-total .lbl { font-size: 11px; color: var(--gray-400); display: block; }
      .nz-cart-total .amt { font-size: 22px; font-weight: 600; color: var(--ink); }
      .nz-cart-cta {
        font-size: 14px; font-weight: 700; padding: 11px 24px; border: none; border-radius: var(--r-sm);
        background: var(--red, #E63946); color: #fff; cursor: pointer; transition: opacity .15s;
      }
      .nz-cart-cta:hover { opacity: .9; }
      .nz-cart-cta:disabled { opacity: .4; cursor: default; }
      @media (max-width: 640px) {
        .nz-rblock { flex-direction: column; gap: 10px; }
        .nz-rcard { flex: none; width: 100%; flex-direction: row; gap: 12px; align-items: center; }
        .nz-rcard-photo { width: 90px; height: 70px; flex-shrink: 0; margin-bottom: 0; }
        .nz-rcard-specs { flex-direction: row; gap: 10px; }
        .nz-cart { flex-direction: column; align-items: stretch; } .nz-cart-foot { text-align: left; }
      }
      .nz-room {
        display: grid; grid-template-columns: 200px 1fr auto; gap: 22px; align-items: center;
        padding: 18px; border: 1.5px solid var(--gray-200); border-radius: var(--r-lg);
        transition: border-color .25s, box-shadow .25s, background .25s;
      }
      .nz-room:hover { border-color: var(--gray-300); box-shadow: var(--shadow-md); }
      .nz-room.selected { border-color: var(--red); background: var(--red-soft); }
      .nz-room-photo { height: 140px; border-radius: var(--r-md); overflow: hidden; }
      .nz-room-photo img { width: 100%; height: 100%; object-fit: cover; }
      .nz-room-info h3 { font-size: 19px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 8px; }
      .nz-room-specs { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; }
      .nz-room-specs span { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--gray-400); font-weight: 600; }
      .nz-room-perks { display: flex; gap: 14px; flex-wrap: wrap; }
      .nz-room-perks span { display: flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 700; color: var(--teal); }
      .nz-room-action { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
      .nz-room-price .amt { font-size: 24px; font-weight: 600; letter-spacing: -0.02em; }
      .nz-room-price .unit { font-size: 12px; color: var(--gray-400); font-weight: 600; }
      .nz-room-btn { background: var(--ink); color: #fff; border: none; padding: 11px 24px; border-radius: 980px; font-size: 13px; font-weight: 700; transition: background .2s; white-space: nowrap; }
      .nz-room-btn:hover { background: var(--red); }
      .nz-room-btn.sel { background: var(--red); }

      .nz-amenities { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
      .nz-amenity {
        display: flex; align-items: center; gap: 11px; padding: 14px 16px;
        background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--r-md);
        font-size: 13.5px; font-weight: 600;
      }

      .nz-policies { border: 1px solid var(--gray-200); border-radius: var(--r-lg); overflow: hidden; }
      .nz-policy-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 16px 20px; border-bottom: 1px solid var(--gray-100);
      }
      .nz-policy-row:last-child { border-bottom: none; }
      .nz-policy-row .pl { display: flex; align-items: center; gap: 11px; font-size: 14px; font-weight: 700; }
      .nz-policy-row .pv { font-size: 13.5px; color: var(--gray-400); font-weight: 600; }
      .nz-policy-row .pv.good { color: var(--teal); }

      .nz-widget {
        position: sticky; top: 90px; background: var(--white);
        border: 1px solid var(--gray-200); border-radius: var(--r-lg);
        box-shadow: var(--shadow-lg); overflow: hidden;
        max-width: 100%;
      }
      .nz-widget-head {
        padding: 14px 22px; background: var(--red-soft);
        display: flex; align-items: center; gap: 8px;
        font-size: 13px; font-weight: 700; color: var(--red-deep);
        border-bottom: 1px solid var(--gray-100);
      }
      .nz-widget-head .live { width: 7px; height: 7px; border-radius: 50%; background: var(--red); animation: blink 1.6s infinite; }
      .nz-widget-body { padding: 22px; }
      .nz-widget-price { display: flex; align-items: baseline; gap: 6px; margin-bottom: 20px; }
      .nz-widget-price .amt { font-size: 32px; font-weight: 600; letter-spacing: -0.025em; }
      .nz-widget-price .unit { font-size: 13px; color: var(--gray-400); font-weight: 600; }
      .nz-widget-dates { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
      .nz-widget-dates > .wf { min-width: 0; }
      .wf { border: 1.5px solid var(--gray-200); border-radius: var(--r-sm); padding: 9px 12px; min-width: 0; }
      .wf label { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--gray-400); display: block; margin-bottom: 3px; }
      .wf input { border: none; outline: none; width: 100%; min-width: 0; font-size: 13px; font-weight: 600; color: var(--ink); }
      .nz-widget-room { padding: 14px; background: var(--cream); border-radius: var(--r-md); margin-bottom: 16px; border: 1px solid var(--gray-100); }
      .wr-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--gray-400); margin-bottom: 5px; }
      .wr-name { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
      .wr-calc { display: flex; justify-content: space-between; font-size: 13px; color: var(--gray-400); font-weight: 600; }
      .nz-widget-breakdown { margin-bottom: 16px; }
      .bd-row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 13.5px; color: var(--ink-2); font-weight: 600; }
      .bd-row.total { border-top: 1.5px solid var(--gray-200); margin-top: 6px; padding-top: 12px; font-size: 16px; font-weight: 800; color: var(--ink); }
      .bd-row.total .display { font-size: 20px; font-weight: 600; }
      .nz-widget-cta {
        width: 100%; padding: 15px; background: var(--red); color: #fff; border: none;
        border-radius: var(--r-md); font-family: 'Clash Display', sans-serif;
        font-size: 16px; font-weight: 600; transition: background .2s, transform .15s;
      }
      .nz-widget-cta:hover:not(:disabled) { background: var(--red-deep); transform: scale(1.01); }
      .nz-widget-cta:disabled {
        background: var(--gray-200); color: var(--gray-400);
        cursor: not-allowed; transform: none;
      }

      /* Inline date-error banner shown between the date inputs and the
         booking breakdown. Tighter and more compact than the booking-page
         banner because it sits inside the narrow widget column. */
      .nz-widget-date-err {
        display: flex; align-items: center; gap: 8px;
        padding: 10px 12px; margin-bottom: 14px;
        background: rgba(230, 57, 70, 0.08);
        border: 1px solid rgba(230, 57, 70, 0.25);
        border-left: 3px solid var(--red);
        border-radius: var(--r-sm);
        font-size: 12.5px; color: var(--ink); line-height: 1.4;
      }
      .nz-widget-reassure {
        text-align: center; margin-top: 12px; font-size: 12px; color: var(--teal); font-weight: 700;
        display: flex; align-items: center; justify-content: center; gap: 6px;
      }
      .nz-widget-wa {
        margin-top: 14px; display: flex; align-items: center; gap: 11px;
        padding: 14px 16px; border: 1.5px solid var(--gray-200); border-radius: var(--r-md);
        transition: border-color .2s, background .2s;
      }
      .nz-widget-wa:hover { border-color: #25D366; background: #f4fdf7; }
      .ww-ic { width: 38px; height: 38px; border-radius: 50%; background: #25D366; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
      .ww-tx { font-size: 12.5px; }
      .ww-tx strong { display: block; color: var(--ink); font-weight: 700; }
      .ww-tx span { color: var(--gray-400); }
      .nz-widget-foot {
        padding: 14px 22px; background: var(--cream); border-top: 1px solid var(--gray-100);
        display: flex; align-items: center; gap: 9px; font-size: 11.5px; color: var(--gray-400); font-weight: 600;
      }

      @media (max-width: 1080px) {
        .nz-detail-layout { grid-template-columns: 1fr; }
        .nz-widget { position: static; }
        /* The floating WhatsApp bubble overlaps the sticky reserve bar and is
           redundant here — the booking widget already has a "book by WhatsApp"
           CTA. Hide it on mobile detail pages only (this global style tag is
           only mounted on detail pages). !important beats WhatsAppButton's own
           scoped display:flex. Desktop keeps the bubble (no reserve bar there). */
        .nz-wa { display: none !important; }
      }
      @media (max-width: 720px) {
        .nz-gallery { grid-template-columns: 1fr 1fr; height: 320px; }
        .nz-gal-item:nth-child(1) { grid-column: span 2; }
        .nz-gal-item:nth-child(4), .nz-gal-item:nth-child(5) { display: none; }
        .nz-room { grid-template-columns: 1fr; }
        .nz-room-photo { height: 180px; }
        .nz-room-action { text-align: left; align-items: flex-start; }
        .nz-amenities { grid-template-columns: 1fr 1fr; }
      }
      @media (max-width: 560px) {
        .nz-bc { flex-wrap: wrap; row-gap: 4px; font-size: 12px; }
        .nz-gallery { height: 240px; gap: 5px; }
        .nz-detail-layout { padding-top: 24px; gap: 0; padding-bottom: 90px; }
        .nz-hotel-head h1 { font-size: 28px; }
        .nz-hotel-sub { gap: 12px; }
        .nz-dtabs {
          /* Allow horizontal scroll if tabs overflow on small screens */
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .nz-dtabs::-webkit-scrollbar { display: none; }
        .nz-dtab {
          padding: 14px 12px;
          font-size: 13.5px;
          white-space: nowrap;
        }
        .nz-dtab::after { left: 12px; right: 12px; }
        .nz-dsection { margin-bottom: 32px; }
        .nz-dsection h2 { font-size: 21px; }
        .nz-about { font-size: 14.5px; }
        .nz-room { padding: 14px; }
        .nz-room-action {
          flex-direction: row; align-items: center; justify-content: space-between;
          width: 100%; margin-top: 4px;
        }
        .nz-amenities { grid-template-columns: 1fr; }
        .nz-policy-row { padding: 14px 16px; }
        .nz-widget { border-radius: var(--r-md); }
        .nz-room-perks { gap: 10px; }
      }

      /* sticky mobile reserve bar — hidden on desktop */
      .nz-mobile-reserve { display: none; }
      @media (max-width: 1080px) {
        .nz-mobile-reserve {
          display: flex; align-items: center; justify-content: space-between; gap: 14px;
          position: fixed; left: 0; right: 0; bottom: 0; z-index: 90;
          background: #fff; border-top: 1px solid var(--gray-200);
          padding: 12px 20px; box-shadow: 0 -8px 24px -12px rgba(20,20,30,0.2);
        }
        .nz-mr-price .amt { font-size: 20px; font-weight: 600; letter-spacing: -0.02em; }
        .nz-mr-price .unit { font-size: 11px; color: var(--gray-400); font-weight: 600; margin-inline-start: 4px; }
        .nz-mr-btn {
          flex: 1; max-width: 200px; padding: 14px; background: var(--red); color: #fff;
          border: none; border-radius: var(--r-sm);
          font-family: 'Clash Display', sans-serif; font-size: 15px; font-weight: 600;
        }
        .nz-mr-btn.wa {
          max-width: none; background: #25D366; text-align: center;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
      }
    `}</style>
  );
}

function ratingKey(rating) {
  if (rating >= 9) return "rate.exceptional";
  if (rating >= 8.5) return "rate.excellent";
  if (rating >= 8) return "rate.verygood";
  if (rating >= 7) return "rate.good";
  return "rate.pleasant";
}
