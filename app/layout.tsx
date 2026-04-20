import type { Metadata, Viewport } from "next";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import "./globals.css";
import Analytics from "./components/Analytics";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "The Read";

export const metadata: Metadata = {
  title: `${siteName} — A personal read of your fitness data`,
  description:
    "AI finds the patterns in your fitness data so you can sleep better, feel great, and hit your fitness goals. Read by a former Wallabies prop.",
  openGraph: {
    title: siteName,
    description:
      "AI finds the patterns in your fitness data so you can sleep better, feel great, and hit your fitness goals. Read by a former Wallabies prop.",
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
