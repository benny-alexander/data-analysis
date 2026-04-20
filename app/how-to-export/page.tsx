"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ExportInstructions, {
  type Device,
  VALID_DEVICES,
} from "../components/ExportInstructions";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "The Read";

export default function HowToExportPage() {
  return (
    <Suspense fallback={<HowToExportInner initial="apple" />}>
      <HowToExportWithParams />
    </Suspense>
  );
}

function HowToExportWithParams() {
  const params = useSearchParams();
  const deviceParam = params.get("device");
  const initial: Device =
    deviceParam && VALID_DEVICES.has(deviceParam as Device)
      ? (deviceParam as Device)
      : "apple";
  return <HowToExportInner initial={initial} />;
}

function HowToExportInner({ initial }: { initial: Device }) {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl tracking-tight">
            {siteName}
          </Link>
          <nav className="text-sm text-mute">
            <Link href="/#upload" className="hover:text-ink">
              Back to upload
            </Link>
          </nav>
        </div>
      </header>

      {/* Intro */}
      <section className="mx-auto max-w-prose px-6 pt-16 pb-8">
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight">
          How to export your data
        </h1>
        <p className="mt-6 text-lg text-ink/80">
          Pick your device below. Each platform does this a little differently &mdash; some
          are instant, some take a few days. If yours takes a while, come back when the
          file&rsquo;s ready.
        </p>
        <p className="mt-4 text-sm text-mute">
          Quickest: Oura and Apple Watch. Slowest: Garmin (but the most data).
        </p>
      </section>

      {/* Tabs + content */}
      <section className="mx-auto max-w-prose px-6 pb-20">
        <ExportInstructions initial={initial} />

        <div className="mt-16 border-t border-line pt-8">
          <Link
            href="/#upload"
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-6 py-3 text-paper font-medium hover:bg-accent"
          >
            I have my file &rarr; upload it
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-mute">
          Still stuck? Email{" "}
          <a
            className="underline"
            href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || "ben@alfredapp.com.au"}`}
          >
            {process.env.NEXT_PUBLIC_CONTACT_EMAIL || "ben@alfredapp.com.au"}
          </a>{" "}
          and I&rsquo;ll walk you through it.
        </div>
      </footer>
    </main>
  );
}
