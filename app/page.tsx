import Link from "next/link";
import type { IconType } from "react-icons";
import { SiApple, SiGarmin, SiStrava } from "react-icons/si";
import HowItWorksVideo from "./components/HowItWorksVideo";
import UploadForm from "./components/UploadForm";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "The Read";
const founderName = process.env.NEXT_PUBLIC_FOUNDER_NAME || "Ben";
// Defaults to /founder.jpg in the public folder. Set the env var to
// override (e.g. to a Blob or CDN URL). Leave the file absent and unset
// the env var to fall back to the initial-in-a-circle placeholder.
const founderPhotoUrl =
  process.env.NEXT_PUBLIC_FOUNDER_PHOTO_URL || "/founder.png";
const contactEmail =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "ben@alfredapp.com.au";
// WhatsApp number in international format, digits only (e.g. 61412345678).
// If blank, the Contact block hides the WhatsApp button.
const whatsappNumber = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ""
).replace(/[^0-9]/g, "");
// YouTube ID for the founder's how-it-works video. Leave blank to hide.
const howItWorksVideoId =
  process.env.NEXT_PUBLIC_HOW_IT_WORKS_VIDEO_ID || "JHWEjV330UQ";
// Count of reads delivered so far. Bump via Vercel env var without a commit.
const readsDelivered = Number(
  process.env.NEXT_PUBLIC_READS_DELIVERED || "17",
);

// Apple, Garmin, Strava have logomarks in Simple Icons (via react-icons/si).
// WHOOP and Oura don't ship with Simple Icons — render them as uppercase
// wordmarks styled to roughly match the logomark height.
//
// Colors: each tracker uses its actual brand color. Apple, WHOOP and Oura
// are genuinely monochrome brands (their logos are solid black), so they
// stay black — not for lack of care, that's their brand. Garmin uses
// their marketing blue (Simple Icons lists black but Garmin's own
// collateral leans blue), and Strava gets its iconic orange.
//
// Garmin's logomark is a wordmark-with-triangle — wider than the others
// and hard to read at h-6. It gets bumped to h-8 so the letterforms are
// legible alongside Apple and Strava.
type Tracker =
  | {
      label: string;
      slug: string;
      kind: "icon";
      Icon: IconType;
      color: string;
      sizeClass: string;
    }
  | { label: string; slug: string; kind: "wordmark"; color: string };

const TRACKERS: Tracker[] = [
  {
    label: "Apple Watch",
    slug: "apple",
    kind: "icon",
    Icon: SiApple,
    color: "#000000",
    sizeClass: "h-6 w-auto",
  },
  {
    label: "Garmin",
    slug: "garmin",
    kind: "icon",
    Icon: SiGarmin,
    color: "#007CC3",
    // Garmin's wordmark-with-triangle renders with short letters relative
    // to the SVG bounding box, so it needs to be substantially taller than
    // other marks to match WHOOP's visible text height.
    sizeClass: "h-14 w-auto",
  },
  { label: "WHOOP", slug: "whoop", kind: "wordmark", color: "#000000" },
  {
    label: "Strava",
    slug: "strava",
    kind: "icon",
    Icon: SiStrava,
    color: "#FC4C02",
    sizeClass: "h-6 w-auto",
  },
  { label: "Oura", slug: "oura", kind: "wordmark", color: "#000000" },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <span className="font-serif text-xl tracking-tight">
            {siteName}
            <span className="text-accent">.</span>
          </span>
          <nav className="text-sm text-mute">
            <Link href="/how-to-export" className="hover:text-ink">
              How do I get my data?
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-14 pb-8 text-center">
        <h1 className="font-serif text-4xl md:text-5xl leading-[1.1] tracking-tight">
          Sleep, Move and Feel Better
        </h1>
        <p className="mt-6 text-lg text-ink/80 max-w-xl mx-auto">
          AI analyses your data. I tell you what it means.
        </p>

        {/* Tracker row — answers "what data?" at a glance */}
        <div className="mt-8">
          <p className="text-xs uppercase tracking-[0.14em] text-mute mb-3">
            Works with
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 min-h-14">
            {TRACKERS.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/how-to-export?device=${t.slug}`}
                  aria-label={`How to export from ${t.label}`}
                  title={t.label}
                  style={{ color: t.color }}
                  className="inline-flex items-center opacity-90 hover:opacity-100 transition"
                >
                  {t.kind === "icon" ? (
                    <t.Icon className={t.sizeClass} aria-hidden />
                  ) : (
                    <span className="text-sm font-bold tracking-[0.15em] uppercase">
                      {t.label}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The form */}
      <section id="upload" className="mx-auto max-w-2xl px-6 pb-6">
        <UploadForm />
        <p className="mt-6 text-center text-sm text-mute">
          Don&rsquo;t know how to export your data?{" "}
          <Link
            href="/how-to-export"
            className="text-accent underline underline-offset-4 hover:text-ink"
          >
            Click here
          </Link>
          .
        </p>
      </section>

      {/* How it works — video-first with a text fallback for skimmers */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="font-serif text-3xl tracking-tight text-center">
            How it works
          </h2>

          {howItWorksVideoId && (
            <HowItWorksVideo
              videoId={howItWorksVideoId}
              title={`How ${siteName} works — ${founderName}`}
            />
          )}

          <p className="mt-6 text-center text-sm text-ink/70">
            AI runs the analysis. {founderName} interprets it and emails you a
            report within 24 hours.
          </p>
        </div>
      </section>

      {/* Editorial stat — quiet badge of credibility, framed like a colophon */}
      {readsDelivered > 0 && (
        <section className="border-t border-line">
          <div className="mx-auto max-w-3xl px-6 py-24 md:py-28 text-center">
            <p className="text-[11px] uppercase tracking-[0.32em] text-mute">
              Reads delivered to date
            </p>
            <p
              className="mt-8 font-serif text-[8.5rem] md:text-[12rem] leading-[0.85] text-accent reads-counter-rise"
              aria-label={`${readsDelivered} reads delivered`}
            >
              {readsDelivered}
            </p>
            <div
              className="mx-auto mt-10 h-px w-16 bg-line"
              aria-hidden="true"
            />
            <p className="mt-8 font-serif italic text-base md:text-lg text-mute max-w-md mx-auto leading-relaxed">
              Each one interpreted by {founderName}, not a chatbot.
            </p>
          </div>
        </section>
      )}

      {/* FAQ — the questions Ben gets asked before people upload */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="font-serif text-3xl tracking-tight text-center">
            Common questions
          </h2>
          <dl className="mt-12 space-y-10">
            <div>
              <dt className="font-serif text-xl tracking-tight">
                What happens to my data?
              </dt>
              <dd className="mt-3 text-ink/80 leading-relaxed">
                It goes to private storage I control. I read it once to write
                your report, then I delete it. Not sold, not shared, not kept.
              </dd>
            </div>
            <div>
              <dt className="font-serif text-xl tracking-tight">
                How do I get my data out of my tracker?
              </dt>
              <dd className="mt-3 text-ink/80 leading-relaxed">
                Every tracker has an export. Apple Health, Garmin, Strava,
                WHOOP, and Oura all let you download a copy in a few taps.
                Step-by-step instructions for each one are{" "}
                <Link href="/how-to-export" className="underline">
                  here
                </Link>
                .
              </dd>
            </div>
            <div>
              <dt className="font-serif text-xl tracking-tight">
                Why are you doing this?
              </dt>
              <dd className="mt-3 text-ink/80 leading-relaxed">
                While I was playing rugby I had amazing trainers who made
                sense of my data for me. When I retired I had to learn to
                read it myself. Once I could see the patterns, training,
                sleep, and energy all started to make sense. I started doing
                it for myself, then for a few mates. It&apos;s free because
                I&apos;d rather more people get something useful from their
                data.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Credibility — who's actually reading your data */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-2xl border border-line bg-white p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
            <div className="flex-none">
              {founderPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={founderPhotoUrl}
                  alt={founderName}
                  className="h-24 w-24 md:h-28 md:w-28 rounded-full object-cover object-top border border-line"
                />
              ) : (
                <div className="h-24 w-24 md:h-28 md:w-28 rounded-full bg-accent/10 text-accent flex items-center justify-center font-serif text-3xl border border-accent/20">
                  {founderName.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-serif text-2xl tracking-tight">
                Made by {founderName}.
              </h3>
              <p className="mt-3 text-ink/80 leading-relaxed">
                Former Wallabies prop. For 11 years, coaches and trainers read
                my data for me. When I retired I had to learn it myself. AI
                is what finally helped me see the patterns. Now I do that for
                other people.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Value prop */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="font-serif text-3xl tracking-tight text-center mb-10">
            What you&rsquo;ll get
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="font-medium mb-2">A personal read</h3>
              <p className="text-sm text-ink/70 leading-relaxed">
                Interpreted by me. No dashboard, no score out of 100, no app
                to download.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Honest observations</h3>
              <p className="text-sm text-ink/70 leading-relaxed">
                What&rsquo;s working, what isn&rsquo;t, and the pattern
                underneath the numbers your app is hiding.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">One focused experiment</h3>
              <p className="text-sm text-ink/70 leading-relaxed">
                Something small and specific you can run this week. Not a
                30-day plan you&rsquo;ll abandon.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who this is for — qualifying filter before the contact CTA */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="font-serif text-3xl tracking-tight text-center">
            Who this is for
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-line bg-white p-6 md:p-8">
              <h3 className="font-medium text-ink">Best for</h3>
              <ul className="mt-5 space-y-3 text-sm text-ink/80 leading-relaxed">
                {[
                  "You've got months of wearable data and don't know what it means.",
                  "Your app says you're fine but you don't feel fine.",
                  "You're done chasing scores, rings, and badges.",
                  "You care about sleep, recovery, and training load. Not weight or aesthetics.",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <svg
                      viewBox="0 0 20 20"
                      className="mt-[3px] h-4 w-4 flex-none text-accent"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M4 10l4 4 8-8" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-line bg-white p-6 md:p-8">
              <h3 className="font-medium text-ink">Not for</h3>
              <ul className="mt-5 space-y-3 text-sm text-ink/80 leading-relaxed">
                {[
                  "People wanting ongoing coaching or weekly check-ins. This is one-off.",
                  "People wanting a number to chase. No scores here.",
                  "Anyone after medical advice or diagnosis.",
                  "People who don't track. No data, nothing to read.",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <svg
                      viewBox="0 0 20 20"
                      className="mt-[3px] h-4 w-4 flex-none text-warn"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 5l10 10M15 5l-10 10" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Ben */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-2xl border border-line bg-white p-8 md:p-10 text-center">
            <h2 className="font-serif text-2xl md:text-3xl tracking-tight">
              Got a question?
            </h2>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-center">
              <a
                href={`mailto:${contactEmail}?subject=${encodeURIComponent(
                  `Question about ${siteName}`,
                )}`}
                className="rounded-lg border border-line bg-paper px-6 py-3 text-ink font-medium hover:border-mute transition"
              >
                Email {founderName}
              </a>
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                    `Hi ${founderName}, I've got a question about ${siteName}.`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-accent px-6 py-3 text-paper font-medium hover:opacity-90 transition"
                >
                  WhatsApp {founderName}
                </a>
              )}
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
              href={`mailto:${contactEmail}`}
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

