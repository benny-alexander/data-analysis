"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import posthog from "posthog-js";

// Tiny helper — safe to call before or without PostHog init.
function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    posthog.capture(event, props);
  } catch {
    /* ignore — analytics must never break the form */
  }
}

// Server-side /api/submit is bounded by Vercel's ~4.5 MB serverless body
// limit. Keep the client ceilings a touch below that so people see the
// friendly oversize fallback (WeTransfer) instead of a 413 from the server.
const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB per file
const MAX_TOTAL_BYTES = 4 * 1024 * 1024; // 4 MB total
const MAX_FILES = 5;

const ACCEPT =
  ".zip,.csv,.tsv,.json,.xml,.fit,.gpx,.tcx,application/zip,application/json,application/xml,text/csv,text/xml,application/octet-stream";

const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "ben@alfredapp.com.au";

type Step = 1 | 2;
type Status = "idle" | "uploading" | "submitting" | "done" | "error";

type Oversize = {
  file: File;
  reason: "single" | "total" | "count";
};

function fileKey(f: File): string {
  return `${f.name}:${f.size}`;
}

function formatBytes(n: number): string {
  if (n >= 1024 * 1024 * 1024) return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${n} B`;
}

export default function UploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [files, setFiles] = useState<File[]>([]);
  const [oversize, setOversize] = useState<Oversize | null>(null);
  const [isDragging, setDragging] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});

  const totalBytes = useMemo(
    () => files.reduce((sum, f) => sum + f.size, 0),
    [files],
  );

  const addFiles = useCallback(
    (picked: FileList | File[] | null) => {
      setError(null);
      if (!picked || picked.length === 0) return;

      const incoming = Array.from(picked);
      const existingKeys = new Set(files.map(fileKey));
      const current = [...files];
      let runningTotal = totalBytes;

      for (const f of incoming) {
        // skip empties silently (macOS Finder sometimes includes junk)
        if (f.size === 0) continue;

        // dedup by name+size
        if (existingKeys.has(fileKey(f))) continue;

        // single-file size check
        if (f.size > MAX_FILE_BYTES) {
          track("oversize_blocked", { reason: "single", size_mb: +(f.size / 1024 / 1024).toFixed(2) });
          setOversize({ file: f, reason: "single" });
          return;
        }

        // count check
        if (current.length >= MAX_FILES) {
          track("oversize_blocked", { reason: "count" });
          setOversize({ file: f, reason: "count" });
          return;
        }

        // total size check
        if (runningTotal + f.size > MAX_TOTAL_BYTES) {
          track("oversize_blocked", { reason: "total", size_mb: +((runningTotal + f.size) / 1024 / 1024).toFixed(2) });
          setOversize({ file: f, reason: "total" });
          return;
        }

        current.push(f);
        existingKeys.add(fileKey(f));
        runningTotal += f.size;
      }

      const added = current.length - files.length;
      if (added > 0) {
        track("file_added", {
          files_total: current.length,
          total_mb: +(runningTotal / 1024 / 1024).toFixed(2),
        });
      }

      setFiles(current);
    },
    [files, totalBytes],
  );

  const removeFile = (key: string) => {
    setFiles((prev) => prev.filter((f) => fileKey(f) !== key));
    setError(null);
  };

  const clearAll = () => {
    setFiles([]);
    setStep(1);
    setError(null);
    setOversize(null);
    setProgress({});
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (addMoreInputRef.current) addMoreInputRef.current.value = "";
  };

  const dismissOversize = () => {
    setOversize(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (addMoreInputRef.current) addMoreInputRef.current.value = "";
  };

  const proceedToStep2 = () => {
    if (files.length === 0) {
      setError("Pick at least one file first.");
      return;
    }
    track("step2_reached", {
      files_count: files.length,
      total_mb: +(totalBytes / 1024 / 1024).toFixed(2),
    });
    setStep(2);
  };

  const onDrop: React.DragEventHandler<HTMLLabelElement> = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError(null);

    if (files.length === 0) {
      setError("No files attached. Go back and add some.");
      setStep(1);
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    const firstName = ((formData.get("firstName") as string) || "").trim();
    const email = ((formData.get("email") as string) || "").trim();
    const goal = ((formData.get("goal") as string) || "").trim();
    const consent = formData.get("consent") === "on";

    if (!firstName) return setError("Please tell me your first name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return setError("Please enter a valid email address.");
    if (goal.length < 10)
      return setError(
        "Tell me a bit more about what you're hoping for (10+ characters).",
      );
    if (!consent)
      return setError("Please tick the consent box so I can process your data.");

    track("submit_attempted", {
      files_count: files.length,
      total_mb: +(totalBytes / 1024 / 1024).toFixed(2),
    });

    // Identify the person in PostHog so the session and any future visits
    // are linked to a real human. We mask inputs in replays — this is the
    // one place we consciously attach PII, after consent.
    try {
      posthog.identify(email, { name: firstName, email });
    } catch {
      /* ignore */
    }

    try {
      setStatus("uploading");

      // Build one multipart payload — files + contact details.
      const payload = new FormData();
      payload.append("firstName", firstName);
      payload.append("email", email);
      payload.append("goal", goal);
      payload.append("consent", "on");
      for (const file of files) {
        payload.append("files", file, file.name);
      }

      // Use XHR so we can report real upload progress. fetch() doesn't
      // expose upload progress events.
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/submit");

        xhr.upload.onprogress = (ev) => {
          if (!ev.lengthComputable) return;
          const pct = Math.round((ev.loaded / ev.total) * 100);
          // Share the same percentage across all chips — the browser
          // sends them as one multipart body, so they finish together.
          setProgress(() => {
            const next: Record<string, number> = {};
            for (const f of files) next[fileKey(f)] = pct;
            return next;
          });
        };

        xhr.upload.onload = () => {
          // Upload body finished; server is now processing.
          setStatus("submitting");
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
            return;
          }
          let msg = "Submission failed";
          try {
            const body = JSON.parse(xhr.responseText || "{}");
            if (body && typeof body.error === "string") msg = body.error;
          } catch {
            /* ignore */
          }
          if (xhr.status === 413) {
            msg =
              "Your upload is larger than 4 MB total. Remove a file or use the WeTransfer fallback on the oversize screen.";
          }
          reject(new Error(msg));
        };

        xhr.onerror = () =>
          reject(
            new Error(
              "Network error during upload. Check your connection and try again.",
            ),
          );
        xhr.ontimeout = () =>
          reject(new Error("Upload timed out. Try again."));

        xhr.send(payload);
      });

      setStatus("done");
      track("submit_succeeded", {
        files_count: files.length,
        total_mb: +(totalBytes / 1024 / 1024).toFixed(2),
      });
      router.push("/success");
    } catch (err) {
      console.error(err);
      setStatus("error");
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Try again, or email me directly.";
      track("submit_failed", { message });
      setError(message);
    }
  };

  const busy = status === "uploading" || status === "submitting";
  const overallProgress =
    files.length > 0
      ? Math.round(
          files.reduce((acc, f) => acc + (progress[fileKey(f)] ?? 0), 0) /
            files.length,
        )
      : 0;

  /* =========================================================================
     STEP 1 — drop files
     ========================================================================= */
  if (step === 1) {
    // Oversize overlay takes over Step 1 if present
    if (oversize) {
      return (
        <OversizeBlock
          oversize={oversize}
          totalBytes={totalBytes}
          onDismiss={dismissOversize}
        />
      );
    }

    // Empty state — big drop zone
    if (files.length === 0) {
      return (
        <div>
          <label
            htmlFor="file"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={[
              "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-20 text-center cursor-pointer transition",
              isDragging
                ? "border-accent bg-accent/10 scale-[1.01]"
                : "border-line bg-white hover:border-mute",
            ].join(" ")}
          >
            <DropIcon className={isDragging ? "text-accent" : "text-mute"} />
            <p className="mt-5 font-serif text-2xl md:text-3xl tracking-tight">
              Drop your data export here
            </p>
            <p className="mt-3 text-mute">
              or{" "}
              <span className="underline hidden md:inline">click to choose</span>
              <span className="underline md:hidden">
                tap to upload from Files
              </span>
            </p>
            <p className="mt-6 text-xs text-mute">
              .csv, .xml, .json, .zip &middot; up to 4 MB total
            </p>
            <p className="mt-2 text-xs text-mute md:hidden max-w-[22rem]">
              On iPhone? Your export should be in your Files app (iCloud Drive,
              Downloads, or wherever you saved it).
            </p>
            <input
              ref={fileInputRef}
              id="file"
              name="file"
              type="file"
              accept={ACCEPT}
              multiple
              className="sr-only"
              onChange={(e) => addFiles(e.target.files)}
            />
          </label>

          {error && (
            <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}
        </div>
      );
    }

    // Has files state — list + add-more + continue
    return (
      <div>
        <div className="rounded-xl border border-line bg-white p-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-sm text-mute">
              {files.length} {files.length === 1 ? "file" : "files"} &middot;{" "}
              {formatBytes(totalBytes)}
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="text-sm text-mute hover:text-ink underline underline-offset-4"
            >
              Clear all
            </button>
          </div>

          <ul className="space-y-2">
            {files.map((f) => (
              <FileChip
                key={fileKey(f)}
                file={f}
                onRemove={() => removeFile(fileKey(f))}
              />
            ))}
          </ul>

          {files.length < MAX_FILES && (
            <div className="mt-3">
              <label
                htmlFor="file-more"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={[
                  "flex items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-4 text-sm cursor-pointer transition",
                  isDragging
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-line text-mute hover:border-mute hover:text-ink",
                ].join(" ")}
              >
                <PlusIcon />
                <span>Add another file</span>
                <input
                  ref={addMoreInputRef}
                  id="file-more"
                  type="file"
                  accept={ACCEPT}
                  multiple
                  className="sr-only"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </label>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={proceedToStep2}
          className="mt-6 w-full rounded-lg bg-ink px-6 py-4 text-paper font-medium hover:bg-accent transition"
        >
          Continue &rarr;
        </button>
      </div>
    );
  }

  /* =========================================================================
     STEP 2 — contact + goal
     ========================================================================= */
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* File summary — compact list */}
      <div className="rounded-xl border border-line bg-white p-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-sm text-mute">
            {files.length} {files.length === 1 ? "file" : "files"} &middot;{" "}
            {formatBytes(totalBytes)}
            {status === "uploading" && (
              <span className="ml-2 text-accent">
                &middot; uploading {overallProgress}%
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={clearAll}
            disabled={busy}
            className="text-sm text-mute hover:text-ink underline underline-offset-4 disabled:opacity-50"
          >
            Change
          </button>
        </div>

        <ul className="space-y-2">
          {files.map((f) => (
            <FileChipCompact
              key={fileKey(f)}
              file={f}
              progress={progress[fileKey(f)] ?? 0}
              uploading={status === "uploading"}
            />
          ))}
        </ul>
      </div>

      {/* Prompt */}
      <div className="pt-2">
        <h2 className="font-serif text-2xl tracking-tight">
          Where should I send your read?
        </h2>
      </div>

      {/* Name + Email */}
      <div className="grid gap-6 md:grid-cols-2">
        <Field
          label="First name"
          name="firstName"
          autoComplete="given-name"
          required
          disabled={busy}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={busy}
        />
      </div>

      {/* Goal — dual-prompt, most important field */}
      <div>
        <label htmlFor="goal" className="block text-sm font-medium mb-1">
          What is your goal?
        </label>
        <p className="text-xs text-mute mb-2">
          And anything else you&rsquo;d like me to look for in your data.
        </p>
        <textarea
          id="goal"
          name="goal"
          rows={4}
          required
          disabled={busy}
          placeholder="e.g. I want more consistent sleep. I'd also love to know why my heart rate is so high on rest days."
          className="w-full rounded-lg border border-line bg-white px-4 py-3 text-ink placeholder:text-mute focus:border-accent focus:outline-none disabled:opacity-60"
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-ink/80">
        <input
          type="checkbox"
          name="consent"
          disabled={busy}
          className="mt-1 h-4 w-4 rounded border-line"
          required
        />
        <span>
          I consent to Ben analysing this data to send me a personal insight.
          Not medical advice.
        </span>
      </label>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-ink px-6 py-4 text-paper font-medium hover:bg-accent disabled:opacity-60 transition"
      >
        {status === "uploading"
          ? `Uploading... ${overallProgress}%`
          : status === "submitting"
            ? "Sending..."
            : "Send it across"}
      </button>
    </form>
  );
}

/* ===========================================================================
   Subcomponents
   =========================================================================== */

function FileChip({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <FileIcon />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-mute">{formatBytes(file.size)}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="flex-none h-9 w-9 rounded-full text-mute hover:bg-line hover:text-ink flex items-center justify-center transition"
      >
        <XIcon />
      </button>
    </li>
  );
}

function FileChipCompact({
  file,
  progress,
  uploading,
}: {
  file: File;
  progress: number;
  uploading: boolean;
}) {
  return (
    <li className="rounded-lg border border-line bg-paper px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <FileIcon />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-mute">
            {formatBytes(file.size)}
            {uploading && <span className="ml-2 text-accent">&middot; {Math.round(progress)}%</span>}
            {!uploading && progress === 100 && (
              <span className="ml-2 text-accent">&middot; uploaded</span>
            )}
          </p>
          {uploading && (
            <div className="mt-2 h-1 w-full rounded-full bg-line overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function OversizeBlock({
  oversize,
  totalBytes,
  onDismiss,
}: {
  oversize: Oversize;
  totalBytes: number;
  onDismiss: () => void;
}) {
  const { file, reason } = oversize;
  const sizeLabel = formatBytes(file.size);

  const headline =
    reason === "single"
      ? `That file is ${sizeLabel} — a bit big for the form.`
      : reason === "total"
        ? `That would push you past 4 MB.`
        : `That's more than ${MAX_FILES} files.`;

  const explainer =
    reason === "single"
      ? `The form caps uploads at 4 MB per file. Garmin GDPR and Apple Health exports are often much larger than that — WeTransfer handles them easily.`
      : reason === "total"
        ? `You've already got ${formatBytes(totalBytes)} queued. Combined with this file (${sizeLabel}) it crosses the 4 MB form limit.`
        : `I only take ${MAX_FILES} files at a time. Remove one first, or send everything via WeTransfer so I can read it together.`;

  const mailSubject = encodeURIComponent("My data export is too big for the form");
  const mailBody = encodeURIComponent(
    `Hi Ben,\n\nMy file is too big for the upload form:\n- ${file.name} (${sizeLabel})\n\nI'll send it via WeTransfer (https://wetransfer.com) to this email.\n\nMy goal / what I'm hoping for:\n[tell Ben what you want from the read]\n\nThanks,\n`,
  );
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${mailSubject}&body=${mailBody}`;

  return (
    <div className="rounded-xl border border-line bg-white px-6 py-8">
      <div className="flex items-start gap-4">
        <div className="flex-none h-10 w-10 rounded-full bg-accent/10 text-accent flex items-center justify-center">
          <WarnIcon />
        </div>
        <div className="min-w-0">
          <h3 className="font-serif text-2xl tracking-tight">{headline}</h3>
          <p className="mt-3 text-sm text-ink/80 leading-relaxed">{explainer}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <a
          href={mailto}
          className="block rounded-lg bg-ink px-5 py-4 text-paper font-medium hover:bg-accent transition"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div>Send it via WeTransfer instead</div>
              <div className="text-xs opacity-70 mt-0.5 font-normal">
                Free, no account. Send to {CONTACT_EMAIL}.
              </div>
            </div>
            <span aria-hidden>&rarr;</span>
          </div>
        </a>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full rounded-lg border border-line bg-paper px-5 py-4 text-ink font-medium hover:border-mute transition"
        >
          {reason === "count" ? "Let me remove one instead" : "Try a different file"}
        </button>
      </div>

      <p className="mt-6 text-xs text-mute leading-relaxed">
        <strong className="text-ink">Why WeTransfer?</strong> It handles files up to
        2 GB free. Once your file&rsquo;s on the way, I&rsquo;ll reply to your email
        and walk you through the rest.
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  autoComplete,
  disabled,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium mb-2">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        disabled={disabled}
        className="w-full rounded-lg border border-line bg-white px-4 py-3 text-ink placeholder:text-mute focus:border-accent focus:outline-none disabled:opacity-60"
      />
    </div>
  );
}

/* ===========================================================================
   Icons
   =========================================================================== */

function DropIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="56"
      height="56"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3v12" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-accent flex-none"
      aria-hidden
    >
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
      <path d="M14 3v6h6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    </svg>
  );
}
