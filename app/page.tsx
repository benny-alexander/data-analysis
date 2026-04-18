import Link from "next/link";
import UploadForm from "./components/UploadForm";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "The Read";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <span className="font-serif text-xl tracking-tight">{siteName}</span>
          <nav className="text-sm text-mute">
            <Link href="/how-to-export" className="hover:text-ink">
              How do I get my data?
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero — tight, above the fold */}
      <section className="mx-auto max-w-3xl px-6 pt-12 pb-10 text-center">
        <h1 className="font-serif text-4xl md:text-5xl leading-[1.1] tracking-tight">
          Your watch has been telling you why you&rsquo;re tired.
          <span className="block text-mute mt-2">You just can&rsquo;t see it.</span>
        </h1>
        <p className="mt-6 text-lg text-ink/80 max-w-xl mx-auto">
          Drop your Oura, Garmin, Apple Watch, WHOOP or Strava export below.
          I&rsquo;ll read it personally and email you back with the pattern that matters.
        </p>
      </section>

      {/* The form — visible without scrolling */}
      <section id="upload" className="mx-auto max-w-2xl px-6 pb-20">
        <UploadForm />
        <p className="mt-6 text-center text-sm text-mute">
          Don&rsquo;t know how to export your data?{" "}
          <Link
            href="/how-to-export"
            className="text-accent underline underline-offset-4 hover:text-ink"
          >
            Step-by-step here
          </Link>
          .
        </p>
      </section>

      {/* Value prop — below fold, for the skeptical scroller */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="font-serif text-3xl tracking-tight text-center mb-10">
            What you&rsquo;ll get
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="font-medium mb-2">A personal read</h3>
              <p className="text-sm text-ink/70 leading-relaxed">
                Written by me. No dashboard, no score out of 100, no app to download.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Honest observations</h3>
              <p className="text-sm text-ink/70 leading-relaxed">
                What&rsquo;s working, what isn&rsquo;t, and the pattern underneath the
                numbers your app is hiding.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">One focused experiment</h3>
              <p className="text-sm text-ink/70 leading-relaxed">
                Something small and specific you can run this week &mdash; not a
                30-day plan you&rsquo;ll abandon.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-mute flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <span>
            &copy; {new Date().getFullYear()} {siteName}. Read by a human.
          </span>
          <span className="flex gap-6">
            <Link href="/how-to-export" className="hover:text-ink">
              How to export
            </Link>
            <a
              href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || "ben@alfredapp.com.au"}`}
              className="hover:text-ink"
            >
              Contact
            </a>
          </span>
        </div>
      </footer>
    </main>
  );
}
