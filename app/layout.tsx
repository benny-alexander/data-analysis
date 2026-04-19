import type { Metadata, Viewport } from "next";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import "./globals.css";
import Analytics from "./components/Analytics";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "The Read";

export const metadata: Metadata = {
  title: `${siteName} — Get a personal read of your fitness data`,
  description:
    "Upload your Oura, Garmin, Apple Watch, WHOOP or Strava export. Ben reads it personally and emails you the pattern that matters.",
  openGraph: {
    title: siteName,
    description:
      "AI finds the patterns in your fitness data. A pro athlete turns them into habit changes — for more energy and your goals.",
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
        <Analytics />
        {children}
        <VercelAnalytics />
      </body>
    </html>
  );
}
