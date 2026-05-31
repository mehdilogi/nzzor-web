// =============================================================================
// Nzzor — Mock Data
// Fallback dataset so the frontend renders fully even before the API is wired.
// Mirrors the shape returned by the real Nzzor API (formatHotel/formatRoom).
// Once NEXT_PUBLIC_API_URL points at a live API, real data is used instead.
// =============================================================================

export const MOCK_HOTELS = [
  {
    id: "h1", slug: "royal-maqam-algiers",
    name: "Royal Maqam Hotel & Spa",
    description:
      "Perched on the hills of Algiers with sweeping Mediterranean views, Royal Maqam combines Ottoman grandeur with contemporary luxury. Hand-carved cedar details and marble sourced from the legendary Fil-Fila quarries create spaces that honour Algeria's artisanal heritage while delivering world-class comfort.",
    stars: 5, city: "Algiers", region: "Algiers Province",
    rating: 9.2, reviewCount: 342, isFeatured: true,
    checkInTime: "14:00", checkOutTime: "12:00",
    priceFrom: 28000,
    trustSignals: { instantConfirmation: true, verifiedPartner: true },
    policies: { cancellationHours: 48, childrenAllowed: true, petsAllowed: false, parkingFree: true },
    primaryPhoto: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&q=85",
    photos: [
      { id: "p1", url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&q=85", isPrimary: true },
      { id: "p2", url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=85", isPrimary: false },
      { id: "p3", url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=85", isPrimary: false },
      { id: "p4", url: "https://images.unsplash.com/photo-1590490360182-c33d7f9d02e0?w=800&q=85", isPrimary: false },
      { id: "p5", url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=85", isPrimary: false },
    ],
    amenities: [
      { key: "wifi", name: "Free Wi-Fi", category: "facilities" },
      { key: "pool", name: "Infinity pool", category: "wellness" },
      { key: "spa", name: "Spa & hammam", category: "wellness" },
      { key: "restaurant", name: "3 restaurants", category: "dining" },
      { key: "gym", name: "Fitness center", category: "wellness" },
      { key: "parking", name: "Free parking", category: "facilities" },
      { key: "room_service", name: "24h room service", category: "facilities" },
      { key: "bar", name: "Rooftop bar", category: "dining" },
      { key: "business", name: "Business center", category: "facilities" },
      { key: "beach", name: "Beach access", category: "activities" },
    ],
    rooms: [
      { id: "r1", type: "Deluxe Sea View", description: "", price: 28000, capacity: 2, sizeSqm: 35, bedType: "King", totalUnits: 8, photos: ["https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=85"] },
      { id: "r2", type: "Premium Suite", description: "", price: 42000, capacity: 3, sizeSqm: 55, bedType: "King", totalUnits: 4, photos: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=85"] },
      { id: "r3", type: "Royal Suite", description: "", price: 68000, capacity: 4, sizeSqm: 90, bedType: "King + Twin", totalUnits: 2, photos: ["https://images.unsplash.com/photo-1590490360182-c33d7f9d02e0?w=600&q=85"] },
    ],
  },
  {
    id: "h2", slug: "tassili-sands-djanet",
    name: "Tassili Sands Resort",
    description:
      "An oasis at the gateway to the Tassili n'Ajjer. Tuareg-inspired luxury with stargazing terraces and excursions to 12,000-year-old UNESCO rock art sites.",
    stars: 4, city: "Djanet", region: "Illizi Province",
    rating: 9.5, reviewCount: 187, isFeatured: true,
    checkInTime: "15:00", checkOutTime: "11:00",
    priceFrom: 22000,
    trustSignals: { instantConfirmation: true, verifiedPartner: true },
    policies: { cancellationHours: 48, childrenAllowed: true, petsAllowed: false, parkingFree: true },
    primaryPhoto: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1000&q=85",
    photos: [
      { id: "p1", url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1000&q=85", isPrimary: true },
      { id: "p2", url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=85", isPrimary: false },
      { id: "p3", url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=85", isPrimary: false },
      { id: "p4", url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=85", isPrimary: false },
      { id: "p5", url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=85", isPrimary: false },
    ],
    amenities: [
      { key: "wifi", name: "Free Wi-Fi", category: "facilities" },
      { key: "pool", name: "Pool", category: "wellness" },
      { key: "restaurant", name: "Restaurant", category: "dining" },
      { key: "parking", name: "Free parking", category: "facilities" },
      { key: "tours", name: "Guided tours", category: "activities" },
      { key: "stargazing", name: "Stargazing", category: "activities" },
    ],
    rooms: [
      { id: "r1", type: "Desert View Room", description: "", price: 22000, capacity: 2, sizeSqm: 30, bedType: "King", totalUnits: 10, photos: ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=85"] },
      { id: "r2", type: "Tassili Suite", description: "", price: 35000, capacity: 2, sizeSqm: 50, bedType: "King", totalUnits: 4, photos: ["https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=85"] },
      { id: "r3", type: "Sahara Villa", description: "", price: 55000, capacity: 4, sizeSqm: 80, bedType: "2 Kings", totalUnits: 2, photos: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=85"] },
    ],
  },
  {
    id: "h3", slug: "constantine-palace",
    name: "Constantine Palace Hotel",
    description:
      "Overlooking the dramatic Rhumel gorges, a tribute to the City of Bridges. Andalusian architecture meets modern comfort with panoramic views.",
    stars: 5, city: "Constantine", region: "Constantine Province",
    rating: 8.9, reviewCount: 256, isFeatured: true,
    checkInTime: "14:00", checkOutTime: "12:00",
    priceFrom: 25000,
    trustSignals: { instantConfirmation: true, verifiedPartner: true },
    policies: { cancellationHours: 48, childrenAllowed: true, petsAllowed: false, parkingFree: true },
    primaryPhoto: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1000&q=85",
    photos: [
      { id: "p1", url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1000&q=85", isPrimary: true },
      { id: "p2", url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=85", isPrimary: false },
      { id: "p3", url: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=85", isPrimary: false },
      { id: "p4", url: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=85", isPrimary: false },
      { id: "p5", url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=85", isPrimary: false },
    ],
    amenities: [
      { key: "wifi", name: "Free Wi-Fi", category: "facilities" },
      { key: "restaurant", name: "Restaurant", category: "dining" },
      { key: "gym", name: "Fitness center", category: "wellness" },
      { key: "parking", name: "Free parking", category: "facilities" },
      { key: "room_service", name: "24h room service", category: "facilities" },
      { key: "bar", name: "Bar", category: "dining" },
      { key: "business", name: "Business center", category: "facilities" },
      { key: "spa", name: "Hammam", category: "wellness" },
    ],
    rooms: [
      { id: "r1", type: "Classic Room", description: "", price: 25000, capacity: 2, sizeSqm: 28, bedType: "Queen", totalUnits: 12, photos: ["https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=85"] },
      { id: "r2", type: "Gorge View Suite", description: "", price: 38000, capacity: 2, sizeSqm: 48, bedType: "King", totalUnits: 4, photos: ["https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=600&q=85"] },
      { id: "r3", type: "Presidential Suite", description: "", price: 72000, capacity: 4, sizeSqm: 100, bedType: "King + Twin", totalUnits: 1, photos: ["https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&q=85"] },
    ],
  },
  {
    id: "h4", slug: "casbah-heritage-inn",
    name: "Casbah Heritage Inn",
    description:
      "A restored Ottoman riad in the UNESCO Casbah. Zellige tilework, carved stucco, and centuries-old courtyard fountains.",
    stars: 4, city: "Algiers", region: "Algiers Province",
    rating: 8.7, reviewCount: 198, isFeatured: false,
    checkInTime: "15:00", checkOutTime: "11:00",
    priceFrom: 18000,
    trustSignals: { instantConfirmation: true, verifiedPartner: true },
    policies: { cancellationHours: 48, childrenAllowed: true, petsAllowed: false, parkingFree: false },
    primaryPhoto: "https://images.unsplash.com/photo-1590490360182-c33d7f9d02e0?w=1000&q=85",
    photos: [
      { id: "p1", url: "https://images.unsplash.com/photo-1590490360182-c33d7f9d02e0?w=1000&q=85", isPrimary: true },
      { id: "p2", url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=85", isPrimary: false },
      { id: "p3", url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=85", isPrimary: false },
      { id: "p4", url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=85", isPrimary: false },
      { id: "p5", url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=85", isPrimary: false },
    ],
    amenities: [
      { key: "wifi", name: "Free Wi-Fi", category: "facilities" },
      { key: "restaurant", name: "Restaurant", category: "dining" },
      { key: "room_service", name: "Room service", category: "facilities" },
      { key: "courtyard", name: "Inner courtyard", category: "facilities" },
      { key: "rooftop", name: "Rooftop terrace", category: "facilities" },
      { key: "library", name: "Library", category: "facilities" },
    ],
    rooms: [
      { id: "r1", type: "Heritage Room", description: "", price: 18000, capacity: 2, sizeSqm: 25, bedType: "Queen", totalUnits: 6, photos: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=85"] },
      { id: "r2", type: "Courtyard Suite", description: "", price: 28000, capacity: 2, sizeSqm: 40, bedType: "King", totalUnits: 3, photos: ["https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=85"] },
    ],
  },
  {
    id: "h5", slug: "azur-beach-oran",
    name: "Azur Beach Hotel",
    description:
      "Five-star Mediterranean luxury on Oran's golden coast. Infinity pools, private beach, and the finest Oranaise cuisine.",
    stars: 5, city: "Oran", region: "Oran Province",
    rating: 9.0, reviewCount: 412, isFeatured: true,
    checkInTime: "14:00", checkOutTime: "12:00",
    priceFrom: 32000,
    trustSignals: { instantConfirmation: true, verifiedPartner: true },
    policies: { cancellationHours: 48, childrenAllowed: true, petsAllowed: false, parkingFree: true },
    primaryPhoto: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1000&q=85",
    photos: [
      { id: "p1", url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1000&q=85", isPrimary: true },
      { id: "p2", url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=85", isPrimary: false },
      { id: "p3", url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=85", isPrimary: false },
      { id: "p4", url: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=85", isPrimary: false },
      { id: "p5", url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=85", isPrimary: false },
    ],
    amenities: [
      { key: "wifi", name: "Free Wi-Fi", category: "facilities" },
      { key: "pool", name: "Infinity pool", category: "wellness" },
      { key: "spa", name: "Spa & hammam", category: "wellness" },
      { key: "restaurant", name: "Beach dining", category: "dining" },
      { key: "gym", name: "Fitness center", category: "wellness" },
      { key: "parking", name: "Free parking", category: "facilities" },
      { key: "room_service", name: "Room service", category: "facilities" },
      { key: "bar", name: "Bar", category: "dining" },
      { key: "beach", name: "Private beach", category: "activities" },
      { key: "water_sports", name: "Water sports", category: "activities" },
    ],
    rooms: [
      { id: "r1", type: "Ocean View Room", description: "", price: 32000, capacity: 2, sizeSqm: 35, bedType: "King", totalUnits: 10, photos: ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=85"] },
      { id: "r2", type: "Beach Suite", description: "", price: 48000, capacity: 3, sizeSqm: 60, bedType: "King", totalUnits: 4, photos: ["https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=85"] },
      { id: "r3", type: "Penthouse", description: "", price: 85000, capacity: 4, sizeSqm: 120, bedType: "2 Kings", totalUnits: 1, photos: ["https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&q=85"] },
    ],
  },
  {
    id: "h6", slug: "timgad-heritage-lodge",
    name: "Timgad Heritage Lodge",
    description:
      "Steps from Timgad, Africa's Pompeii. Stone rooms with two millennia of character and every modern comfort.",
    stars: 3, city: "Batna", region: "Batna Province",
    rating: 8.3, reviewCount: 96, isFeatured: false,
    checkInTime: "14:00", checkOutTime: "11:00",
    priceFrom: 12000,
    trustSignals: { instantConfirmation: true, verifiedPartner: true },
    policies: { cancellationHours: 48, childrenAllowed: true, petsAllowed: true, parkingFree: true },
    primaryPhoto: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1000&q=85",
    photos: [
      { id: "p1", url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1000&q=85", isPrimary: true },
      { id: "p2", url: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=85", isPrimary: false },
      { id: "p3", url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=85", isPrimary: false },
      { id: "p4", url: "https://images.unsplash.com/photo-1590490360182-c33d7f9d02e0?w=800&q=85", isPrimary: false },
      { id: "p5", url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=85", isPrimary: false },
    ],
    amenities: [
      { key: "wifi", name: "Free Wi-Fi", category: "facilities" },
      { key: "restaurant", name: "Restaurant", category: "dining" },
      { key: "parking", name: "Free parking", category: "facilities" },
      { key: "tours", name: "Guided tours", category: "activities" },
      { key: "garden", name: "Garden", category: "facilities" },
    ],
    rooms: [
      { id: "r1", type: "Standard Room", description: "", price: 12000, capacity: 2, sizeSqm: 22, bedType: "Double", totalUnits: 8, photos: ["https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=600&q=85"] },
      { id: "r2", type: "Superior Room", description: "", price: 16000, capacity: 2, sizeSqm: 30, bedType: "King", totalUnits: 4, photos: ["https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=85"] },
    ],
  },
  {
    id: "h7", slug: "ghardaia-oasis",
    name: "Ghardaia Oasis Hotel",
    description:
      "In the M'zab Valley UNESCO site. Ibadite architecture with pastel facades and cascading terraces.",
    stars: 4, city: "Ghardaia", region: "Ghardaia Province",
    rating: 8.6, reviewCount: 134, isFeatured: false,
    checkInTime: "14:00", checkOutTime: "12:00",
    priceFrom: 16000,
    trustSignals: { instantConfirmation: true, verifiedPartner: true },
    policies: { cancellationHours: 48, childrenAllowed: true, petsAllowed: false, parkingFree: true },
    primaryPhoto: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1000&q=85",
    photos: [
      { id: "p1", url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1000&q=85", isPrimary: true },
      { id: "p2", url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=85", isPrimary: false },
      { id: "p3", url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=85", isPrimary: false },
      { id: "p4", url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=85", isPrimary: false },
      { id: "p5", url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=85", isPrimary: false },
    ],
    amenities: [
      { key: "wifi", name: "Free Wi-Fi", category: "facilities" },
      { key: "restaurant", name: "Restaurant", category: "dining" },
      { key: "parking", name: "Free parking", category: "facilities" },
      { key: "tours", name: "Guided tours", category: "activities" },
      { key: "rooftop", name: "Rooftop terrace", category: "facilities" },
      { key: "garden", name: "Garden", category: "facilities" },
    ],
    rooms: [
      { id: "r1", type: "M'zab Room", description: "", price: 16000, capacity: 2, sizeSqm: 26, bedType: "Double", totalUnits: 8, photos: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=85"] },
      { id: "r2", type: "Oasis Suite", description: "", price: 26000, capacity: 3, sizeSqm: 45, bedType: "King", totalUnits: 3, photos: ["https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=85"] },
    ],
  },
  {
    id: "h8", slug: "sheraton-club-des-pins",
    name: "Sheraton Club des Pins",
    description:
      "Algiers' iconic resort in Mediterranean pine forests. Private beach, championship golf, and 5 signature restaurants.",
    stars: 5, city: "Algiers", region: "Algiers Province",
    rating: 8.6, reviewCount: 523, isFeatured: true,
    checkInTime: "15:00", checkOutTime: "12:00",
    priceFrom: 35000,
    trustSignals: { instantConfirmation: true, verifiedPartner: true },
    policies: { cancellationHours: 48, childrenAllowed: true, petsAllowed: false, parkingFree: true },
    primaryPhoto: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1000&q=85",
    photos: [
      { id: "p1", url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1000&q=85", isPrimary: true },
      { id: "p2", url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=85", isPrimary: false },
      { id: "p3", url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=85", isPrimary: false },
      { id: "p4", url: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=85", isPrimary: false },
      { id: "p5", url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=85", isPrimary: false },
    ],
    amenities: [
      { key: "wifi", name: "Free Wi-Fi", category: "facilities" },
      { key: "pool", name: "Pool", category: "wellness" },
      { key: "spa", name: "Spa & hammam", category: "wellness" },
      { key: "restaurant", name: "5 restaurants", category: "dining" },
      { key: "gym", name: "Fitness center", category: "wellness" },
      { key: "parking", name: "Valet parking", category: "facilities" },
      { key: "room_service", name: "Room service", category: "facilities" },
      { key: "bar", name: "Bar", category: "dining" },
      { key: "business", name: "Convention center", category: "facilities" },
      { key: "beach", name: "Private beach", category: "activities" },
      { key: "golf", name: "Golf course", category: "activities" },
    ],
    rooms: [
      { id: "r1", type: "Deluxe Room", description: "", price: 35000, capacity: 2, sizeSqm: 38, bedType: "King", totalUnits: 15, photos: ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=85"] },
      { id: "r2", type: "Executive Suite", description: "", price: 52000, capacity: 3, sizeSqm: 65, bedType: "King", totalUnits: 6, photos: ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=85"] },
      { id: "r3", type: "Presidential Suite", description: "", price: 95000, capacity: 4, sizeSqm: 130, bedType: "2 Kings", totalUnits: 1, photos: ["https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=600&q=85"] },
    ],
  },
  {
    id: "h9", slug: "tipaza-seaside-boutique",
    name: "Tipaza Seaside Boutique",
    description:
      "Where Roman ruins meet the Mediterranean. Sunsets over ancient Punic archaeological sites.",
    stars: 4, city: "Tipaza", region: "Tipaza Province",
    rating: 8.8, reviewCount: 167, isFeatured: false,
    checkInTime: "14:00", checkOutTime: "11:00",
    priceFrom: 20000,
    trustSignals: { instantConfirmation: true, verifiedPartner: true },
    policies: { cancellationHours: 48, childrenAllowed: true, petsAllowed: false, parkingFree: true },
    primaryPhoto: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1000&q=85",
    photos: [
      { id: "p1", url: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1000&q=85", isPrimary: true },
      { id: "p2", url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=85", isPrimary: false },
      { id: "p3", url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=85", isPrimary: false },
      { id: "p4", url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=85", isPrimary: false },
      { id: "p5", url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=85", isPrimary: false },
    ],
    amenities: [
      { key: "wifi", name: "Free Wi-Fi", category: "facilities" },
      { key: "restaurant", name: "Restaurant", category: "dining" },
      { key: "parking", name: "Free parking", category: "facilities" },
      { key: "pool", name: "Pool", category: "wellness" },
      { key: "garden", name: "Garden", category: "facilities" },
      { key: "tours", name: "Guided tours", category: "activities" },
    ],
    rooms: [
      { id: "r1", type: "Garden Room", description: "", price: 20000, capacity: 2, sizeSqm: 28, bedType: "Queen", totalUnits: 6, photos: ["https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=85"] },
      { id: "r2", type: "Sea View Suite", description: "", price: 30000, capacity: 2, sizeSqm: 42, bedType: "King", totalUnits: 3, photos: ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=85"] },
    ],
  },
  {
    id: "h10", slug: "meridien-bejaia",
    name: "Le Méridien Béjaïa",
    description:
      "Between Gouraya mountains and turquoise bay. Kabylie-inspired décor honouring Amazigh heritage.",
    stars: 4, city: "Bejaia", region: "Bejaia Province",
    rating: 8.5, reviewCount: 289, isFeatured: false,
    checkInTime: "14:00", checkOutTime: "12:00",
    priceFrom: 24000,
    trustSignals: { instantConfirmation: true, verifiedPartner: true },
    policies: { cancellationHours: 48, childrenAllowed: true, petsAllowed: false, parkingFree: true },
    primaryPhoto: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1000&q=85",
    photos: [
      { id: "p1", url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1000&q=85", isPrimary: true },
      { id: "p2", url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=85", isPrimary: false },
      { id: "p3", url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=85", isPrimary: false },
      { id: "p4", url: "https://images.unsplash.com/photo-1590490360182-c33d7f9d02e0?w=800&q=85", isPrimary: false },
      { id: "p5", url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=85", isPrimary: false },
    ],
    amenities: [
      { key: "wifi", name: "Free Wi-Fi", category: "facilities" },
      { key: "pool", name: "Pool", category: "wellness" },
      { key: "restaurant", name: "Restaurant", category: "dining" },
      { key: "gym", name: "Fitness center", category: "wellness" },
      { key: "parking", name: "Free parking", category: "facilities" },
      { key: "spa", name: "Spa", category: "wellness" },
      { key: "beach", name: "Beach access", category: "activities" },
    ],
    rooms: [
      { id: "r1", type: "Mountain View Room", description: "", price: 24000, capacity: 2, sizeSqm: 32, bedType: "King", totalUnits: 10, photos: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=85"] },
      { id: "r2", type: "Bay Suite", description: "", price: 38000, capacity: 3, sizeSqm: 55, bedType: "King", totalUnits: 4, photos: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=85"] },
    ],
  },
];

// MOCK_CITIES — destination list for the homepage hero picker.
// Sourced from the canonical 58-wilaya list. hotelCount is 0 here; HomeHero
// fetches live counts from /api/hotels/meta/cities and overlays them, so
// these numbers stay accurate without manual edits.
//
// Sorting: wilayas KNOWN to have hotels (the launch set + recent additions)
// surface first so the most-clickable destinations sit at the top of the
// 2-column popup. Everything else follows by wilaya number.
import { WILAYAS } from "./wilayas";

// Wilayas that currently have at least one hotel — surface them first.
// Update this list as the catalog expands; it's purely a UI ordering hint.
const FEATURED_KEYS = new Set([
  "algiers", "oran", "constantine", "setif", "djanet",
  "ghardaia", "bejaia", "tipaza", "batna", "skikda",
  "guelma", "tizi ouzou",
]);

export const MOCK_CITIES = (() => {
  const featured = WILAYAS.filter((w) => FEATURED_KEYS.has(w.key));
  const rest = WILAYAS.filter((w) => !FEATURED_KEYS.has(w.key));
  return [...featured, ...rest].map((w) => ({
    key: w.key,
    name: w.name,
    hotelCount: 0, // overlaid with live counts in HomeHero
  }));
})();
