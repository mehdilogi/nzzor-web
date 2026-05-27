import "./globals.css";
import Providers from "./Providers";
import AnalyticsBeacon from "./components/AnalyticsBeacon";

export const metadata = {
  title: "Nzzor — Premium Hotel Booking in Algeria",
  description:
    "Book Algeria's finest hotels instantly. 10 verified hotels, instant confirmation, CIB & Edahabia payments. Operated by Allouni Travel Agency, licensed by the Algerian Ministry of Tourism.",
  keywords: ["Algeria hotels", "book hotel Algeria", "Nzzor", "Allouni Travel Agency", "CIB", "Edahabia"],
  openGraph: {
    title: "Nzzor — Premium Hotel Booking in Algeria",
    description: "Book Algeria's finest hotels instantly. Operated by Allouni Travel Agency.",
    type: "website",
  },
};

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
