// =============================================================================
// Nzzor — Premium Icon Set
// All icons on a 24x24 grid, 1.6 stroke, round caps/joins.
// Paths stored as raw SVG markup strings, rendered via dangerouslySetInnerHTML.
// =============================================================================

const PATHS = {
  guest: '<circle cx="12" cy="8" r="3.4"/><path d="M5.5 19.5c0-3.2 2.9-5.2 6.5-5.2s6.5 2 6.5 5.2"/>',
  size: '<path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15"/>',
  bed: '<path d="M3 18v-7.5A1.5 1.5 0 0 1 4.5 9h15a1.5 1.5 0 0 1 1.5 1.5V18M3 14.5h18M3 18v2M21 18v2M7 9V7a1 1 0 0 1 1-1h3.2a1 1 0 0 1 1 1v2M12.8 9V7a1 1 0 0 1 1-1H17a1 1 0 0 1 1 1v2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  clock: '<circle cx="12" cy="12" r="8.2"/><path d="M12 7.5V12l3 2"/>',
  child: '<path d="M12 4.2a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM12 8.2v6M8 11l4-1 4 1M9.5 20l2.5-5.8L14.5 20"/>',
  pet: '<path d="M12 21c-4.2 0-7-2.6-7-5.4 0-2 1.6-3.3 3-3.3 1 0 1.8.5 2.4 1.3M12 21c4.2 0 7-2.6 7-5.4 0-2-1.6-3.3-3-3.3-1 0-1.8.5-2.4 1.3"/><circle cx="7" cy="7.5" r="1.8"/><circle cx="12" cy="5.5" r="1.8"/><circle cx="17" cy="7.5" r="1.8"/>',
  parking: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9.5 16.5V8h3.2a2.6 2.6 0 0 1 0 5.2H9.5"/>',
  wifi: '<path d="M4.5 9.5c4.2-3.7 10.8-3.7 15 0M7.3 12.8c2.7-2.3 6.7-2.3 9.4 0M10 16c1.2-1 2.8-1 4 0"/><circle cx="12" cy="19" r="1.1" fill="currentColor" stroke="none"/>',
  pool: '<path d="M4 18.5c1.3 0 1.3 1 2.7 1s1.3-1 2.7-1 1.3 1 2.6 1 1.3-1 2.7-1 1.3 1 2.6 1 1.4-1 2.7-1M4 14c1.3 0 1.3 1 2.7 1s1.3-1 2.7-1 1.3 1 2.6 1 1.3-1 2.7-1 1.3 1 2.6 1 1.4-1 2.7-1M8 12V6.5A2.5 2.5 0 0 1 12.5 5M16 12V6.5"/>',
  spa: '<path d="M12 21c0-4-2.5-7-6.5-8.5C7 16 9.5 19 12 21ZM12 21c0-4 2.5-7 6.5-8.5C17 16 14.5 19 12 21ZM12 21c0-5 0-9 0-13M9.5 6.5C10.5 4.5 12 3 12 3s1.5 1.5 2.5 3.5"/>',
  dining: '<path d="M7 3v7M5 3v3.5a2 2 0 0 0 2 2 2 2 0 0 0 2-2V3M7 10v11M17 3c-1.7 0-2.8 2.2-2.8 5 0 2 1 3.2 2 3.6V21"/>',
  gym: '<path d="M5 8v8M3 10v4M19 8v8M21 10v4M5 12h14"/>',
  service: '<path d="M12 6V4M5 18h14M6 18a6 6 0 0 1 12 0M9.5 6.2a3 3 0 0 1 5 0"/>',
  bar: '<path d="M5 4h14l-7 8-7-8ZM12 12v6M8.5 21h7M14 8l3.5-4"/>',
  business: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  beach: '<path d="M12 20V9M12 9C9 5 4 6 3.5 6.5 6 7 7 9 8 11M12 9c3-4 8-3 8.5-2.5C18 7 17 9 16 11M5 20h14"/>',
  ac: '<rect x="3" y="5" width="18" height="8" rx="2"/><path d="M6 9h2M11 9h2M16 9h2M7 16c0 1.5 1 2 1 3.5M12 16c0 1.5-1 2-1 3.5M17 16c0 1.5 1 2 1 3.5"/>',
  shuttle: '<path d="M4 16V8a2 2 0 0 1 2-2h9l5 5v5M4 16h16M4 16v2M20 16v2M9 6v10"/><circle cx="8" cy="18.5" r="1.6"/><circle cx="16" cy="18.5" r="1.6"/>',
  view: '<path d="M3 17l5-6 4 4 3-4 6 6M3 17v3h18v-3M3 17V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v11"/><circle cx="8" cy="8.5" r="1.4"/>',
  heritage: '<path d="M4 20h16M5 20V10l7-5 7 5v10M9 20v-5h6v5M10 11h.01M14 11h.01"/>',
  shield: '<path d="M12 3l7 3v5c0 4.6-3 8.4-7 9.6C8 19.4 5 15.6 5 11V6l7-3Z"/><path d="M9 11.5l2 2 4-4.2"/>',
  pin: '<path d="M12 21.5c4-4 7-7.4 7-11A7 7 0 0 0 5 10.5c0 3.6 3 7 7 11Z"/><circle cx="12" cy="10.2" r="2.6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M16 16l4.5 4.5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L4.5 9.7l5.9-.9Z"/>',
  tours: '<circle cx="12" cy="12" r="8.5"/><path d="M15 9l-2 5-4 1 2-5Z"/>',
  stargazing: '<path d="M12 3.5l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L4 7.7l4-.6Z"/><circle cx="18" cy="17" r="1" fill="currentColor" stroke="none"/><circle cx="6" cy="16" r="1" fill="currentColor" stroke="none"/>',
  garden: '<path d="M12 21v-7M12 14c-3 0-5-2-5-5 3 0 5 2 5 5ZM12 11c0-3 2-5 5-5 0 3-2 5-5 5ZM8 21h8"/>',
  courtyard: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/>',
  rooftop: '<path d="M4 20h16M6 20v-6h12v6M6 14l6-5 6 5M10 20v-3h4v3"/>',
  library: '<path d="M5 4h4v16H5zM9 4h4v16H9zM13.5 5l3.8 1 3.5 14-3.8-1Z"/>',
  golf: '<path d="M11 3v13M11 4l6 2.5-6 2.5M7 21h8"/>',
  whatsapp: '<path d="M17.5 14.4c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.6.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.5-.8-2.6-1.4-3.6-3.1-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5-.1-.1-.6-1.5-.9-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.7.7-1 1.6-1 2.6 0 1.5 1.1 3 1.2 3.2.1.2 2.1 3.3 5.2 4.6 2 .8 2.7.9 3.7.8.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3M12 2a10 10 0 00-8.6 15l-1.3 4.7L7 20.4A10 10 0 1012 2" fill="currentColor" stroke="none"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19M6 14.5h4"/>',
  cib: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19"/><rect x="5" y="12" width="4" height="3.2" rx="0.6"/><path d="M5.7 13.6h2.6M14 14.5h4"/>',
  edahabia: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19M6 14.5h4"/><path d="M15.5 5L21.5 5L21.5 8.5Z" fill="currentColor" stroke="none" opacity="0.85"/><path d="M16.5 6.2L20.5 6.2M16.5 7.4L19.5 7.4" stroke="#FAF8F4" strokeWidth="0.8"/>',
  banktransfer: '<path d="M4 10h16M5 10l7-5 7 5M7 10v6M11 10v6M13 10v6M17 10v6M4 18h11"/><path d="M16 21l4-2.5-4-2.5"/>',
  // PLACEHOLDER MARKS — Visa and Mastercard logos are trademarked. These are
  // neutral generic-card glyphs so the slots render now. Replace each string
  // with the official brand SVG inner-markup from the Visa / Mastercard brand
  // centers (free for merchants who accept the cards). Keep the 24x24 viewBox.
  visa: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19"/><path d="M8 16l1.6-4M13 12l-1.4 4M15.5 12l1.2 4 1.4-4" stroke-width="1.3"/>',
  mastercard: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19"/><circle cx="10.5" cy="14" r="2.6"/><circle cx="14" cy="14" r="2.6"/>',
  cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 12h.01M18 12h.01"/>',
  bank: '<path d="M4 10h16M5 10l7-5 7 5M6 10v7M10 10v7M14 10v7M18 10v7M4 20h16"/>',
  heart: '<path d="M12 20.5C7 16.5 4 13.5 4 9.8A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8 2.8c0 3.7-3 6.7-8 10.7Z"/>',
};

export const AMENITY_ICON = {
  wifi: "wifi", pool: "pool", spa: "spa", restaurant: "dining", gym: "gym",
  parking: "parking", room_service: "service", bar: "bar", business: "business",
  beach: "beach", golf: "golf", water_sports: "pool", tours: "tours",
  stargazing: "stargazing", courtyard: "courtyard", rooftop: "rooftop",
  garden: "garden", library: "library", camel_treks: "tours",
  kayaking: "pool", tea_ceremony: "dining",
};

export default function Icon({ name, size = 20, className = "", style = {}, strokeWidth }) {
  const markup = PATHS[name];
  if (!markup) return null;
  return (
    <svg
      className={`ic ${className}`}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{ ...(strokeWidth != null ? { strokeWidth } : {}), ...style }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
