// =============================================================================
// Nzzor — Translation Dictionary
// Every UI string in English and French. Add new keys here as the site grows.
// Hotel content (names, descriptions) comes from the API/data, not from here.
// =============================================================================

export const STRINGS = {
  // ---- NAV ----
  "nav.hotels": { en: "Hotels", fr: "Hôtels" },
  "nav.destinations": { en: "Destinations", fr: "Destinations" },
  "nav.how": { en: "How it works", fr: "Comment ça marche" },
  "nav.about": { en: "About Allouni", fr: "À propos d'Allouni" },
  "nav.signin": { en: "Sign in", fr: "Se connecter" },
  "nav.menu_foot": {
    en: "Operated by Allouni Travel Agency · Licensed by the Algerian Ministry of Tourism",
    fr: "Exploité par Allouni Travel Agency · Agréé par le Ministère algérien du Tourisme",
  },

  // ---- HERO ----
  "hero.badge": {
    en: "Licensed by the Algerian Ministry of Tourism",
    fr: "Agréé par le Ministère algérien du Tourisme",
  },
  "hero.title1": { en: "Discover Algeria.", fr: "Découvrez l'Algérie." },
  "hero.title2": { en: "Booked in seconds.", fr: "Réservé en secondes." },
  "hero.subtitle": {
    en: "Ten verified hotels, from the dunes of Djanet to the Mediterranean coast — with instant confirmation and Algerian payments.",
    fr: "Dix hôtels vérifiés, des dunes de Djanet à la côte méditerranéenne — avec confirmation instantanée et paiements algériens.",
  },
  "hero.foot1": { en: "Instant confirmation", fr: "Confirmation instantanée" },
  "hero.foot2": { en: "CIB & Eddahabia", fr: "CIB et Eddahabia" },
  "hero.foot3": { en: "24/7 WhatsApp support", fr: "Assistance WhatsApp 24/7" },

  // ---- SEARCH BAR ----
  "search.destination": { en: "Destination", fr: "Destination" },
  "search.destination_ph": { en: "Where to?", fr: "Où allez-vous ?" },
  "search.dates": { en: "Dates", fr: "Dates" },
  "search.dates_ph": { en: "Add dates", fr: "Ajouter des dates" },
  "search.guests": { en: "Guests", fr: "Voyageurs" },
  "search.guest": { en: "guest", fr: "voyageur" },
  "search.guests_plural": { en: "guests", fr: "voyageurs" },
  "search.search": { en: "Search", fr: "Rechercher" },
  "search.search_hotels": { en: "Search hotels", fr: "Rechercher des hôtels" },
  "search.choose_dest": { en: "Choose a destination", fr: "Choisissez une destination" },
  "search.how_many": { en: "How many guests?", fr: "Combien de voyageurs ?" },
  "search.travelers": { en: "Travelers", fr: "Voyageurs" },
  "search.hotel": { en: "hotel", fr: "hôtel" },
  "search.hotels": { en: "hotels", fr: "hôtels" },

  // ---- CALENDAR ----
  "cal.pick_checkin": { en: "Pick your check-in date", fr: "Choisissez votre date d'arrivée" },
  "cal.pick_checkout": { en: "Now pick your check-out date", fr: "Choisissez maintenant votre date de départ" },
  "cal.night": { en: "night", fr: "nuit" },
  "cal.nights": { en: "nights", fr: "nuits" },
  "cal.selected": { en: "selected", fr: "sélectionnée(s)" },

  // ---- TRUST BAR ----
  "trust.hotels": { en: "Verified hotels", fr: "Hôtels vérifiés" },
  "trust.cities": { en: "Cities across Algeria", fr: "Villes en Algérie" },
  "trust.toconfirm": { en: "To confirmed booking", fr: "Pour une réservation confirmée" },
  "trust.rating": { en: "Average guest rating", fr: "Note moyenne des clients" },
  "trust.support": { en: "WhatsApp support", fr: "Assistance WhatsApp" },

  // ---- FEATURED SECTION ----
  "featured.kicker": { en: "The Collection", fr: "La Collection" },
  "featured.title": { en: "Hotels Algerians love", fr: "Les hôtels préférés des Algériens" },
  "featured.subtitle": {
    en: "Hand-selected and verified by Allouni Travel Agency",
    fr: "Sélectionnés et vérifiés par Allouni Travel Agency",
  },
  "featured.all": { en: "All 10 hotels", fr: "Les 10 hôtels" },

  // ---- WHY SECTION ----
  "why.kicker": { en: "Why Nzzor", fr: "Pourquoi Nzzor" },
  "why.title1": { en: "The trust of an agency,", fr: "La confiance d'une agence," },
  "why.title2": { en: "the speed of an app", fr: "la rapidité d'une application" },
  "why.allouni_t": { en: "Backed by Allouni", fr: "Soutenu par Allouni" },
  "why.allouni_d": {
    en: "A licensed Algerian travel agency authorized by the Ministry of Tourism. We're not a startup — we're an institution going digital.",
    fr: "Une agence de voyage algérienne agréée par le Ministère du Tourisme. Nous ne sommes pas une startup — nous sommes une institution qui se digitalise.",
  },
  "why.instant_t": { en: "Instant confirmation", fr: "Confirmation instantanée" },
  "why.instant_d": {
    en: "Confirmed in seconds. No waiting, no \"we'll call you back.\"",
    fr: "Confirmé en quelques secondes. Sans attente, sans « on vous rappelle ».",
  },
  "why.speed_d": {
    en: "Average time from search to a confirmed booking.",
    fr: "Temps moyen entre la recherche et une réservation confirmée.",
  },
  "why.pay_t": { en: "Pay your way — the Algerian way", fr: "Payez à votre façon — à l'algérienne" },
  "why.pay_d": {
    en: "CIB, Eddahabia, bank transfer, WhatsApp-assisted booking, or cash at the hotel. Every method Algerians actually use.",
    fr: "CIB, Eddahabia, virement bancaire, réservation assistée par WhatsApp, ou paiement en espèces à l'hôtel. Tous les moyens que les Algériens utilisent vraiment.",
  },
  "why.support_t": { en: "Real human support", fr: "Une assistance humaine" },
  "why.support_d": {
    en: "An Algerian team on WhatsApp +213, whenever you need them.",
    fr: "Une équipe algérienne sur WhatsApp +213, dès que vous en avez besoin.",
  },

  // ---- ALLOUNI STRIP ----
  "allouni.title": {
    en: "Operated by Allouni Travel Agency",
    fr: "Exploité par Allouni Travel Agency",
  },
  "allouni.desc": {
    en: "A licensed travel agency authorized by the Algerian Ministry of Tourism — your booking is protected by a real, accountable institution.",
    fr: "Une agence de voyage agréée par le Ministère algérien du Tourisme — votre réservation est protégée par une institution réelle et responsable.",
  },
  "allouni.badge1": { en: "Ministry licensed", fr: "Agréée par le Ministère" },
  "allouni.badge2": { en: "SATIM secured", fr: "Sécurisé par SATIM" },
  "allouni.badge3": { en: "Verified hotels", fr: "Hôtels vérifiés" },

  // ---- FOOTER ----
  "footer.tagline": {
    en: "Algeria's modern hotel booking platform. Built on the trust of a licensed travel agency, designed for the way Algerians travel today.",
    fr: "La plateforme moderne de réservation d'hôtels en Algérie. Bâtie sur la confiance d'une agence de voyage agréée, conçue pour la façon dont les Algériens voyagent aujourd'hui.",
  },
  "footer.company": { en: "Company", fr: "Entreprise" },
  "footer.support": { en: "Support", fr: "Assistance" },
  "footer.legal": { en: "Legal", fr: "Mentions légales" },
  "footer.about": { en: "About us", fr: "À propos" },
  "footer.agency": { en: "Allouni Travel Agency", fr: "Allouni Travel Agency" },
  "footer.ourhotels": { en: "Our hotels", fr: "Nos hôtels" },
  "footer.careers": { en: "Careers", fr: "Carrières" },
  "footer.help": { en: "Help center", fr: "Centre d'aide" },
  "footer.contact": { en: "Contact us", fr: "Nous contacter" },
  "footer.whatsapp": { en: "WhatsApp support", fr: "Assistance WhatsApp" },
  "footer.faq": { en: "FAQ", fr: "FAQ" },
  "footer.terms": { en: "Terms & conditions", fr: "Conditions générales" },
  "footer.privacy": { en: "Privacy policy", fr: "Politique de confidentialité" },
  "footer.cancellation": { en: "Cancellation policy", fr: "Politique d'annulation" },
  "footer.agrement": { en: "Ministry agrément", fr: "Agrément du Ministère" },
  "footer.rights": {
    en: "© 2026 Allouni Travel Agency. All rights reserved.",
    fr: "© 2026 Allouni Travel Agency. Tous droits réservés.",
  },
  "footer.madein": {
    en: "Licensed by the Algerian Ministry of Tourism · Made in Algeria",
    fr: "Agréé par le Ministère algérien du Tourisme · Fait en Algérie",
  },

  // ---- SEARCH RESULTS ----
  "results.title": { en: "Hotels in Algeria", fr: "Hôtels en Algérie" },
  "results.matching": { en: "Hotels matching", fr: "Hôtels correspondant à" },
  "results.verified_by": {
    en: "verified by Allouni Travel Agency",
    fr: "vérifiés par Allouni Travel Agency",
  },
  "results.all_dest": { en: "All destinations", fr: "Toutes les destinations" },
  "results.any": { en: "Any", fr: "Tous" },
  "results.popular": { en: "Most popular", fr: "Plus populaires" },
  "results.price_low": { en: "Lowest price", fr: "Prix le plus bas" },
  "results.price_high": { en: "Highest price", fr: "Prix le plus élevé" },
  "results.top_rated": { en: "Top rated", fr: "Les mieux notés" },
  "results.none_title": { en: "No hotels match your filters", fr: "Aucun hôtel ne correspond à vos filtres" },
  "results.none_sub": {
    en: "Try widening your search or clearing filters.",
    fr: "Essayez d'élargir votre recherche ou de réinitialiser les filtres.",
  },

  // ---- HOTEL CARD ----
  "card.instant": { en: "Instant confirmation", fr: "Confirmation instantanée" },
  "card.book": { en: "Book now", fr: "Réserver" },
  "card.per_night": { en: "DZD / night", fr: "DZD / nuit" },

  // ---- HOTEL DETAIL ----
  "detail.home": { en: "Home", fr: "Accueil" },
  "detail.verified": { en: "Verified by Allouni", fr: "Vérifié par Allouni" },
  "detail.instant": { en: "Instant confirmation", fr: "Confirmation instantanée" },
  "detail.reviews": { en: "reviews", fr: "avis" },
  "detail.about": { en: "About this hotel", fr: "À propos de cet hôtel" },
  "detail.choose_room": { en: "Choose your room", fr: "Choisissez votre chambre" },
  "detail.guests": { en: "guests", fr: "voyageurs" },
  "detail.free_cancel": { en: "Free cancellation", fr: "Annulation gratuite" },
  "detail.breakfast": { en: "Breakfast included", fr: "Petit-déjeuner inclus" },
  "detail.select": { en: "Select", fr: "Choisir" },
  "detail.selected": { en: "Selected", fr: "Choisie" },
  "detail.offers": { en: "What this place offers", fr: "Ce que propose cet établissement" },
  "detail.policies": { en: "Hotel policies", fr: "Conditions de l'hôtel" },
  "detail.checkin": { en: "Check-in", fr: "Arrivée" },
  "detail.checkout": { en: "Check-out", fr: "Départ" },
  "detail.from": { en: "From", fr: "À partir de" },
  "detail.until": { en: "Until", fr: "Jusqu'à" },
  "detail.cancellation": { en: "Cancellation", fr: "Annulation" },
  "detail.cancel_free": { en: "Free up to", fr: "Gratuite jusqu'à" },
  "detail.before_arrival": { en: "before arrival", fr: "avant l'arrivée" },
  "detail.children": { en: "Children", fr: "Enfants" },
  "detail.children_ok": { en: "All ages welcome", fr: "Tous âges bienvenus" },
  "detail.children_no": { en: "Not suitable for children", fr: "Non adapté aux enfants" },
  "detail.pets": { en: "Pets", fr: "Animaux" },
  "detail.pets_ok": { en: "Pets allowed", fr: "Animaux acceptés" },
  "detail.pets_no": { en: "Not allowed", fr: "Non acceptés" },
  "detail.parking": { en: "Parking", fr: "Parking" },
  "detail.parking_free": { en: "Free on-site parking", fr: "Parking gratuit sur place" },
  "detail.parking_paid": { en: "Paid parking", fr: "Parking payant" },
  "detail.widget_head": {
    en: "Instant confirmation — confirmed in seconds",
    fr: "Confirmation instantanée — confirmée en quelques secondes",
  },
  "detail.per_night": { en: "DZD / night", fr: "DZD / nuit" },
  "detail.selected_room": { en: "Selected room", fr: "Chambre choisie" },
  "detail.taxes": { en: "Taxes & fees", fr: "Taxes et frais" },
  "detail.included": { en: "Included", fr: "Inclus" },
  "detail.total": { en: "Total", fr: "Total" },
  "detail.reserve": { en: "Reserve now", fr: "Réserver maintenant" },
  "detail.reassure": {
    en: "Free cancellation · You won't be charged yet",
    fr: "Annulation gratuite · Vous ne serez pas encore débité",
  },
  "detail.wa_title": { en: "Prefer to book by WhatsApp?", fr: "Vous préférez réserver par WhatsApp ?" },
  "detail.wa_sub": { en: "Our Algerian team will help you", fr: "Notre équipe algérienne vous aidera" },
  "detail.secured": {
    en: "Secured by SATIM · Operated by Allouni Travel Agency, licensed by the Ministry of Tourism",
    fr: "Sécurisé par SATIM · Exploité par Allouni Travel Agency, agréé par le Ministère du Tourisme",
  },

  // ---- RATING LABELS ----
  "rate.exceptional": { en: "Exceptional", fr: "Exceptionnel" },
  "rate.excellent": { en: "Excellent", fr: "Excellent" },
  "rate.verygood": { en: "Very good", fr: "Très bien" },
  "rate.good": { en: "Good", fr: "Bien" },
  "rate.pleasant": { en: "Pleasant", fr: "Agréable" },

  // ---- WHATSAPP BUTTON ----
  "wa.chat": { en: "Chat with us", fr: "Discutez avec nous" },
};
