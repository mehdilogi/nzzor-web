"use client";

// =============================================================================
// HowItWorks — "Comment ça marche", a live demonstration
// -----------------------------------------------------------------------------
// The nav's "How it works" link used to land on the "Why Nzzor" band, which
// explains trust, not the steps (seen in Clarity recordings: visitors clicked
// it and found nothing that answered the question). This section shows the
// four steps on a phone that plays each screen: search, room, SATIM payment,
// voucher. It runs while on screen, pauses on hover, and any step can be
// tapped. Follows the site language; Arabic is RTL.
//
// Background: the same 12-point rosette zellige tile as the "Why Nzzor" band,
// static and faded so the moving phone stays the only motion.
// =============================================================================

import { useEffect, useRef, useState } from "react";
import { useLang } from "../lib/LangContext";

const DUR = 4200;
const TILE_D = "M285.9 13.5L282.3 20.0 M298.4 59.9L282.3 50.0 M282.3 20.0L278.7 13.5 M278.7 13.5L272.3 17.3 M282.3 20.0L282.3 50.0 M282.3 50.0L266.3 59.9 M266.3 59.9L257.3 43.3 M272.3 17.3L272.4 9.9 M272.4 9.9L265.0 10.0 M272.3 17.3L257.3 43.3 M257.3 43.3L238.5 43.8 M238.5 43.8L239.0 25.0 M265.0 10.0L268.8 3.6 M268.8 3.6L262.3 0.0 M265.0 10.0L239.0 25.0 M239.0 25.0L222.4 16.0 M222.4 16.0L232.3 0.0 M262.3 0.0L268.8 -3.6 M262.3 0.0L232.3 0.0 M232.3 0.0L222.4 -16.0 M20.0 0.0L13.5 3.6 M13.5 3.6L17.3 10.0 M20.0 0.0L50.0 0.0 M50.0 0.0L59.9 16.0 M59.9 16.0L43.3 25.0 M17.3 10.0L9.9 9.9 M9.9 9.9L10.0 17.3 M17.3 10.0L43.3 25.0 M43.3 25.0L43.8 43.8 M43.8 43.8L25.0 43.3 M10.0 17.3L3.6 13.5 M3.6 13.5L0.0 20.0 M10.0 17.3L25.0 43.3 M25.0 43.3L16.0 59.9 M16.0 59.9L0.0 50.0 M0.0 20.0L-3.6 13.5 M0.0 20.0L0.0 50.0 M0.0 50.0L-16.0 59.9 M13.5 -3.6L20.0 0.0 M59.9 -16.0L50.0 0.0 M161.2 81.5L154.7 85.1 M154.7 85.1L158.5 91.5 M161.2 81.5L191.2 81.5 M191.2 81.5L201.0 97.5 M201.0 97.5L184.5 106.5 M158.5 91.5L151.1 91.4 M151.1 91.4L151.2 98.8 M158.5 91.5L184.5 106.5 M184.5 106.5L185.0 125.3 M185.0 125.3L166.2 124.8 M151.2 98.8L144.8 95.0 M144.8 95.0L141.2 101.5 M151.2 98.8L166.2 124.8 M166.2 124.8L157.2 141.4 M157.2 141.4L141.2 131.5 M141.2 101.5L137.5 95.0 M137.5 95.0L131.2 98.8 M141.2 101.5L141.2 131.5 M141.2 131.5L125.1 141.4 M125.1 141.4L116.2 124.8 M131.2 98.8L131.3 91.4 M131.3 91.4L123.8 91.5 M131.2 98.8L116.2 124.8 M116.2 124.8L97.3 125.3 M97.3 125.3L97.9 106.5 M123.8 91.5L127.6 85.1 M127.6 85.1L121.2 81.5 M123.8 91.5L97.9 106.5 M97.9 106.5L81.3 97.5 M81.3 97.5L91.2 81.5 M121.2 81.5L127.6 77.9 M127.6 77.9L123.8 71.5 M121.2 81.5L91.2 81.5 M91.2 81.5L81.3 65.5 M81.3 65.5L97.9 56.5 M123.8 71.5L131.3 71.6 M131.3 71.6L131.2 64.2 M123.8 71.5L97.9 56.5 M97.9 56.5L97.3 37.7 M97.3 37.7L116.2 38.2 M131.2 64.2L137.5 68.0 M137.5 68.0L141.2 61.5 M131.2 64.2L116.2 38.2 M116.2 38.2L125.1 21.6 M125.1 21.6L141.2 31.5 M141.2 61.5L144.8 68.0 M144.8 68.0L151.2 64.2 M141.2 61.5L141.2 31.5 M141.2 31.5L157.2 21.6 M157.2 21.6L166.2 38.2 M151.2 64.2L151.1 71.6 M151.1 71.6L158.5 71.5 M151.2 64.2L166.2 38.2 M166.2 38.2L185.0 37.7 M185.0 37.7L184.5 56.5 M158.5 71.5L154.7 77.9 M154.7 77.9L161.2 81.5 M158.5 71.5L184.5 56.5 M184.5 56.5L201.0 65.5 M201.0 65.5L191.2 81.5 M268.8 166.6L262.3 163.0 M222.4 179.0L232.3 163.0 M262.3 163.0L268.8 159.4 M268.8 159.4L265.0 153.0 M262.3 163.0L232.3 163.0 M232.3 163.0L222.4 147.0 M222.4 147.0L239.0 138.0 M265.0 153.0L272.4 153.1 M272.4 153.1L272.3 145.7 M265.0 153.0L239.0 138.0 M239.0 138.0L238.5 119.2 M238.5 119.2L257.3 119.7 M272.3 145.7L278.7 149.5 M278.7 149.5L282.3 143.0 M272.3 145.7L257.3 119.7 M257.3 119.7L266.3 103.1 M266.3 103.1L282.3 113.0 M282.3 143.0L285.9 149.5 M282.3 143.0L282.3 113.0 M282.3 113.0L298.4 103.1 M20.0 163.0L13.5 166.6 M20.0 163.0L50.0 163.0 M50.0 163.0L59.9 179.0 M-3.6 149.5L-0.0 143.0 M-16.0 103.1L-0.0 113.0 M-0.0 143.0L3.6 149.5 M3.6 149.5L10.0 145.7 M-0.0 143.0L-0.0 113.0 M-0.0 113.0L16.0 103.1 M16.0 103.1L25.0 119.7 M10.0 145.7L9.9 153.1 M9.9 153.1L17.3 153.0 M10.0 145.7L25.0 119.7 M25.0 119.7L43.8 119.2 M43.8 119.2L43.3 138.0 M17.3 153.0L13.5 159.4 M13.5 159.4L20.0 163.0 M17.3 153.0L43.3 138.0 M43.3 138.0L59.9 147.0 M59.9 147.0L50.0 163.0 M162.2 178.0L162.2 148.0 M162.2 148.0L188.2 133.0 M188.2 133.0L214.2 148.0 M214.2 148.0L214.2 178.0 M68.1 178.0L68.1 148.0 M68.1 148.0L94.1 133.0 M94.1 133.0L120.1 148.0 M120.1 148.0L120.1 178.0 M261.3 96.5L235.3 111.5 M235.3 111.5L209.3 96.5 M209.3 96.5L209.3 66.5 M209.3 66.5L235.3 51.5 M235.3 51.5L261.3 66.5 M261.3 66.5L261.3 96.5 M214.2 15.0L188.2 30.0 M188.2 30.0L162.2 15.0 M162.2 15.0L162.2 -15.0 M214.2 -15.0L214.2 15.0 M120.1 15.0L94.1 30.0 M94.1 30.0L68.1 15.0 M68.1 15.0L68.1 -15.0 M120.1 -15.0L120.1 15.0 M73.0 96.5L47.1 111.5 M47.1 111.5L21.1 96.5 M21.1 96.5L21.1 66.5 M21.1 66.5L47.1 51.5 M47.1 51.5L73.0 66.5 M73.0 66.5L73.0 96.5 M166.2 -38.2L145.5 0.0 M116.2 -38.2L136.8 0.0 M282.3 50.0L306.3 64.8 M282.3 50.0L258.3 64.8 M257.3 43.3L277.9 81.5 M257.3 43.3L213.9 44.5 M239.0 25.0L238.2 53.2 M239.0 25.0L214.2 11.6 M232.3 0.0L209.6 37.0 M232.3 0.0L209.6 -37.0 M50.0 0.0L72.8 37.0 M43.3 25.0L68.1 11.6 M43.3 25.0L44.1 53.2 M25.0 43.3L68.4 44.5 M25.0 43.3L4.4 81.5 M0.0 50.0L24.0 64.8 M0.0 50.0L-24.0 64.8 M50.0 0.0L72.8 -37.0 M191.2 81.5L213.9 118.5 M184.5 106.5L209.3 93.1 M184.5 106.5L185.3 134.7 M166.2 124.8L209.6 126.0 M166.2 124.8L145.5 163.0 M141.2 131.5L165.2 146.3 M141.2 131.5L117.1 146.3 M116.2 124.8L136.8 163.0 M116.2 124.8L72.8 126.0 M97.9 106.5L97.1 134.7 M97.9 106.5L73.0 93.1 M91.2 81.5L68.4 118.5 M91.2 81.5L68.4 44.5 M97.9 56.5L73.0 69.9 M97.9 56.5L97.1 28.3 M116.2 38.2L72.8 37.0 M116.2 38.2L136.8 0.0 M141.2 31.5L117.1 16.7 M141.2 31.5L165.2 16.7 M166.2 38.2L145.5 0.0 M166.2 38.2L209.6 37.0 M184.5 56.5L185.3 28.3 M184.5 56.5L209.3 69.9 M191.2 81.5L213.9 44.5 M232.3 163.0L209.6 200.0 M232.3 163.0L209.6 126.0 M239.0 138.0L214.2 151.4 M239.0 138.0L238.2 109.8 M257.3 119.7L213.9 118.5 M257.3 119.7L277.9 81.5 M282.3 113.0L258.3 98.2 M282.3 113.0L306.3 98.2 M50.0 163.0L72.8 200.0 M-0.0 113.0L-24.0 98.2 M-0.0 113.0L24.0 98.2 M25.0 119.7L4.4 81.5 M25.0 119.7L68.4 118.5 M43.3 138.0L44.1 109.8 M43.3 138.0L68.1 151.4 M50.0 163.0L72.8 126.0 M116.2 201.2L136.8 163.0 M166.2 201.2L145.5 163.0";

const T = {
  "fr": {
    "kicker": "Comment ça marche",
    "title1": "Votre hôtel réservé en",
    "title2": "4 étapes",
    "sub": "Pas d'appel, pas d'attente : vous choisissez, vous payez avec votre carte algérienne, et votre bon de réservation arrive dans la minute.",
    "s1h": "Choisissez la ville et les dates",
    "s1p": "Indiquez votre wilaya, vos dates et le nombre de voyageurs. Nous affichons les hôtels vérifiés qui ont de la place.",
    "s1t1": "Hôtels vérifiés",
    "s1t2": "Prix en dinars",
    "s2h": "Comparez et choisissez votre chambre",
    "s2p": "Photos, équipements, formule (petit-déjeuner, demi-pension) et prix total du séjour, affiché avant de payer.",
    "s2t1": "Prix total, taxes incluses",
    "s2t2": "Annulation affichée",
    "s3h": "Payez en toute sécurité",
    "s3p": "Paiement par carte CIB ou Edahabia sur la page sécurisée de la SATIM, avec le code reçu par SMS. Nous ne voyons jamais votre carte.",
    "s3t3": "Sécurisé par la SATIM",
    "s4h": "Recevez votre bon de réservation",
    "s4p": "Confirmation immédiate : le bon arrive par e-mail et l'hôtel est prévenu en même temps. Présentez-le à l'arrivée.",
    "s4t1": "Confirmation immédiate",
    "s4t2": "Hôtel prévenu",
    "langchip": "FR",
    "sc1": "Où allez-vous ?",
    "dest": "Destination",
    "city": "Sétif",
    "month": "Décembre 2026",
    "guests": "Voyageurs",
    "guestsv": "2 adultes · 1 chambre",
    "searchbtn": "Rechercher",
    "hotel": "Hôtel El Hidhab",
    "verified": "✓ Vérifié",
    "sc2": "Choisissez votre chambre",
    "r1": "Chambre double",
    "r1s": "Chambre seule",
    "r2": "Double · vue jardin",
    "r2s": "Petit-déjeuner inclus",
    "free": "✓ Annulation gratuite",
    "tot": "Total · 2 nuits",
    "bookbtn": "Réserver",
    "secure": "Paiement sécurisé SATIM",
    "smsfrom": "Votre banque",
    "smstext": "Code de confirmation : 4719",
    "paybtn": "Payer",
    "confirmed": "Réservation confirmée",
    "confsub": "Paiement accepté · bon envoyé par e-mail",
    "ref": "Référence",
    "arr": "Arrivée",
    "arrv": "Ven. 18 déc.",
    "nights": "Nuits",
    "n1h": "Bon de réservation",
    "n1": "Envoyé dans votre boîte e-mail",
    "n2": "A reçu votre réservation",
    "a1h": "Pas de carte en ligne ?",
    "a1p": "Certains hôtels se réservent via WhatsApp : notre équipe vérifie, confirme et vous envoie le bon.",
    "a2h": "Agence agréée",
    "a2p": "Nzzor est exploité par Allouni Travel Agency, agréée par le Ministère du Tourisme.",
    "a3h": "Un groupe de 10+ ?",
    "a3p": "Séminaire, mariage, équipe : demandez un tarif groupe, devis sous 24 h.",
    "a3l": "Voyages de groupe",
    "days": [
      "L",
      "M",
      "M",
      "J",
      "V",
      "S",
      "D"
    ]
  },
  "en": {
    "kicker": "How it works",
    "title1": "Your hotel, booked in",
    "title2": "4 steps",
    "sub": "No phone calls, no waiting: choose, pay with your Algerian card, and your booking voucher arrives within a minute.",
    "s1h": "Choose your city and dates",
    "s1p": "Enter your wilaya, dates and number of guests. We show the verified hotels that have rooms.",
    "s1t1": "Verified hotels",
    "s1t2": "Prices in dinars",
    "s2h": "Compare and pick your room",
    "s2p": "Photos, amenities, meal plan (breakfast, half board) and the total price of the stay, shown before you pay.",
    "s2t1": "Total price, taxes included",
    "s2t2": "Cancellation shown",
    "s3h": "Pay securely",
    "s3p": "Pay by CIB or Edahabia card on SATIM's secure page, with the code your bank sends by SMS. We never see your card.",
    "s3t3": "Secured by SATIM",
    "s4h": "Get your booking voucher",
    "s4p": "Instant confirmation: the voucher arrives by email and the hotel is notified at the same time. Show it at check-in.",
    "s4t1": "Instant confirmation",
    "s4t2": "Hotel notified",
    "langchip": "EN",
    "sc1": "Where to?",
    "dest": "Destination",
    "city": "Setif",
    "month": "December 2026",
    "guests": "Guests",
    "guestsv": "2 adults · 1 room",
    "searchbtn": "Search",
    "hotel": "Hotel El Hidhab",
    "verified": "✓ Verified",
    "sc2": "Choose your room",
    "r1": "Double room",
    "r1s": "Room only",
    "r2": "Double · garden view",
    "r2s": "Breakfast included",
    "free": "✓ Free cancellation",
    "tot": "Total · 2 nights",
    "bookbtn": "Book",
    "secure": "SATIM secure payment",
    "smsfrom": "Your bank",
    "smstext": "Confirmation code: 4719",
    "paybtn": "Pay",
    "confirmed": "Booking confirmed",
    "confsub": "Payment accepted · voucher emailed",
    "ref": "Reference",
    "arr": "Check-in",
    "arrv": "Fri 18 Dec",
    "nights": "Nights",
    "n1h": "Booking voucher",
    "n1": "Sent to your inbox",
    "n2": "Received your booking",
    "a1h": "No card for online payment?",
    "a1p": "Some hotels are booked over WhatsApp: our team checks, confirms and sends you the voucher.",
    "a2h": "Licensed agency",
    "a2p": "Nzzor is operated by Allouni Travel Agency, licensed by the Ministry of Tourism.",
    "a3h": "A group of 10+?",
    "a3p": "Seminar, wedding, team: ask for a group rate, quote within 24 h.",
    "a3l": "Group travel",
    "days": [
      "M",
      "T",
      "W",
      "T",
      "F",
      "S",
      "S"
    ]
  },
  "ar": {
    "kicker": "كيف يعمل",
    "title1": "فندقك محجوز في",
    "title2": "4 خطوات",
    "sub": "بدون اتصال وبدون انتظار: تختار، تدفع ببطاقتك الجزائرية، وتصلك قسيمة الحجز خلال دقيقة.",
    "s1h": "اختر المدينة والتواريخ",
    "s1p": "حدد ولايتك وتواريخك وعدد المسافرين. نعرض لك الفنادق الموثقة التي تتوفر فيها غرف.",
    "s1t1": "فنادق موثقة",
    "s1t2": "الأسعار بالدينار",
    "s2h": "قارن واختر غرفتك",
    "s2p": "الصور والمرافق ونوع الخدمة (فطور، نصف إقامة) والسعر الإجمالي للإقامة، يظهر قبل الدفع.",
    "s2t1": "السعر الإجمالي شامل الرسوم",
    "s2t2": "شروط الإلغاء واضحة",
    "s3h": "ادفع بأمان",
    "s3p": "الدفع ببطاقة CIB أو الذهبية عبر صفحة ساتيم الآمنة، مع الرمز الذي يرسله البنك عبر SMS. لا نرى بطاقتك أبداً.",
    "s3t3": "مؤمّن عبر ساتيم",
    "s4h": "استلم قسيمة الحجز",
    "s4p": "تأكيد فوري: تصلك القسيمة بالبريد الإلكتروني ويُبلَّغ الفندق في نفس الوقت. قدّمها عند الوصول.",
    "s4t1": "تأكيد فوري",
    "s4t2": "الفندق على علم",
    "langchip": "ع",
    "sc1": "إلى أين؟",
    "dest": "الوجهة",
    "city": "سطيف",
    "month": "ديسمبر 2026",
    "guests": "المسافرون",
    "guestsv": "شخصان · غرفة واحدة",
    "searchbtn": "بحث",
    "hotel": "فندق الهضاب",
    "verified": "✓ موثق",
    "sc2": "اختر غرفتك",
    "r1": "غرفة مزدوجة",
    "r1s": "غرفة فقط",
    "r2": "مزدوجة · إطلالة على الحديقة",
    "r2s": "الفطور مشمول",
    "free": "✓ إلغاء مجاني",
    "tot": "المجموع · ليلتان",
    "bookbtn": "احجز",
    "secure": "دفع آمن عبر ساتيم",
    "smsfrom": "بنكك",
    "smstext": "رمز التأكيد: 4719",
    "paybtn": "ادفع",
    "confirmed": "تم تأكيد الحجز",
    "confsub": "تم قبول الدفع · القسيمة في بريدك",
    "ref": "رقم الحجز",
    "arr": "الوصول",
    "arrv": "الجمعة 18 ديسمبر",
    "nights": "الليالي",
    "n1h": "قسيمة الحجز",
    "n1": "أُرسلت إلى بريدك الإلكتروني",
    "n2": "استلم حجزك",
    "a1h": "لا تملك بطاقة للدفع عبر الإنترنت؟",
    "a1p": "بعض الفنادق تُحجز عبر واتساب: فريقنا يتحقق ويؤكد ويرسل لك القسيمة.",
    "a2h": "وكالة معتمدة",
    "a2p": "نزور تديرها وكالة علوني للسياحة والأسفار، المعتمدة من وزارة السياحة.",
    "a3h": "مجموعة من 10 أشخاص أو أكثر؟",
    "a3p": "ندوة، عرس، فريق: اطلبوا سعر المجموعات، عرض سعر خلال 24 ساعة.",
    "a3l": "رحلات المجموعات",
    "days": [
      "ن",
      "ث",
      "ر",
      "خ",
      "ج",
      "س",
      "ح"
    ]
  }
};

function Money({ v, lang }) {
  const n = new Intl.NumberFormat(lang === "en" ? "en-US" : "fr-FR").format(v).replace(/[  ]/g, " ");
  return lang === "ar" ? <><bdi>{n}</bdi> دج</> : <>{n} DA</>;
}

export default function HowItWorks() {
  const { lang } = useLang();
  const L = T[lang] ? lang : "fr";
  const t = T[L];
  const rtl = L === "ar";
  const [cur, setCur] = useState(0);
  const [run, setRun] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  function go(i) {
    setCur(((i % 4) + 4) % 4);
    setRun((r) => r + 1);
  }

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Restart the demo when it comes into view, so it always begins on step 1.
  useEffect(() => { if (visible) go(0); }, [visible]);

  useEffect(() => {
    if (!visible || paused) return;
    const id = setTimeout(() => go(cur + 1), DUR);
    return () => clearTimeout(id);
  }, [cur, run, visible, paused]);

  const steps = [
    { h: t.s1h, p: t.s1p, tags: [t.s1t1, t.s1t2] },
    { h: t.s2h, p: t.s2p, tags: [t.s2t1, t.s2t2] },
    { h: t.s3h, p: t.s3p, tags: ["CIB", "Edahabia", t.s3t3] },
    { h: t.s4h, p: t.s4p, tags: [t.s4t1, t.s4t2] },
  ];
  const sceneCls = (i) => `scene${i === cur && visible ? " on" : ""}`;
  const k = (i) => `${i}-${i === cur ? run : "x"}`;

  return (
    <section ref={ref} className={`hiw${paused ? " paused" : ""}`} id="how" dir={rtl ? "rtl" : "ltr"} lang={L} style={{ "--dur": DUR + "ms" }}>
      <svg className="hiw-pattern" aria-hidden="true" focusable="false">
        <defs>
          <pattern id="nzHiwTile" width="282.324" height="163" patternUnits="userSpaceOnUse">
            <path d={TILE_D} fill="none" stroke="#7A4A2A" strokeWidth="1" strokeLinecap="round" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#nzHiwTile)" />
      </svg>

      <div className="hiw-wrap">
        <span className="hiw-kicker">{t.kicker}</span>
        <h2 className="display">{t.title1} <em>{t.title2}</em>.</h2>
        <p className="hiw-sub">{t.sub}</p>

        <div className="hiw-grid" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <ol className="steps">
            {steps.map((s, i) => (
              <li key={i} className={`step${i === cur ? " on" : ""}${i < cur ? " done" : ""}`} onClick={() => go(i)}>
                <div className="step-num">
                  <svg viewBox="0 0 56 56" key={k(i)}><circle cx="28" cy="28" r="26" /></svg>
                  <span>{i + 1}</span>
                </div>
                <div>
                  <h3>{s.h}</h3>
                  <p>{s.p}</p>
                  <div className="tags">{s.tags.map((x) => <span className="tag" key={x}>{x}</span>)}</div>
                </div>
              </li>
            ))}
          </ol>

          <div className="phone-wrap" aria-hidden="true">
            <div className="phone-glow" />
            <div className="phone"><div className="screen">
              <div className="app-top"><div className="logo"><i />Nzzor</div><b>{t.langchip}</b></div>

              <div className={sceneCls(0)} key={k(0)}>
                <div className="s-label">{t.sc1}</div>
                <div className="field"><small>{t.dest}</small><span><span className="typed">{t.city}</span></span></div>
                <div className="card" style={{ padding: "10px 10px 6px" }}>
                  <div className="s-label" style={{ margin: "0 2px" }}>{t.month}</div>
                  <div className="cal">
                    {t.days.map((x, j) => <span className="h" key={"h" + j}>{x}</span>)}
                    <span />
                    {Array.from({ length: 20 }, (_, j) => j + 1).map((n) => (
                      <span key={n} className={n === 18 ? "sel a" : n === 19 ? "sel b" : n === 20 ? "sel c" : ""}>{n}</span>
                    ))}
                  </div>
                </div>
                <div className="field" style={{ marginTop: 8 }}><small>{t.guests}</small><span>{t.guestsv}</span></div>
                <span className="btn press">{t.searchbtn}</span>
              </div>

              <div className={sceneCls(1)} key={k(1)}>
                <div className="hotel-img"><b>{t.hotel}</b><small>{t.verified}</small></div>
                <div className="s-label">{t.sc2}</div>
                <div className="rate"><div><strong>{t.r1}</strong><small>{t.r1s}</small></div><em><Money v={5900} lang={L} /></em></div>
                <div className="rate pick"><div><strong>{t.r2}</strong><small>{t.r2s}</small><span className="chip-ok">{t.free}</span></div><em><Money v={7400} lang={L} /></em></div>
                <div className="total"><span>{t.tot}</span><b><Money v={14800} lang={L} /></b></div>
                <span className="btn press2">{t.bookbtn}</span>
              </div>

              <div className={sceneCls(2)} key={k(2)}>
                <div className="satim">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
                  <span>{t.secure}</span>
                </div>
                <div className="cardviz"><div className="chip" /><div className="num">6280 <span className="dots"><i /><i /><i /><i /></span> 4417</div><div className="brand">CIB · EDAHABIA</div></div>
                <div className="sms"><i>✉</i><div><b>{t.smsfrom}</b><span>{t.smstext}</span></div></div>
                <div className="otp"><span>4</span><span>7</span><span>1</span><span>9</span></div>
                <span className="btn press3">{t.paybtn} <Money v={14800} lang={L} /></span>
              </div>

              <div className={sceneCls(3)} key={k(3)}>
                <div className="done-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></div>
                <div className="done-title">{t.confirmed}</div>
                <div className="done-sub">{t.confsub}</div>
                <div className="ticket">
                  <div className="ticket-top"><div><small>{t.ref}</small><b>NZR-8QBT-YUZA</b></div><div className="qr" /></div>
                  <div className="ticket-cut" />
                  <div className="ticket-bot"><div><small>{t.arr}</small><b>{t.arrv}</b></div><div><small>{t.nights}</small><b>2</b></div></div>
                </div>
                <div className="notif"><i>✉</i><div><b>{t.n1h}</b><span>{t.n1}</span></div></div>
                <div className="notif n2"><i>🏨</i><div><b>{t.hotel}</b><span>{t.n2}</span></div></div>
              </div>
            </div></div>
          </div>
        </div>

        <div className="alt">
          <div>
            <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="#1B8A5A" strokeWidth="2"><path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.6-4.2A8.5 8.5 0 1 1 20.5 11.6z" /></svg></span>
            <div><h4>{t.a1h}</h4><p>{t.a1p}</p></div>
          </div>
          <div>
            <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="#16161A" strokeWidth="2"><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg></span>
            <div><h4>{t.a2h}</h4><p>{t.a2p}</p></div>
          </div>
          <div>
            <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="#E63946" strokeWidth="2"><circle cx="9" cy="8" r="3.2" /><circle cx="17" cy="9.5" r="2.4" /><path d="M3 19c.6-3.3 3-5 6-5s5.4 1.7 6 5M14.5 14.6c2.6-.4 5.2.8 6 4.4" /></svg></span>
            <div><h4>{t.a3h}</h4><p>{t.a3p} <a href="/groupes">{t.a3l} {rtl ? "←" : "→"}</a></p></div>
          </div>
        </div>
      </div>

      <style jsx>{`
/* ===================== SECTION ===================== */
  .hiw { padding: 64px 0 64px; scroll-margin-top: 64px; position: relative; overflow: hidden; background: var(--cream, #FAF8F4); isolation: isolate; }
  .hiw-pattern { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; opacity: .11;
    -webkit-mask-image: radial-gradient(ellipse 75% 70% at 30% 45%, transparent 0%, rgba(0,0,0,.35) 45%, #000 85%);
            mask-image: radial-gradient(ellipse 75% 70% at 30% 45%, transparent 0%, rgba(0,0,0,.35) 45%, #000 85%); }
  .hiw-wrap { position: relative; z-index: 1; }
  @media (max-width: 560px) { .hiw-pattern { opacity: .08; } }
  .hiw-wrap { max-width: 1180px; margin: 0 auto; padding: 0 32px; }
  .hiw-kicker { font-size: 11.5px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--red); display: inline-block; padding-bottom: 6px; border-bottom: 2px solid var(--red); }
  .hiw h2 { font-family: "Clash Display", sans-serif; font-weight: 600; font-size: clamp(36px, 5vw, 60px); line-height: 1.02; letter-spacing: -0.035em; margin: 14px 0 10px; max-width: 980px; }
  .hiw[dir="rtl"] h2 { font-family: inherit; letter-spacing: 0; line-height: 1.25; }
  .hiw h2 em { font-style: normal; color: var(--red); }
  .hiw-sub { font-size: 17px; line-height: 1.65; color: var(--ink-2); max-width: 600px; margin: 0 0 28px; }

  .hiw-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 64px; align-items: center; }

  /* steps */
  .steps { list-style: none; margin: 0; padding: 0; position: relative; }
  .steps::before { content: ""; position: absolute; inset-inline-start: 23px; top: 30px; bottom: 30px; width: 2px; background: var(--gray-200); }
  .step { position: relative; display: grid; grid-template-columns: 48px 1fr; gap: 20px; padding: 12px 20px 12px 0; cursor: pointer; border-radius: 16px; transition: background .3s; }
  .hiw[dir="rtl"] .step { padding: 12px 0 12px 20px; }
  .step:hover { background: rgba(22,22,26,.03); }
  .step-num { position: relative; z-index: 1; width: 48px; height: 48px; border-radius: 50%; background: #fff; border: 2px solid var(--gray-200); display: grid; place-items: center; font: 600 17px "Clash Display", sans-serif; color: var(--gray-400); transition: all .35s; }
  .step-num svg { position: absolute; inset: -4px; width: 56px; height: 56px; transform: rotate(-90deg); opacity: 0; }
  .step-num circle { fill: none; stroke: var(--red); stroke-width: 2.5; stroke-dasharray: 163; stroke-dashoffset: 163; }
  .step.on .step-num { background: var(--ink); border-color: var(--ink); color: #fff; }
  .step.on .step-num svg { opacity: 1; }
  .step.on .step-num circle { animation: ring var(--dur, 4200ms) linear forwards; }
  .hiw.paused .step.on .step-num circle { animation-play-state: paused; }
  @keyframes ring { to { stroke-dashoffset: 0; } }
  .step.done .step-num { background: var(--teal); border-color: var(--teal); color: #fff; }
  .step h3 { margin: 4px 0 6px; font-size: 19px; font-weight: 800; letter-spacing: -0.01em; transition: color .3s; color: var(--gray-400); }
  .step.on h3, .step.done h3 { color: var(--ink); }
  .step p { margin: 0; font-size: 14.5px; line-height: 1.6; color: var(--gray-400); max-height: 0; overflow: hidden; opacity: 0; transition: max-height .45s, opacity .35s; }
  .step.on p { max-height: 120px; opacity: 1; color: var(--ink-2); }
  .step .tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; max-height: 0; overflow: hidden; opacity: 0; transition: max-height .45s, opacity .35s; }
  .step.on .tags { max-height: 60px; opacity: 1; }
  .tag { font-size: 11.5px; font-weight: 700; padding: 5px 10px; border-radius: 980px; background: #fff; border: 1px solid var(--gray-200); color: var(--ink-2); }

  /* phone */
  .phone-wrap { position: relative; display: flex; justify-content: center; }
  .phone-glow { position: absolute; width: 380px; height: 380px; border-radius: 50%; background: radial-gradient(circle, rgba(230,57,70,.18), transparent 65%); top: 50%; left: 50%; transform: translate(-50%, -50%); }
  .phone { position: relative; width: 280px; height: 500px; border-radius: 46px; background: #0d0d10; padding: 12px; box-shadow: 0 50px 90px -40px rgba(22,22,26,.55), inset 0 0 0 2px #2a2a30; }
  .phone::before { content: ""; position: absolute; top: 22px; left: 50%; transform: translateX(-50%); width: 92px; height: 26px; border-radius: 20px; background: #0d0d10; z-index: 5; }
  .screen { position: relative; width: 100%; height: 100%; border-radius: 36px; overflow: hidden; background: var(--cream); }
  .app-top { height: 74px; padding: 34px 18px 0; display: flex; align-items: center; justify-content: space-between; background: #fff; border-bottom: 1px solid var(--gray-100); }
  .logo { display: flex; align-items: center; gap: 7px; font: 600 15px "Clash Display", sans-serif; }
  .logo i { width: 14px; height: 14px; border-radius: 50%; background: var(--red); display: block; }
  .app-top b { font-size: 10px; color: var(--gray-400); border: 1px solid var(--gray-200); border-radius: 980px; padding: 3px 8px; }

  .scene { position: absolute; inset: 74px 0 0; padding: 18px 16px; opacity: 0; transform: translateY(14px); transition: opacity .45s, transform .45s; pointer-events: none; }
  .scene.on { opacity: 1; transform: none; }
  .s-label { font-size: 9.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--gray-400); margin-bottom: 8px; }
  .card { background: #fff; border: 1px solid var(--gray-200); border-radius: 16px; padding: 12px; }

  /* scene 1: search */
  .field { display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border-radius: 12px; background: var(--gray-100); margin-bottom: 8px; }
  .field small { font-size: 8.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--gray-400); }
  .field span { font-size: 13px; font-weight: 800; min-height: 17px; }
  .typed { border-inline-end: 2px solid var(--red); padding-inline-end: 2px; white-space: nowrap; overflow: hidden; display: inline-block; width: 0; }
  .scene.on .typed { animation: type .9s steps(5) .35s forwards, caret .7s step-end 1.3s 3; }
  @keyframes type { to { width: 3.4em; } }
  @keyframes caret { 50% { border-color: transparent; } }
  .cal { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; margin: 10px 0 12px; }
  .cal span { font-size: 10px; text-align: center; padding: 6px 0; border-radius: 8px; color: var(--ink-2); font-weight: 600; }
  .cal .h { color: var(--gray-400); font-size: 8.5px; font-weight: 800; }
  .scene.on .cal .sel { animation: pick .3s ease forwards; }
  .cal .sel.a { animation-delay: 1.4s !important; } .cal .sel.b { animation-delay: 1.6s !important; } .cal .sel.c { animation-delay: 1.8s !important; }
  @keyframes pick { to { background: var(--ink); color: #fff; } }
  .cal .sel.b { border-radius: 0; }
  .btn { display: block; width: 100%; text-align: center; background: var(--red); color: #fff; border: 0; border-radius: 12px; padding: 12px; font: 800 13px inherit; }
  .scene.on .btn.press { animation: press .35s ease 2.6s; }
  @keyframes press { 50% { transform: scale(.96); background: var(--red-deep); } }

  /* scene 2: rooms */
  .hotel-img { height: 108px; border-radius: 14px; background:
      linear-gradient(160deg, rgba(22,22,26,0) 40%, rgba(22,22,26,.55)),
      linear-gradient(135deg, #d9b98f, #b9805a 45%, #6e4a3a); position: relative; margin-bottom: 10px; overflow: hidden; }
  .hotel-img::after { content: ""; position: absolute; inset: 0; background:
      repeating-linear-gradient(90deg, rgba(255,255,255,.18) 0 14px, transparent 14px 26px) 18px 30px / 140px 46px no-repeat,
      linear-gradient(#f4e2c8, #f4e2c8) 18px 22px / 140px 58px no-repeat; opacity: .55; }
  .hotel-img b { position: absolute; z-index: 1; bottom: 9px; inset-inline-start: 11px; color: #fff; font-size: 13px; }
  .hotel-img small { position: absolute; z-index: 1; top: 9px; inset-inline-end: 9px; background: rgba(255,255,255,.9); color: var(--teal); font-size: 9px; font-weight: 800; padding: 3px 7px; border-radius: 980px; }
  .rate { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 12px; border: 1.5px solid var(--gray-200); border-radius: 13px; background: #fff; margin-bottom: 8px; transition: all .3s; }
  .rate div { display: flex; flex-direction: column; gap: 2px; }
  .rate strong { font-size: 12px; } .rate small { font-size: 9.5px; color: var(--gray-400); font-weight: 600; }
  .rate em { font-style: normal; font-size: 13px; font-weight: 800; white-space: nowrap; }
  .scene.on .rate.pick { animation: chosen .4s ease 1.2s forwards; }
  @keyframes chosen { to { border-color: var(--ink); box-shadow: 0 0 0 3px rgba(22,22,26,.08); } }
  .chip-ok { display: inline-block; margin-top: 3px; font-size: 9px; font-weight: 800; color: var(--teal); }
  .total { display: flex; justify-content: space-between; align-items: baseline; margin: 10px 2px 10px; font-size: 11px; color: var(--gray-400); font-weight: 700; }
  .total b { font-size: 17px; color: var(--ink); }
  .scene.on .btn.press2 { animation: press .35s ease 2.4s; }

  /* scene 3: payment */
  .satim { display: flex; align-items: center; gap: 8px; font-size: 10.5px; font-weight: 800; color: var(--teal); margin-bottom: 12px; }
  .satim svg { width: 14px; height: 14px; }
  .cardviz { height: 120px; border-radius: 16px; padding: 14px; color: #fff; position: relative; background: linear-gradient(135deg, #1f6f4a, #0f3d2a); box-shadow: 0 18px 30px -18px rgba(15,61,42,.8); margin-bottom: 12px; overflow: hidden; }
  .cardviz::after { content: ""; position: absolute; width: 180px; height: 180px; border-radius: 50%; background: rgba(255,255,255,.07); right: -60px; top: -70px; }
  .cardviz .chip { width: 30px; height: 22px; border-radius: 5px; background: linear-gradient(135deg, #e8d18a, #b99a45); }
  .cardviz .num { margin-top: 18px; font: 600 14px "Courier New", monospace; letter-spacing: 2px; direction: ltr; }
  .cardviz .brand { position: absolute; bottom: 12px; inset-inline-end: 14px; font-size: 10px; font-weight: 800; letter-spacing: .06em; opacity: .9; }
  .dots i { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #fff; margin-inline-end: 3px; opacity: 0; }
  .scene.on .dots i { animation: dot .2s forwards; }
  .scene.on .dots i:nth-child(1){animation-delay:.6s}.scene.on .dots i:nth-child(2){animation-delay:.75s}.scene.on .dots i:nth-child(3){animation-delay:.9s}.scene.on .dots i:nth-child(4){animation-delay:1.05s}
  @keyframes dot { to { opacity: 1; } }
  .sms { display: flex; gap: 8px; align-items: center; background: #fff; border: 1px solid var(--gray-200); border-radius: 13px; padding: 9px 11px; margin-bottom: 12px; opacity: 0; transform: translateY(-6px); }
  .scene.on .sms { animation: drop .4s ease 1.5s forwards; }
  @keyframes drop { to { opacity: 1; transform: none; } }
  .sms i { width: 26px; height: 26px; border-radius: 8px; background: var(--gray-100); display: grid; place-items: center; font-style: normal; font-size: 13px; }
  .sms div { font-size: 10.5px; line-height: 1.35; } .sms b { display: block; font-size: 10px; color: var(--gray-400); }
  .otp { display: flex; gap: 6px; justify-content: center; margin-bottom: 12px; direction: ltr; }
  .otp span { width: 30px; height: 36px; border-radius: 9px; border: 1.5px solid var(--gray-200); background: #fff; display: grid; place-items: center; font-weight: 800; font-size: 14px; color: transparent; }
  .scene.on .otp span { animation: otp .2s forwards; }
  .scene.on .otp span:nth-child(1){animation-delay:2.0s}.scene.on .otp span:nth-child(2){animation-delay:2.15s}.scene.on .otp span:nth-child(3){animation-delay:2.3s}.scene.on .otp span:nth-child(4){animation-delay:2.45s}
  @keyframes otp { to { color: var(--ink); border-color: var(--ink); } }
  .scene.on .btn.press3 { animation: press .35s ease 2.9s; }

  /* scene 4: voucher */
  .done-badge { width: 54px; height: 54px; border-radius: 50%; background: var(--teal); color: #fff; display: grid; place-items: center; margin: 4px auto 10px; transform: scale(0); }
  .scene.on .done-badge { animation: pop .45s cubic-bezier(.2,1.6,.4,1) .2s forwards; }
  @keyframes pop { to { transform: scale(1); } }
  .done-badge svg { width: 26px; height: 26px; }
  .done-title { text-align: center; font: 600 17px "Clash Display", sans-serif; margin-bottom: 2px; }
  .hiw[dir="rtl"] .done-title { font-family: inherit; }
  .done-sub { text-align: center; font-size: 10.5px; color: var(--gray-400); font-weight: 600; margin-bottom: 12px; }
  .ticket { background: #fff; border: 1px solid var(--gray-200); border-radius: 16px; position: relative; overflow: hidden; }
  .ticket-top { padding: 12px; display: flex; justify-content: space-between; gap: 8px; }
  .ticket-top small { font-size: 8.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--gray-400); display: block; }
  .ticket-top b { font-size: 12.5px; letter-spacing: .04em; direction: ltr; display: inline-block; }
  .qr { width: 44px; height: 44px; border-radius: 6px; background:
      conic-gradient(var(--ink) 25%, transparent 0 50%, var(--ink) 0 75%, transparent 0) 0 0 / 11px 11px; opacity: .85; }
  .ticket-cut { height: 0; border-top: 2px dashed var(--gray-200); margin: 0 12px; position: relative; }
  .ticket-cut::before, .ticket-cut::after { content: ""; position: absolute; top: -9px; width: 16px; height: 16px; border-radius: 50%; background: var(--cream); border: 1px solid var(--gray-200); }
  .ticket-cut::before { left: -21px; } .ticket-cut::after { right: -21px; }
  .ticket-bot { padding: 10px 12px 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 10.5px; }
  .ticket-bot small { display: block; font-size: 8.5px; color: var(--gray-400); font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
  .ticket-bot b { font-size: 11.5px; }
  .notif { display: flex; gap: 9px; align-items: center; background: var(--ink); color: #fff; border-radius: 14px; padding: 10px 12px; margin-top: 10px; opacity: 0; transform: translateY(10px); }
  .scene.on .notif { animation: drop .4s ease 1.1s forwards; }
  .notif.n2 { background: #fff; color: var(--ink); border: 1px solid var(--gray-200); margin-top: 7px; }
  .scene.on .notif.n2 { animation-delay: 1.7s; }
  .notif i { width: 28px; height: 28px; border-radius: 9px; background: rgba(255,255,255,.14); display: grid; place-items: center; font-style: normal; font-size: 14px; flex-shrink: 0; }
  .notif.n2 i { background: var(--gray-100); }
  .notif div { font-size: 10.5px; line-height: 1.35; } .notif b { display: block; font-size: 11px; }

  /* footer strip */
  .alt { margin-top: 36px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
  .alt > div { background: #fff; border: 1px solid var(--gray-200); border-radius: var(--r-lg); padding: 16px 18px; display: flex; gap: 14px; align-items: flex-start; }
  .alt .ic { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; flex-shrink: 0; background: var(--gray-100); }
  .alt .ic svg { width: 20px; height: 20px; }
  .alt h4 { margin: 2px 0 4px; font-size: 15px; font-weight: 800; }
  .alt p { margin: 0; font-size: 13.5px; line-height: 1.55; color: var(--ink-2); }
  .alt a { color: var(--teal); font-weight: 800; text-decoration: none; }

  @media (max-width: 980px) {
    .hiw-grid { grid-template-columns: 1fr; gap: 24px; }
    .phone-wrap { order: -1; }
    .alt { grid-template-columns: 1fr; }
  }
  @media (max-width: 560px) {
    .hiw { padding: 44px 0 48px; }
    .hiw-wrap { padding: 0 18px; }
    .hiw-sub { margin-bottom: 20px; font-size: 15.5px; }
    .phone { transform: scale(.8); transform-origin: top center; margin-bottom: -100px; }
    .step { grid-template-columns: 40px 1fr; gap: 14px; padding: 10px 6px 10px 0; }
    .step-num { width: 40px; height: 40px; font-size: 15px; }
    .step-num svg { width: 48px; height: 48px; }
    .steps::before { inset-inline-start: 19px; }
    .step h3 { font-size: 17px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .scene, .step p, .step .tags { transition: none; }
    .scene.on * { animation-duration: .01ms !important; animation-delay: 0s !important; }
  }

      `}</style>
    </section>
  );
}
