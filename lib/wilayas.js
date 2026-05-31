// Canonical 58 Algerian wilayas (post-2019 reform).
// Used to build both MOCK_CITIES (homepage picker) and CITY_TERMS (NL search aliases).
//
// Each entry:
//   num     — wilaya number (01–58), used for sort stability
//   key     — lowercase, MUST match the `city` column in the DB after normalize-on-save
//   name    — Title Case English display name
//   aliases — every spelling a user might type, EN/FR/AR. Includes the canonical name.
//
// The `key` follows the same lowercase rule the API write-path enforces.
// `name` is what gets pushed to `/hotels?city=...` and rendered in the picker.

export const WILAYAS = [
  { num: 1,  key: "adrar",                 name: "Adrar",                 aliases: ["adrar", "أدرار"] },
  { num: 2,  key: "chlef",                 name: "Chlef",                 aliases: ["chlef", "ech cheliff", "الشلف"] },
  { num: 3,  key: "laghouat",              name: "Laghouat",              aliases: ["laghouat", "el aghouat", "الأغواط"] },
  { num: 4,  key: "oum el bouaghi",        name: "Oum El Bouaghi",        aliases: ["oum el bouaghi", "oum bouaghi", "أم البواقي"] },
  { num: 5,  key: "batna",                 name: "Batna",                 aliases: ["batna", "باتنة"] },
  { num: 6,  key: "bejaia",                name: "Béjaïa",                aliases: ["bejaia", "béjaïa", "bejaïa", "bgayet", "بجاية"] },
  { num: 7,  key: "biskra",                name: "Biskra",                aliases: ["biskra", "بسكرة"] },
  { num: 8,  key: "bechar",                name: "Béchar",                aliases: ["bechar", "béchar", "بشار"] },
  { num: 9,  key: "blida",                 name: "Blida",                 aliases: ["blida", "el boulaida", "البليدة"] },
  { num: 10, key: "bouira",                name: "Bouira",                aliases: ["bouira", "البويرة"] },
  { num: 11, key: "tamanrasset",           name: "Tamanrasset",           aliases: ["tamanrasset", "tamanghasset", "tam", "تمنراست"] },
  { num: 12, key: "tebessa",               name: "Tébessa",               aliases: ["tebessa", "tébessa", "تبسة"] },
  { num: 13, key: "tlemcen",               name: "Tlemcen",               aliases: ["tlemcen", "tilimsen", "تلمسان"] },
  { num: 14, key: "tiaret",                name: "Tiaret",                aliases: ["tiaret", "تيارت"] },
  { num: 15, key: "tizi ouzou",            name: "Tizi Ouzou",            aliases: ["tizi ouzou", "tizi-ouzou", "tiziouzou", "tizi wezzu", "تيزي وزو"] },
  { num: 16, key: "algiers",               name: "Algiers",               aliases: ["algiers", "alger", "algier", "dzayer", "الجزائر", "الجزائر العاصمة", "العاصمة"] },
  { num: 17, key: "djelfa",                name: "Djelfa",                aliases: ["djelfa", "الجلفة"] },
  { num: 18, key: "jijel",                 name: "Jijel",                 aliases: ["jijel", "jigel", "جيجل"] },
  { num: 19, key: "setif",                 name: "Sétif",                 aliases: ["setif", "sétif", "stif", "سطيف"] },
  { num: 20, key: "saida",                 name: "Saïda",                 aliases: ["saida", "saïda", "سعيدة"] },
  { num: 21, key: "skikda",                name: "Skikda",                aliases: ["skikda", "سكيكدة"] },
  { num: 22, key: "sidi bel abbes",        name: "Sidi Bel Abbès",        aliases: ["sidi bel abbes", "sidi bel abbès", "sba", "سيدي بلعباس"] },
  { num: 23, key: "annaba",                name: "Annaba",                aliases: ["annaba", "bone", "bône", "عنابة"] },
  { num: 24, key: "guelma",                name: "Guelma",                aliases: ["guelma", "قالمة"] },
  { num: 25, key: "constantine",           name: "Constantine",           aliases: ["constantine", "qacentina", "ksentina", "قسنطينة", "قسطنطينة"] },
  { num: 26, key: "medea",                 name: "Médéa",                 aliases: ["medea", "médéa", "lemdiyya", "المدية"] },
  { num: 27, key: "mostaganem",            name: "Mostaganem",            aliases: ["mostaganem", "mosta", "مستغانم"] },
  { num: 28, key: "m'sila",                name: "M'Sila",                aliases: ["msila", "m'sila", "m sila", "المسيلة"] },
  { num: 29, key: "mascara",               name: "Mascara",               aliases: ["mascara", "mouaskar", "معسكر"] },
  { num: 30, key: "ouargla",               name: "Ouargla",               aliases: ["ouargla", "wargla", "ورقلة"] },
  { num: 31, key: "oran",                  name: "Oran",                  aliases: ["oran", "wahran", "وهران"] },
  { num: 32, key: "el bayadh",             name: "El Bayadh",             aliases: ["el bayadh", "elbayadh", "البيض"] },
  { num: 33, key: "illizi",                name: "Illizi",                aliases: ["illizi", "إيليزي"] },
  { num: 34, key: "bordj bou arreridj",    name: "Bordj Bou Arréridj",    aliases: ["bordj bou arreridj", "bordj bou arréridj", "bba", "برج بوعريريج"] },
  { num: 35, key: "boumerdes",             name: "Boumerdès",             aliases: ["boumerdes", "boumerdès", "boumerdas", "بومرداس"] },
  { num: 36, key: "el tarf",               name: "El Tarf",               aliases: ["el tarf", "eltarf", "الطارف"] },
  { num: 37, key: "tindouf",               name: "Tindouf",               aliases: ["tindouf", "تندوف"] },
  { num: 38, key: "tissemsilt",            name: "Tissemsilt",            aliases: ["tissemsilt", "تيسمسيلت"] },
  { num: 39, key: "el oued",               name: "El Oued",               aliases: ["el oued", "eloued", "el-oued", "الوادي"] },
  { num: 40, key: "khenchela",             name: "Khenchela",             aliases: ["khenchela", "khenchla", "خنشلة"] },
  { num: 41, key: "souk ahras",            name: "Souk Ahras",            aliases: ["souk ahras", "soukahras", "سوق أهراس"] },
  { num: 42, key: "tipaza",                name: "Tipaza",                aliases: ["tipaza", "tipasa", "تيبازة", "تيبازا"] },
  { num: 43, key: "mila",                  name: "Mila",                  aliases: ["mila", "ميلة"] },
  { num: 44, key: "ain defla",             name: "Aïn Defla",             aliases: ["ain defla", "aïn defla", "عين الدفلى"] },
  { num: 45, key: "naama",                 name: "Naâma",                 aliases: ["naama", "naâma", "النعامة"] },
  { num: 46, key: "ain temouchent",        name: "Aïn Témouchent",        aliases: ["ain temouchent", "aïn témouchent", "عين تموشنت"] },
  { num: 47, key: "ghardaia",              name: "Ghardaïa",              aliases: ["ghardaia", "ghardaïa", "غرداية"] },
  { num: 48, key: "relizane",              name: "Relizane",              aliases: ["relizane", "ghilizane", "غليزان"] },
  // --- new wilayas from the 2019 administrative reform ----------------------
  { num: 49, key: "timimoun",              name: "Timimoun",              aliases: ["timimoun", "تيميمون"] },
  { num: 50, key: "bordj badji mokhtar",   name: "Bordj Badji Mokhtar",   aliases: ["bordj badji mokhtar", "bbm", "برج باجي مختار"] },
  { num: 51, key: "ouled djellal",         name: "Ouled Djellal",         aliases: ["ouled djellal", "أولاد جلال"] },
  { num: 52, key: "beni abbes",            name: "Béni Abbès",            aliases: ["beni abbes", "béni abbès", "بني عباس"] },
  { num: 53, key: "in salah",              name: "In Salah",              aliases: ["in salah", "in-salah", "insalah", "عين صالح"] },
  { num: 54, key: "in guezzam",            name: "In Guezzam",            aliases: ["in guezzam", "in-guezzam", "inguezzam", "عين قزام"] },
  { num: 55, key: "touggourt",             name: "Touggourt",             aliases: ["touggourt", "tougourt", "تقرت"] },
  { num: 56, key: "djanet",                name: "Djanet",                aliases: ["djanet", "جانت"] },
  { num: 57, key: "el m'ghair",            name: "El M'Ghair",            aliases: ["el mghair", "el m'ghair", "elmghair", "المغير"] },
  { num: 58, key: "el meniaa",             name: "El Meniaa",             aliases: ["el meniaa", "el menia", "elmeniaa", "المنيعة"] },
];
