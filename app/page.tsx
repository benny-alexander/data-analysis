import Link from "next/link";
import UploadForm from "./components/UploadForm";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "The Read";
const founderName = process.env.NEXT_PUBLIC_FOUNDER_NAME || "Ben";
// Defaults to /founder.jpg in the public folder. Set the env var to
// override (e.g. to a Blob or CDN URL). Leave the file absent and unset
// the env var to fall back to the initial-in-a-circle placeholder.
const founderPhotoUrl =
  process.env.NEXT_PUBLIC_FOUNDER_PHOTO_URL || "/founder.png";

const TRACKERS: { label: string; slug: string }[] = [
  { label: "Apple Watch", slug: "apple" },
  { label: "Garmin", slug: "garmin" },
  { label: "WHOOP", slug: "whoop" },
  { label: "Strava", slug: "strava" },
  { label: "Oura", slug: "oura" },
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
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-ink/70">
            {TRACKERS.map((t, i) => (
              <li key={t.slug} className="flex items-center gap-5">
                <Link
                  href={`/how-to-export?device=${t.slug}`}
                  className="font-medium underline-offset-4 hover:underline hover:text-ink transition"
                >
                  {t.label}
                </Link>
                {i < TRACKERS.length - 1 && (
                  <span className="text-line" aria-hidden>
                    &middot;
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The form */}
      <section id="upload" className="mx-auto max-w-2xl px-6 pb-6">
        <UploadForm />
        <p className="mt-4 text-center text-xs text-mute">
          Your export stays with me. Deleted once I&rsquo;ve sent your read. No
          resale, no mailing list.
        </p>
        <p className="mt-4 text-center text-sm text-mute">
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

      {/* How it works — makes the transaction legible */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="font-serif text-3xl tracking-tight text-center mb-12">
            How it works
          </h2>
          <div className="grid gap-10 md:grid-cols-3">
            <Step
              n={1}
              title="Upload your fitness data"
              body="Export it from Apple Watch, Garmin, WHOOP, Strava or Oura and drop it in. Takes 5 minutes to a few days depending on your tracker."
            />
            <Step
              n={2}
              title="AI analyses it against your goals"
              body="AI reads every night, every workout and every session — looking for the patterns that matter for what you&rsquo;re trying to achieve."
            />
            <Step
              n={3}
              title="I interpret and suggest changes"
              body="Based on your context, I email you a few habit changes to choose from &mdash; not a fixed plan, just options that fit your life this week."
            />
          </div>
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
                Written by me. No dashboard, no score out of 100, no app to
                download.
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

function Step({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink text-paper text-sm font-medium">
          {n}
        </span>
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className="text-sm text-ink/70 leading-relaxed">{body}</p>
    </div>
  );
}
