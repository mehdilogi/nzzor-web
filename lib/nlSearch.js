// =============================================================================
// Nzzor — Natural-Language Search Parser  (Phase B)
//
// 100% Nzzor-built. Runs locally, no external API, no AI service.
// Converts a free-text query in English / French / Arabic into a structured
// filter: { city, maxPrice, minPrice, minStars, tags[] }.
//
// Phase B scope: cities, price intent, star rating, AND tag intent (beach,
// family, sea view, business, romantic, sahara, city center, etc.).
// =============================================================================

// --- City vocabulary: every spelling/language a user might type ---------------
// Built from the canonical 58-wilaya list. Each wilaya contributes its
// display name as the dictionary key, and its alias list (EN / FR / AR
// spellings + common transliterations) as the matchable terms.
//
// Adding/renaming wilayas is now a single-edit: update WILAYAS in
// lib/wilayas.js and both the AI parser and the homepage picker pick it up.
import { WILAYAS } from "./wilayas";

const CITY_TERMS = Object.fromEntries(
  WILAYAS.map((w) => [w.name, w.aliases])
);

// --- Tag aliases: phrases that signal each tag --------------------------------
// Mirrors src/utils/tags.js in the API. Add/remove tags here when changing
// the canonical list. Order matters for the multi-word matches: longer phrases
// should come first to win against short substrings.
const TAG_ALIASES = {
  // Order: most specific first, then single-word fallbacks
  city_center: ["city center", "city centre", "downtown", "centre-ville", "centre ville", "وسط المدينة", "وسط البلد"],
  sea_view:    ["sea view", "ocean view", "vue mer", "vue sur mer", "إطلالة على البحر", "إطلالة بحرية"],
  garden_view: ["garden view", "vue jardin", "vue sur jardin", "إطلالة على الحديقة"],
  breakfast_included: ["breakfast included", "with breakfast", "petit-déjeuner", "petit dejeuner", "إفطار", "فطور"],
  family:      ["family friendly", "family-friendly", "for family", "with kids", "with children", "familial", "en famille", "avec enfants", "عائلي", "للعائلة"],
  romantic:    ["romantic", "honeymoon", "couple getaway", "romantique", "lune de miel", "رومانسي", "شهر العسل"],
  beach:       ["beach", "seaside", "by the sea", "plage", "bord de mer", "au bord de mer", "شاطئ"],
  sahara:      ["sahara", "desert", "dunes", "dune", "désert", "صحراء", "كثبان"],
  mountain:    ["mountain", "mountains", "montagne", "montagnes", "جبل", "جبال"],
  city:        ["urban", "ville", "urbain", "حضري", "مدينة"], // "city" alone is too generic — left out
  business:    ["for business", "business trip", "affaires", "professionnel", "أعمال", "للعمل"],
  historic:    ["historic", "historical", "heritage", "old town", "historique", "patrimoine", "تاريخي", "تراث"],
  pool:        ["with pool", "swimming pool", "piscine", "حمام سباحة", "مسبح"],
  spa:         ["spa", "wellness", "hammam", "منتجع صحي"],
  // "luxury" is handled by the price-intent block below, not as a tag
};

// --- Price intent: words that signal cheap vs. luxury -------------------------
const CHEAP_TERMS = [
  "cheap", "budget", "affordable", "inexpensive", "low cost", "economical", "low price",
  "pas cher", "bon marché", "économique", "abordable", "petit prix", "moins cher",
  "رخيص", "رخيصة", "اقتصادي", "اقتصادية", "بسعر منخفض", "غير مكلف", "في المتناول",
];
const LUXURY_TERMS = [
  "luxury", "luxurious", "5 star", "five star", "premium", "high end", "best", "top",
  "luxe", "luxueux", "5 étoiles", "cinq étoiles", "haut de gamme", "prestige", "meilleur",
  "فاخر", "فاخرة", "فخم", "فخمة", "خمس نجوم", "5 نجوم", "راقي", "راقية", "أفضل",
];

// price bands in DZD — tuned to the current catalogue (12k–35k)
const CHEAP_MAX = 18000;
const LUXURY_MIN = 28000;

// --- Star rating: explicit "N star" mentions ----------------------------------
const STAR_PATTERNS = [
  { re: /\b([3-5])\s*(?:[-\s]?star|stars|étoile|étoiles|نجوم|نجمة)\b/i, group: 1 },
];

// --- helpers ------------------------------------------------------------------
function normalize(text) {
  return ` ${String(text || "").toLowerCase().trim()} `;
}

function findCity(haystack) {
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

// scan haystack for tag aliases; returns array of tag keys (deduplicated)
function findTags(haystack) {
  const found = new Set();
  for (const [tagKey, aliases] of Object.entries(TAG_ALIASES)) {
    for (const alias of aliases) {
      if (haystack.includes(alias)) {
        found.add(tagKey);
        break; // one hit per tag is enough
      }
    }
  }
  return Array.from(found);
}

// --- main parser --------------------------------------------------------------
// Returns { filter, understood, matched } where:
//   filter    — { city?, maxPrice?, minPrice?, minStars?, tags? }
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
    if (!filter.minStars) filter.minStars = 5;
  }

  // tags (Phase B)
  const tags = findTags(haystack);
  if (tags.length) {
    filter.tags = tags;
    for (const t of tags) matched.push({ type: "tag", value: t });
  }

  return {
    filter,
    understood: matched.length > 0,
    matched,
  };
}
