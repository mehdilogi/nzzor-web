import "./globals.css";
import Providers from "./Providers";
import AnalyticsBeacon from "./components/AnalyticsBeacon";

export const metadata = {
  title: "Nzzor — Premium Hotel Booking in Algeria",
  // No hotel count here. This string is what Google indexes and what shows in
  // search results, so a number that goes stale is worse than no number — it
  // said "10 verified hotels" while the platform carried 25.
  description:
    "Book Algeria's finest hotels instantly. Verified hotels across 9 wilayas, instant confirmation, CIB & Edahabia payments. Operated by Allouni Travel Agency, licensed by the Algerian Ministry of Tourism.",
  keywords: ["Algeria hotels", "book hotel Algeria", "Nzzor", "Allouni Travel Agency", "CIB", "Edahabia"],
  openGraph: {
    title: "Nzzor — Premium Hotel Booking in Algeria",
    description: "Book Algeria's finest hotels instantly. Operated by Allouni Travel Agency.",
    type: "website",
  },
};

// Favicon: app/icon.png (512px) and app/apple-icon.png (180px) are picked up
// automatically by the app router, which generates the link tags. Do not add
// manual link tags in <head> — they would duplicate what Next already emits,
// and do not keep an icon.svg alongside them: Next would emit both and let the
// browser choose, which is how you end up with two different marks in the wild.
// The black padding from the source render has been made transparent so the
// tile's rounded corners sit correctly on light and dark tab chrome.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#16161A",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* AnalyticsBeacon listens for Next.js route changes and fires a
            pageview to /api/analytics/beacon on every navigation. It renders
            nothing visually and is internally wrapped in <Suspense> so it
            won't opt static routes out of prerendering (the documented
            useSearchParams gotcha). */}
        <AnalyticsBeacon />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
