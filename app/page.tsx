import Link from "next/link";
import type { IconType } from "react-icons";
import { FaLinkedin } from "react-icons/fa";
import { SiApple, SiGarmin, SiStrava } from "react-icons/si";
import ExportInstructions from "./components/ExportInstructions";
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
        <p className="text-xs uppercase tracking-[0.18em] text-accent font-medium mb-5">
          A personal read of your fitness data
        </p>
        <h1 className="font-serif text-4xl md:text-5xl leading-[1.1] tracking-tight">
          Find the habit draining your recovery.
        </h1>
        <p className="mt-6 text-lg text-ink/80 max-w-xl mx-auto">
          AI finds the patterns in your data so you can sleep better and hit
          your fitness goals.
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

      {/* How it works — video-first, above the upload so people see the
          explanation before being asked to hand over their data. */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="font-serif text-3xl tracking-tight text-center">
            How it works
          </h2>
          <p className="mt-3 text-center text-sm text-mute">
            30 seconds with {founderName}.
          </p>

          {howItWorksVideoId && (
            <HowItWorksVideo
              videoId={howItWorksVideoId}
              title={`How ${siteName} works — ${founderName}`}
            />
          )}

          <p className="mt-6 text-center text-base text-ink/80">
            Upload your data &rarr; I&rsquo;ll email you a short report within
            24 hours.
          </p>
        </div>
      </section>

      {/* The form */}
      <section id="upload" className="border-t border-line">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <UploadForm />

          <details className="mt-8 rounded-2xl border border-line bg-white">
            <summary className="cursor-pointer list-none px-6 py-4 text-sm font-medium text-ink flex items-center justify-between hover:text-accent">
              <span>Don&rsquo;t know how to export your data?</span>
              <span className="text-mute text-xs uppercase tracking-widest">
                Show steps
              </span>
            </summary>
            <div className="border-t border-line px-6 py-8">
              <ExportInstructions />
              <p className="mt-8 text-sm text-mute">
                Prefer the full guide?{" "}
                <Link
                  href="/how-to-export"
                  className="text-accent underline underline-offset-4 hover:text-ink"
                >
                  Open it on its own page
                </Link>
                .
              </p>
            </div>
          </details>
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
              <p className="text-xs uppercase tracking-[0.14em] text-mute mb-2">
                Read by a human
              </p>
              <h3 className="font-serif text-2xl tracking-tight">
                Made by {founderName}.
              </h3>
              <p className="mt-3 text-ink/80 leading-relaxed">
                I&rsquo;m a former Wallabies prop. I played professional rugby
                for 11 years, and through all of it, coaches and trainers tracked
                my data for me. When I retired, I had to learn to read it myself
                &mdash; and AI is what finally helped me make sense of it. I want
                to help you do the same, so you can sleep better, feel great,
                and hit your fitness goals.
              </p>
              <div className="mt-5">
                <a
                  href="https://www.linkedin.com/in/ben-alexander-684228b6/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-line bg-paper px-4 py-2 text-sm font-medium text-ink hover:border-mute transition"
                >
                  <FaLinkedin className="h-4 w-4" style={{ color: "#0A66C2" }} aria-hidden />
                  Learn more about {founderName}
                </a>
              </div>
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
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="font-medium mb-2">On track or off track</h3>
              <p className="text-sm text-ink/70 leading-relaxed">
                A clear read on whether your week is moving you toward your
                health and fitness goals &mdash; or quietly pulling you away
                from them.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">One or two things to try</h3>
              <p className="text-sm text-ink/70 leading-relaxed">
                Small, specific experiments you can run next week. No 30-day
                plan, no dashboard to check &mdash; just the next useful move.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Ben */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-2xl border border-line bg-white p-8 md:p-10 text-center">
            <h2 className="font-serif text-2xl md:text-3xl tracking-tight">
              Got a question?
            </h2>
            <p className="mt-3 text-ink/80">
              Message me directly.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-center">
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                    `Hi ${founderName}, I've got a question about ${siteName}.`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-accent px-6 py-3 text-paper font-medium hover:opacity-90 transition"
                >
                  Message on WhatsApp
                </a>
              )}
              <a
                href={`mailto:${contactEmail}?subject=${encodeURIComponent(
                  `Question about ${siteName}`,
                )}`}
                className="rounded-lg border border-line bg-paper px-6 py-3 text-ink font-medium hover:border-mute transition"
              >
                Email {founderName}
              </a>
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

