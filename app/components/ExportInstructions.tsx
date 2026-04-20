"use client";

import { useState } from "react";

export type Device = "apple" | "garmin" | "whoop" | "strava" | "oura";

export const VALID_DEVICES = new Set<Device>([
  "apple",
  "garmin",
  "whoop",
  "strava",
  "oura",
]);

const DEVICES: { key: Device; label: string }[] = [
  { key: "apple", label: "Apple Watch" },
  { key: "garmin", label: "Garmin" },
  { key: "whoop", label: "WHOOP" },
  { key: "strava", label: "Strava" },
  { key: "oura", label: "Oura" },
];

export default function ExportInstructions({
  initial = "apple",
}: {
  initial?: Device;
}) {
  const [active, setActive] = useState<Device>(initial);

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-line pb-4">
        {DEVICES.map((d) => (
          <button
            key={d.key}
            onClick={() => setActive(d.key)}
            className={[
              "px-4 py-2 rounded-full text-sm font-medium transition",
              active === d.key
                ? "bg-ink text-paper"
                : "bg-white border border-line text-ink hover:border-mute",
            ].join(" ")}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="mt-10">
        {active === "apple" && <AppleHealth />}
        {active === "garmin" && <Garmin />}
        {active === "whoop" && <Whoop />}
        {active === "strava" && <Strava />}
        {active === "oura" && <Oura />}
      </div>
    </div>
  );
}

function Section({
  title,
  time,
  children,
}: {
  title: string;
  time: string;
  children: React.ReactNode;
}) {
  return (
    <article>
      <h2 className="font-serif text-3xl tracking-tight">{title}</h2>
      <p className="mt-2 text-sm text-mute">
        <strong className="text-ink">Time:</strong> {time}
      </p>
      <div className="mt-6 space-y-4 text-ink/85 leading-relaxed">{children}</div>
    </article>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="flex-none inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink text-paper text-sm font-medium">
        {n}
      </span>
      <div>{children}</div>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-white px-4 py-3 text-sm text-ink/80">
      <strong>Tip:</strong> {children}
    </div>
  );
}

function AppleHealth() {
  return (
    <Section title="Apple Watch / Apple Health" time="About 5 minutes. File can be 100–500 MB.">
      <Step n={1}>
        Open the <strong>Health</strong> app on your iPhone (not your Mac).
      </Step>
      <Step n={2}>
        Tap your profile picture or initials in the top right corner.
      </Step>
      <Step n={3}>
        Scroll all the way to the bottom and tap <strong>Export All Health Data</strong>.
      </Step>
      <Step n={4}>
        Tap <strong>Export</strong>. Wait 1–5 minutes while it bundles everything into a zip.
      </Step>
      <Step n={5}>
        A share sheet opens. Save the <code>export.zip</code> to Files (easiest), AirDrop
        to your Mac, or email it to yourself.
      </Step>
      <Step n={6}>
        On your desktop, drag that <code>export.zip</code> onto the upload form.
      </Step>
      <Tip>
        Apple Health exports are big because they include everything — years of steps,
        heart rate samples, workouts. That size is normal.
      </Tip>
    </Section>
  );
}

function Garmin() {
  return (
    <Section title="Garmin Connect" time="24–72 hours wait. Worth it — it's the most comprehensive export.">
      <Step n={1}>
        Go to{" "}
        <a
          href="https://www.garmin.com/account-management/"
          target="_blank"
          rel="noreferrer"
          className="text-accent underline"
        >
          garmin.com/account-management
        </a>{" "}
        and sign in.
      </Step>
      <Step n={2}>
        Find the section called <strong>Export Your Data</strong> (it&rsquo;s labelled as a
        GDPR / privacy data request).
      </Step>
      <Step n={3}>
        Confirm your email. Garmin will start preparing your archive.
      </Step>
      <Step n={4}>
        Wait. Usually 24–72 hours. Sometimes longer during busy periods. Garmin emails you
        when it&rsquo;s ready.
      </Step>
      <Step n={5}>
        When the email arrives, click the download link and save the <code>.zip</code> file.
        The link expires after 7 days — don&rsquo;t let it sit.
      </Step>
      <Step n={6}>
        Drag the zip onto the upload form.
      </Step>
      <Tip>
        If Garmin&rsquo;s email never arrives, check spam. If it&rsquo;s still missing after
        a week, request again. This is the slowest export but contains the most signal.
      </Tip>
    </Section>
  );
}

function Whoop() {
  return (
    <Section title="WHOOP" time="About 24 hours. Delivered by email.">
      <Step n={1}>
        Open the <strong>WHOOP</strong> app on your phone.
      </Step>
      <Step n={2}>
        Tap your profile picture (top left) &rarr; <strong>App Settings</strong>.
      </Step>
      <Step n={3}>
        Tap <strong>Data Export</strong> (sometimes listed under Privacy or Membership).
        Request an export.
      </Step>
      <Step n={4}>
        WHOOP emails you within about 24 hours with a download link.
      </Step>
      <Step n={5}>
        Download the <code>.zip</code> from that email and drag it onto the upload form.
      </Step>
      <Tip>
        The menu names shift between app versions. If you can&rsquo;t find &ldquo;Data
        Export&rdquo;, search your settings for &ldquo;data&rdquo; or &ldquo;download&rdquo;.
      </Tip>
    </Section>
  );
}

function Strava() {
  return (
    <Section title="Strava" time="A few hours. Email-delivered .zip.">
      <Step n={1}>
        Go to{" "}
        <a
          href="https://www.strava.com/athlete/delete_your_account"
          target="_blank"
          rel="noreferrer"
          className="text-accent underline"
        >
          strava.com/athlete/delete_your_account
        </a>{" "}
        — don&rsquo;t worry, this same page is also the data-download page. (You&rsquo;re
        not deleting anything unless you click delete.)
      </Step>
      <Step n={2}>
        Scroll to <strong>Download Request</strong> and click{" "}
        <strong>Request Your Archive</strong>.
      </Step>
      <Step n={3}>
        Confirm on the next screen. Strava will email your archive within a few hours.
      </Step>
      <Step n={4}>
        Download the <code>.zip</code> from that email.
      </Step>
      <Step n={5}>
        Drag the zip onto the upload form.
      </Step>
      <Tip>
        The archive contains a file per activity (GPX/FIT) plus summary CSVs. Don&rsquo;t
        extract it — I&rsquo;ll handle that.
      </Tip>
    </Section>
  );
}

function Oura() {
  return (
    <Section title="Oura" time="Instant. Smallest file.">
      <Step n={1}>
        Open the Oura app or go to{" "}
        <a
          href="https://cloud.ouraring.com/"
          target="_blank"
          rel="noreferrer"
          className="text-accent underline"
        >
          cloud.ouraring.com
        </a>{" "}
        on desktop and sign in.
      </Step>
      <Step n={2}>
        Go to <strong>Account</strong> &rarr; <strong>Data Download</strong>.
      </Step>
      <Step n={3}>
        Select at least the last 60 days (more is better — 6–12 months is ideal).
      </Step>
      <Step n={4}>
        Download the CSV bundle.
      </Step>
      <Step n={5}>
        Drag the CSV or zip onto the upload form.
      </Step>
      <Tip>
        More history means a better read. If you&rsquo;ve had the ring for a year, send me
        the whole year.
      </Tip>
    </Section>
  );
}
