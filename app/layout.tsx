import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DockSlot — The Booking System Built for Charter Captains",
  description:
    "Stop juggling texts, calls, and spreadsheets. DockSlot gives charter captains a shareable booking link, automated confirmations, NOAA weather alerts, and digital waivers.",
  keywords: [
    "charter boat booking software",
    "6 pack captain scheduling app",
    "charter fishing booking system",
    "fishing charter management",
    "charter boat scheduling",
    "online booking for charter captains",
  ],
  openGraph: {
    title: "DockSlot — The Booking System Built for Charter Captains",
    description:
      "Shareable booking link, automated confirmations, weather monitoring, and digital waivers — built for 6-pack charter captains.",
    type: "website",
    siteName: "DockSlot",
  },
  twitter: {
    card: "summary_large_image",
    title: "DockSlot — The Booking System Built for Charter Captains",
    description:
      "Shareable booking link, automated confirmations, weather monitoring, and digital waivers — built for 6-pack charter captains.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
