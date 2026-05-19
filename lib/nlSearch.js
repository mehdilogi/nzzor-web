// =============================================================================
// Nzzor — Natural-Language Search Parser  (Phase A)
//
// 100% Nzzor-built. Runs locally, no external API, no AI service.
// Converts a free-text query in English / French / Arabic into a structured
// filter: { city, maxPrice, minPrice, minStars }.
//
// Phase A scope: cities, price intent, star rating. Location tags
// ("near downtown", "family friendly") arrive in Phase B once the hotel
// data carries those fields.
// =============================================================================

// --- City vocabulary: every spelling/language a user might type ---------------
const CITY_TERMS = {
  Algiers:     ["algiers", "alger", "algier", "الجزائر", "الجزائر العاصمة", "العاصمة", "dzayer"],
  Oran:        ["oran", "وهران", "wahran"],
  Constantine: ["constantine", "قسنطينة", "قسطنطينة", "ksentina"],
  Djanet:      ["djanet", "جانت"],
  Ghardaia:    ["ghardaia", "ghardaïa", "غرداية"],
  Bejaia:      ["bejaia", "béjaïa", "bejaïa", "بجاية"],
  Tipaza:      ["tipaza", "tipasa", "تيبازة", "تيبازا"],
  Batna:       ["batna", "باتنة"],
};

// --- Price intent: words that signal cheap vs. luxury -------------------------
const CHEAP_TERMS = [
  // en
  "cheap", "budget", "affordable", "inexpensive", "low cost", "economical", "low price",
  // fr
  "pas cher", "bon marché", "économique", "abordable", "petit prix", "moins cher",
  // ar
  "رخيص", "رخيصة", "اقتصادي", "اقتصادية", "بسعر منخفض", "غير مكلف", "في المتناول",
];
const LUXURY_TERMS = [
  // en
  "luxury", "luxurious", "5 star", "five star", "premium", "high end", "best", "top",
  // fr
  "luxe", "luxueux", "5 étoiles", "cinq étoiles", "haut de gamme", "prestige", "meilleur",
  // ar
  "فاخر", "فاخرة", "فخم", "فخمة", "خمس نجوم", "5 نجوم", "راقي", "راقية", "أفضل",
];

// price bands in DZD — tuned to the current catalogue (12k–35k)
const CHEAP_MAX = 18000;
const LUXURY_MIN = 28000;

// --- Star rating: explicit "N star" mentions ----------------------------------
// matches "4 star", "4 étoiles", "4 نجوم", "★★★★"
const STAR_PATTERNS = [
  { re: /\b([3-5])\s*(?:[-\s]?star|stars|étoile|étoiles|نجوم|نجمة)\b/i, group: 1 },
];

// --- helpers ------------------------------------------------------------------
function normalize(text) {
  return ` ${String(text || "").toLowerCase().trim()} `;
}

function findCity(haystack) {
  // longest term first so "الجزائر العاصمة" beats "الجزائر"
  let best = null;
  let bestLen = 0;
  for (const [city, terms] of Object.entries(CITY_TERMS)) {
    for (const term of terms) {
      if (haystack.includes(` ${term} `) || haystack.includes(`${term} `) || haystack.includes(` ${term}`)) {
        if (term.length > bestLen) {
          best = city;
          bestLen = term.length;
        }
      }
    }
  }
  return best;
}

function containsAny(haystack, terms) {
  return terms.some((t) => haystack.includes(t));
}

// --- main parser --------------------------------------------------------------
// Returns { filter, understood, matched } where:
//   filter    — { city?, maxPrice?, minPrice?, minStars? }
//   understood — true if we extracted at least one meaningful constraint
//   matched   — human-readable list of what we understood (for the UI)
export function parseQuery(rawQuery) {
  const haystack = normalize(rawQuery);
  const filter = {};
  const matched = [];

  // city
  const city = findCity(haystack);
  if (city) {
    filter.city = city;
    matched.push({ type: "city", value: city });
  }

  // explicit star rating
  for (const { re, group } of STAR_PATTERNS) {
    const m = haystack.match(re);
    if (m) {
      filter.minStars = Number(m[group]);
      matched.push({ type: "stars", value: filter.minStars });
      break;
    }
  }

  // price intent
  if (containsAny(haystack, CHEAP_TERMS)) {
    filter.maxPrice = CHEAP_MAX;
    matched.push({ type: "price", value: "cheap" });
  } else if (containsAny(haystack, LUXURY_TERMS)) {
    filter.minPrice = LUXURY_MIN;
    matched.push({ type: "price", value: "luxury" });
    // "luxury" with no explicit stars implies 5-star intent
    if (!filter.minStars) filter.minStars = 5;
  }

  return {
    filter,
    understood: matched.length > 0,
    matched,
  };
}
