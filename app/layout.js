import "./globals.css";
import StyledJsxRegistry from "./registry";
import Providers from "./Providers";
import AnalyticsBeacon from "./components/AnalyticsBeacon";

// French by default: it is the language the server renders (lib/LangContext.js)
// and the one Google indexes. Pages override title/description/canonical.
export const metadata = {
  metadataBase: new URL("https://nzzor.com"),
  title: "Nzzor — Réservation d'hôtels en Algérie",
  // No counts here at all. This string is what Google indexes and what shows in
  // search results, so a number that goes stale is worse than no number — it
  // said "10 verified hotels" while the platform carried 25, then "9 wilayas"
  // while it covered 47. Live counts belong on the page, not in metadata.
  description:
    "Réservez votre hôtel en Algérie en quelques secondes : hôtels vérifiés dans toutes les wilayas, paiement par carte CIB ou Edahabia. Nzzor, par Allouni Travel Agency, agence de voyage agréée par le Ministère du Tourisme.",
  keywords: ["hôtel Algérie", "réservation hôtel Algérie", "réserver hôtel", "فندق الجزائر", "حجز فندق", "Nzzor", "Allouni Travel Agency", "CIB", "Edahabia"],
  openGraph: {
    title: "Nzzor — Réservation d'hôtels en Algérie",
    description: "Hôtels vérifiés, paiement CIB et Edahabia, agence agréée.",
    type: "website",
    siteName: "Nzzor",
    locale: "fr_DZ",
    alternateLocale: ["ar_DZ", "en_US"],
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Nzzor — Votre hôtel en Algérie, réservé en secondes." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nzzor — Réservation d'hôtels en Algérie",
    description: "Hôtels vérifiés, paiement CIB et Edahabia, agence agréée.",
    images: ["/og.jpg"],
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
    <html lang="fr" dir="ltr">
      <body>
        {/* StyledJsxRegistry must be the outermost wrapper in <body> so it
            captures styled-jsx from every client component beneath it. See
            app/registry.js for why this exists. */}
        <StyledJsxRegistry>
          {/* AnalyticsBeacon listens for Next.js route changes and fires a
              pageview to /api/analytics/beacon on every navigation. It renders
              nothing visually and is internally wrapped in <Suspense> so it
              won't opt static routes out of prerendering (the documented
              useSearchParams gotcha). */}
          <AnalyticsBeacon />
          <Providers>{children}</Providers>
        </StyledJsxRegistry>
      </body>
    </html>
  );
}
