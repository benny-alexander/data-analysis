import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "The Read";

export const metadata: Metadata = {
  title: `${siteName} — Get a personal read of your fitness data`,
  description:
    "Upload your Oura, Garmin, Apple Watch, WHOOP or Strava export. Ben reads it personally and emails you the pattern that matters.",
  openGraph: {
    title: siteName,
    description:
      "Your watch has been telling you why you're tired. You just can't see it.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
