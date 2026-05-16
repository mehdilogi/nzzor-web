import "./globals.css";

export const metadata = {
  title: "Nzzor — Premium Hotel Booking in Algeria",
  description:
    "Book Algeria's finest hotels instantly. 10 verified hotels, instant confirmation, CIB & Eddahabia payments. Operated by Allouni Travel Agency, licensed by the Algerian Ministry of Tourism.",
  keywords: ["Algeria hotels", "book hotel Algeria", "Nzzor", "Allouni Travel Agency", "CIB", "Eddahabia"],
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
      <body>{children}</body>
    </html>
  );
}
