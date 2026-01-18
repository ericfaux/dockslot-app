import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DockSlot - Marina Booking",
  description: "Book your dock slip at DockSlot Marina",
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
