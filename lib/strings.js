// =============================================================================
// Nzzor — Translation Dictionary
// Every UI string in English, French and Arabic.
// Arabic is a first draft (Modern Standard Arabic) — to be reviewed by a
// native speaker on the Allouni team before launch.
// Hotel content (names, descriptions) comes from the API/data, not from here.
// =============================================================================

export const STRINGS = {
  // ---- NAV ----
  "nav.hotels": { en: "Hotels", fr: "Hôtels", ar: "الفنادق" },
  "nav.destinations": { en: "Destinations", fr: "Destinations", ar: "الوجهات" },
  "nav.how": { en: "How it works", fr: "Comment ça marche", ar: "كيف تعمل" },
  "nav.about": { en: "About Allouni", fr: "À propos d'Allouni", ar: "عن علوني" },
  "nav.signin": { en: "Sign in", fr: "Se connecter", ar: "تسجيل الدخول" },
  "nav.menu_foot": {
    en: "Operated by Allouni Travel Agency · Licensed by the Algerian Ministry of Tourism",
    fr: "Exploité par Allouni Travel Agency · Agréé par le Ministère algérien du Tourisme",
    ar: "تُدار من طرف وكالة علوني للسياحة والأسفار · معتمدة من وزارة السياحة الجزائرية",
  },

  // ---- HERO ----
  "hero.badge": {
    en: "Licensed by the Algerian Ministry of Tourism",
    fr: "Agréé par le Ministère algérien du Tourisme",
    ar: "معتمدة من وزارة السياحة الجزائرية",
  },
  "hero.title1": { en: "Discover Algeria.", fr: "Découvrez l'Algérie.", ar: "اكتشف الجزائر." },
  "hero.title2": { en: "Booked in seconds.", fr: "Réservé en secondes.", ar: "احجز في ثوانٍ." },
  "hero.subtitle": {
    en: "Ten verified hotels, from the dunes of Djanet to the Mediterranean coast — with instant confirmation and Algerian payments.",
    fr: "Dix hôtels vérifiés, des dunes de Djanet à la côte méditerranéenne — avec confirmation instantanée et paiements algériens.",
    ar: "عشرة فنادق موثوقة، من كثبان جانت إلى الساحل المتوسطي — مع تأكيد فوري وطرق دفع جزائرية.",
  },
  "hero.foot1": { en: "Instant confirmation", fr: "Confirmation instantanée", ar: "تأكيد فوري" },
  "hero.foot2": { en: "CIB & Eddahabia", fr: "CIB et Eddahabia", ar: "CIB والذهبية" },
  "hero.foot3": { en: "24/7 WhatsApp support", fr: "Assistance WhatsApp 24/7", ar: "دعم واتساب على مدار الساعة" },

  // ---- SEARCH BAR ----
  "search.destination": { en: "Destination", fr: "Destination", ar: "الوجهة" },
  "search.destination_ph": { en: "Where to?", fr: "Où allez-vous ?", ar: "إلى أين؟" },
  "search.dates": { en: "Dates", fr: "Dates", ar: "التواريخ" },
  "search.dates_ph": { en: "Add dates", fr: "Ajouter des dates", ar: "أضف التواريخ" },
  "search.guests": { en: "Guests", fr: "Voyageurs", ar: "النزلاء" },
  "search.guest": { en: "guest", fr: "voyageur", ar: "نزيل" },
  "search.guests_plural": { en: "guests", fr: "voyageurs", ar: "نزلاء" },
  "search.search": { en: "Search", fr: "Rechercher", ar: "بحث" },
  "search.search_hotels": { en: "Search hotels", fr: "Rechercher des hôtels", ar: "ابحث عن الفنادق" },
  "search.choose_dest": { en: "Choose a destination", fr: "Choisissez une destination", ar: "اختر وجهة" },
  "search.how_many": { en: "How many guests?", fr: "Combien de voyageurs ?", ar: "كم عدد النزلاء؟" },
  "search.travelers": { en: "Travelers", fr: "Voyageurs", ar: "المسافرون" },
  "search.hotel": { en: "hotel", fr: "hôtel", ar: "فندق" },
  "search.hotels": { en: "hotels", fr: "hôtels", ar: "فنادق" },

  // ---- CALENDAR ----
  "cal.pick_checkin": { en: "Pick your check-in date", fr: "Choisissez votre date d'arrivée", ar: "اختر تاريخ الوصول" },
  "cal.pick_checkout": { en: "Now pick your check-out date", fr: "Choisissez maintenant votre date de départ", ar: "الآن اختر تاريخ المغادرة" },
  "cal.night": { en: "night", fr: "nuit", ar: "ليلة" },
  "cal.nights": { en: "nights", fr: "nuits", ar: "ليالٍ" },
  "cal.selected": { en: "selected", fr: "sélectionnée(s)", ar: "محددة" },

  // ---- TRUST BAR ----
  "trust.hotels": { en: "Verified hotels", fr: "Hôtels vérifiés", ar: "فنادق موثوقة" },
  "trust.cities": { en: "Cities across Algeria", fr: "Villes en Algérie", ar: "مدن عبر الجزائر" },
  "trust.toconfirm": { en: "To confirmed booking", fr: "Pour une réservation confirmée", ar: "حتى تأكيد الحجز" },
  "trust.rating": { en: "Average guest rating", fr: "Note moyenne des clients", ar: "متوسط تقييم النزلاء" },
  "trust.support": { en: "WhatsApp support", fr: "Assistance WhatsApp", ar: "دعم واتساب" },

  // ---- FEATURED SECTION ----
  "featured.kicker": { en: "The Collection", fr: "La Collection", ar: "المجموعة" },
  "featured.title": { en: "Hotels Algerians love", fr: "Les hôtels préférés des Algériens", ar: "فنادق يحبها الجزائريون" },
  "featured.subtitle": {
    en: "Hand-selected and verified by Allouni Travel Agency",
    fr: "Sélectionnés et vérifiés par Allouni Travel Agency",
    ar: "مختارة وموثقة من طرف وكالة علوني للسياحة والأسفار",
  },
  "featured.all": { en: "All 10 hotels", fr: "Les 10 hôtels", ar: "كل الفنادق العشرة" },

  // ---- WHY SECTION ----
  "why.kicker": { en: "Why Nzzor", fr: "Pourquoi Nzzor", ar: "لماذا نزور" },
  "why.title1": { en: "The trust of an agency,", fr: "La confiance d'une agence,", ar: "ثقة وكالة سياحية،" },
  "why.title2": { en: "the speed of an app", fr: "la rapidité d'une application", ar: "وسرعة تطبيق" },
  "why.allouni_t": { en: "Backed by Allouni", fr: "Soutenu par Allouni", ar: "مدعومة من علوني" },
  "why.allouni_d": {
    en: "A licensed Algerian travel agency authorized by the Ministry of Tourism. We're not a startup — we're an institution going digital.",
    fr: "Une agence de voyage algérienne agréée par le Ministère du Tourisme. Nous ne sommes pas une startup — nous sommes une institution qui se digitalise.",
    ar: "وكالة سياحة وأسفار جزائرية معتمدة من وزارة السياحة. نحن لسنا شركة ناشئة — نحن مؤسسة تتحول إلى الرقمنة.",
  },
  "why.instant_t": { en: "Instant confirmation", fr: "Confirmation instantanée", ar: "تأكيد فوري" },
  "why.instant_d": {
    en: "Confirmed in seconds. No waiting, no \"we'll call you back.\"",
    fr: "Confirmé en quelques secondes. Sans attente, sans « on vous rappelle ».",
    ar: "تأكيد في ثوانٍ. لا انتظار، ولا «سنتصل بك لاحقاً».",
  },
  "why.speed_d": {
    en: "Average time from search to a confirmed booking.",
    fr: "Temps moyen entre la recherche et une réservation confirmée.",
    ar: "متوسط الوقت من البحث إلى تأكيد الحجز.",
  },
  "why.pay_t": { en: "Pay your way — the Algerian way", fr: "Payez à votre façon — à l'algérienne", ar: "ادفع بطريقتك — بالطريقة الجزائرية" },
  "why.pay_d": {
    en: "CIB, Eddahabia, bank transfer, WhatsApp-assisted booking, or cash at the hotel. Every method Algerians actually use.",
    fr: "CIB, Eddahabia, virement bancaire, réservation assistée par WhatsApp, ou paiement en espèces à l'hôtel. Tous les moyens que les Algériens utilisent vraiment.",
    ar: "بطاقة CIB، الذهبية، التحويل البنكي، الحجز عبر واتساب، أو الدفع نقداً في الفندق. كل الطرق التي يستعملها الجزائريون فعلاً.",
  },
  "why.support_t": { en: "Real human support", fr: "Une assistance humaine", ar: "دعم بشري حقيقي" },
  "why.support_d": {
    en: "An Algerian team on WhatsApp +213, whenever you need them.",
    fr: "Une équipe algérienne sur WhatsApp +213, dès que vous en avez besoin.",
    ar: "فريق جزائري على واتساب 213+، متى احتجت إليه.",
  },

  // ---- ALLOUNI STRIP ----
  "allouni.title": {
    en: "Operated by Allouni Travel Agency",
    fr: "Exploité par Allouni Travel Agency",
    ar: "تُدار من طرف وكالة علوني للسياحة والأسفار",
  },
  "allouni.desc": {
    en: "A licensed travel agency authorized by the Algerian Ministry of Tourism — your booking is protected by a real, accountable institution.",
    fr: "Une agence de voyage agréée par le Ministère algérien du Tourisme — votre réservation est protégée par une institution réelle et responsable.",
    ar: "وكالة سياحة وأسفار معتمدة من وزارة السياحة الجزائرية — حجزك محمي من طرف مؤسسة حقيقية ومسؤولة.",
  },
  "allouni.badge1": { en: "Ministry licensed", fr: "Agréée par le Ministère", ar: "معتمدة من الوزارة" },
  "allouni.badge2": { en: "SATIM secured", fr: "Sécurisé par SATIM", ar: "مؤمّنة عبر ساتيم" },
  "allouni.badge3": { en: "Verified hotels", fr: "Hôtels vérifiés", ar: "فنادق موثوقة" },

  // ---- FOOTER ----
  "footer.tagline": {
    en: "Algeria's modern hotel booking platform. Built on the trust of a licensed travel agency, designed for the way Algerians travel today.",
    fr: "La plateforme moderne de réservation d'hôtels en Algérie. Bâtie sur la confiance d'une agence de voyage agréée, conçue pour la façon dont les Algériens voyagent aujourd'hui.",
    ar: "منصة حجز الفنادق العصرية في الجزائر. مبنية على ثقة وكالة سياحية معتمدة، ومصممة للطريقة التي يسافر بها الجزائريون اليوم.",
  },
  "footer.company": { en: "Company", fr: "Entreprise", ar: "الشركة" },
  "footer.support": { en: "Support", fr: "Assistance", ar: "الدعم" },
  "footer.legal": { en: "Legal", fr: "Mentions légales", ar: "قانوني" },
  "footer.about": { en: "About us", fr: "À propos", ar: "من نحن" },
  "footer.agency": { en: "Allouni Travel Agency", fr: "Allouni Travel Agency", ar: "وكالة علوني للسياحة والأسفار" },
  "footer.ourhotels": { en: "Our hotels", fr: "Nos hôtels", ar: "فنادقنا" },
  "footer.careers": { en: "Careers", fr: "Carrières", ar: "وظائف" },
  "footer.help": { en: "Help center", fr: "Centre d'aide", ar: "مركز المساعدة" },
  "footer.contact": { en: "Contact us", fr: "Nous contacter", ar: "اتصل بنا" },
  "footer.whatsapp": { en: "WhatsApp support", fr: "Assistance WhatsApp", ar: "دعم واتساب" },
  "footer.faq": { en: "FAQ", fr: "FAQ", ar: "الأسئلة الشائعة" },
  "footer.terms": { en: "Terms & conditions", fr: "Conditions générales", ar: "الشروط والأحكام" },
  "footer.privacy": { en: "Privacy policy", fr: "Politique de confidentialité", ar: "سياسة الخصوصية" },
  "footer.cancellation": { en: "Cancellation policy", fr: "Politique d'annulation", ar: "سياسة الإلغاء" },
  "footer.agrement": { en: "Ministry agrément", fr: "Agrément du Ministère", ar: "اعتماد الوزارة" },
  "footer.rights": {
    en: "© 2026 Allouni Travel Agency. All rights reserved.",
    fr: "© 2026 Allouni Travel Agency. Tous droits réservés.",
    ar: "© 2026 وكالة علوني للسياحة والأسفار. جميع الحقوق محفوظة.",
  },
  "footer.madein": {
    en: "Licensed by the Algerian Ministry of Tourism · Made in Algeria",
    fr: "Agréé par le Ministère algérien du Tourisme · Fait en Algérie",
    ar: "معتمدة من وزارة السياحة الجزائرية · صُنع في الجزائر",
  },

  // ---- SEARCH RESULTS ----
  "results.title": { en: "Hotels in Algeria", fr: "Hôtels en Algérie", ar: "فنادق في الجزائر" },
  "results.matching": { en: "Hotels matching", fr: "Hôtels correspondant à", ar: "فنادق مطابقة لـ" },
  "results.verified_by": {
    en: "verified by Allouni Travel Agency",
    fr: "vérifiés par Allouni Travel Agency",
    ar: "موثقة من طرف وكالة علوني للسياحة والأسفار",
  },
  "results.all_dest": { en: "All destinations", fr: "Toutes les destinations", ar: "كل الوجهات" },
  "results.any": { en: "Any", fr: "Tous", ar: "الكل" },
  "results.popular": { en: "Most popular", fr: "Plus populaires", ar: "الأكثر رواجاً" },
  "results.price_low": { en: "Lowest price", fr: "Prix le plus bas", ar: "الأقل سعراً" },
  "results.price_high": { en: "Highest price", fr: "Prix le plus élevé", ar: "الأعلى سعراً" },
  "results.top_rated": { en: "Top rated", fr: "Les mieux notés", ar: "الأعلى تقييماً" },
  "results.none_title": { en: "No hotels match your filters", fr: "Aucun hôtel ne correspond à vos filtres", ar: "لا توجد فنادق مطابقة لمرشحاتك" },
  "results.none_sub": {
    en: "Try widening your search or clearing filters.",
    fr: "Essayez d'élargir votre recherche ou de réinitialiser les filtres.",
    ar: "حاول توسيع بحثك أو إعادة ضبط المرشحات.",
  },

  // ---- HOTEL CARD ----
  "card.instant": { en: "Instant confirmation", fr: "Confirmation instantanée", ar: "تأكيد فوري" },
  "card.book": { en: "Book now", fr: "Réserver", ar: "احجز الآن" },
  "card.per_night": { en: "DZD / night", fr: "DZD / nuit", ar: "دج / ليلة" },

  // ---- HOTEL DETAIL ----
  "detail.home": { en: "Home", fr: "Accueil", ar: "الرئيسية" },
  "detail.verified": { en: "Verified by Allouni", fr: "Vérifié par Allouni", ar: "موثّق من علوني" },
  "detail.instant": { en: "Instant confirmation", fr: "Confirmation instantanée", ar: "تأكيد فوري" },
  "detail.reviews": { en: "reviews", fr: "avis", ar: "تقييم" },
  "detail.about": { en: "About this hotel", fr: "À propos de cet hôtel", ar: "عن هذا الفندق" },
  "detail.choose_room": { en: "Choose your room", fr: "Choisissez votre chambre", ar: "اختر غرفتك" },
  "detail.guests": { en: "guests", fr: "voyageurs", ar: "نزلاء" },
  "detail.free_cancel": { en: "Free cancellation", fr: "Annulation gratuite", ar: "إلغاء مجاني" },
  "detail.breakfast": { en: "Breakfast included", fr: "Petit-déjeuner inclus", ar: "الفطور مشمول" },
  "detail.select": { en: "Select", fr: "Choisir", ar: "اختيار" },
  "detail.selected": { en: "Selected", fr: "Choisie", ar: "مختارة" },
  "detail.offers": { en: "What this place offers", fr: "Ce que propose cet établissement", ar: "ما يقدمه هذا المكان" },
  "detail.policies": { en: "Hotel policies", fr: "Conditions de l'hôtel", ar: "سياسات الفندق" },
  "detail.checkin": { en: "Check-in", fr: "Arrivée", ar: "تسجيل الوصول" },
  "detail.checkout": { en: "Check-out", fr: "Départ", ar: "تسجيل المغادرة" },
  "detail.from": { en: "From", fr: "À partir de", ar: "ابتداءً من" },
  "detail.until": { en: "Until", fr: "Jusqu'à", ar: "حتى" },
  "detail.cancellation": { en: "Cancellation", fr: "Annulation", ar: "الإلغاء" },
  "detail.cancel_free": { en: "Free up to", fr: "Gratuite jusqu'à", ar: "مجاني حتى" },
  "detail.before_arrival": { en: "before arrival", fr: "avant l'arrivée", ar: "قبل الوصول" },
  "detail.children": { en: "Children", fr: "Enfants", ar: "الأطفال" },
  "detail.children_ok": { en: "All ages welcome", fr: "Tous âges bienvenus", ar: "كل الأعمار مرحب بها" },
  "detail.children_no": { en: "Not suitable for children", fr: "Non adapté aux enfants", ar: "غير مناسب للأطفال" },
  "detail.pets": { en: "Pets", fr: "Animaux", ar: "الحيوانات الأليفة" },
  "detail.pets_ok": { en: "Pets allowed", fr: "Animaux acceptés", ar: "الحيوانات الأليفة مسموحة" },
  "detail.pets_no": { en: "Not allowed", fr: "Non acceptés", ar: "غير مسموحة" },
  "detail.parking": { en: "Parking", fr: "Parking", ar: "موقف السيارات" },
  "detail.parking_free": { en: "Free on-site parking", fr: "Parking gratuit sur place", ar: "موقف سيارات مجاني في الموقع" },
  "detail.parking_paid": { en: "Paid parking", fr: "Parking payant", ar: "موقف سيارات مدفوع" },
  "detail.widget_head": {
    en: "Instant confirmation — confirmed in seconds",
    fr: "Confirmation instantanée — confirmée en quelques secondes",
    ar: "تأكيد فوري — مؤكد في ثوانٍ",
  },
  "detail.per_night": { en: "DZD / night", fr: "DZD / nuit", ar: "دج / ليلة" },
  "detail.selected_room": { en: "Selected room", fr: "Chambre choisie", ar: "الغرفة المختارة" },
  "detail.taxes": { en: "Taxes & fees", fr: "Taxes et frais", ar: "الضرائب والرسوم" },
  "detail.included": { en: "Included", fr: "Inclus", ar: "مشمولة" },
  "detail.total": { en: "Total", fr: "Total", ar: "المجموع" },
  "detail.reserve": { en: "Reserve now", fr: "Réserver maintenant", ar: "احجز الآن" },
  "detail.reassure": {
    en: "Free cancellation · You won't be charged yet",
    fr: "Annulation gratuite · Vous ne serez pas encore débité",
    ar: "إلغاء مجاني · لن يتم خصم أي مبلغ بعد",
  },
  "detail.wa_title": { en: "Prefer to book by WhatsApp?", fr: "Vous préférez réserver par WhatsApp ?", ar: "تفضّل الحجز عبر واتساب؟" },
  "detail.wa_sub": { en: "Our Algerian team will help you", fr: "Notre équipe algérienne vous aidera", ar: "فريقنا الجزائري سيساعدك" },
  "detail.secured": {
    en: "Secured by SATIM · Operated by Allouni Travel Agency, licensed by the Ministry of Tourism",
    fr: "Sécurisé par SATIM · Exploité par Allouni Travel Agency, agréé par le Ministère du Tourisme",
    ar: "مؤمّن عبر ساتيم · تُدار من طرف وكالة علوني للسياحة والأسفار، معتمدة من وزارة السياحة",
  },

  // ---- RATING LABELS ----
  "rate.exceptional": { en: "Exceptional", fr: "Exceptionnel", ar: "استثنائي" },
  "rate.excellent": { en: "Excellent", fr: "Excellent", ar: "ممتاز" },
  "rate.verygood": { en: "Very good", fr: "Très bien", ar: "جيد جداً" },
  "rate.good": { en: "Good", fr: "Bien", ar: "جيد" },
  "rate.pleasant": { en: "Pleasant", fr: "Agréable", ar: "لطيف" },

  // ---- WHATSAPP BUTTON ----
  "wa.chat": { en: "Chat with us", fr: "Discutez avec nous", ar: "تحدّث معنا" },

  // ---- AI / NATURAL-LANGUAGE SEARCH ----
  "ai.toggle": {
    en: "Try searching in your own words",
    fr: "Essayez de chercher avec vos propres mots",
    ar: "جرّب البحث بكلماتك الخاصة",
  },
  "ai.beta": { en: "Beta", fr: "Bêta", ar: "تجريبي" },
  "ai.placeholder": {
    en: "e.g. a cheap hotel in Oran, or a luxury 5-star in Algiers",
    fr: "ex. un hôtel pas cher à Oran, ou un 5 étoiles de luxe à Alger",
    ar: "مثال: فندق رخيص في وهران، أو فندق فاخر 5 نجوم في الجزائر",
  },
  "ai.search": { en: "Search", fr: "Rechercher", ar: "بحث" },
  "ai.understood": { en: "We searched for:", fr: "Nous avons recherché :", ar: "بحثنا عن:" },
  "ai.not_understood": {
    en: "We couldn't quite understand that — showing all hotels. Try mentioning a city, a price, or a star rating.",
    fr: "Nous n'avons pas bien compris — voici tous les hôtels. Essayez de mentionner une ville, un prix ou un nombre d'étoiles.",
    ar: "لم نفهم طلبك تماماً — نعرض جميع الفنادق. حاول ذكر مدينة أو سعر أو تصنيف نجوم.",
  },
  "ai.cheap": { en: "budget-friendly", fr: "prix abordable", ar: "سعر مناسب" },
  "ai.luxury": { en: "luxury", fr: "luxe", ar: "فاخر" },
  "ai.stars_label": { en: "-star and above", fr: " étoiles et plus", ar: " نجوم فأكثر" },
};
