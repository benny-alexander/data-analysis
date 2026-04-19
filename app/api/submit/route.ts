import { NextResponse } from "next/server";
import { Resend } from "resend";

// Accepts a JSON submission: contact details plus an array of Blob URLs
// the browser already uploaded directly to Vercel Blob via /api/upload.
// No file bodies cross this function, so the 4.5 MB Vercel serverless
// body limit no longer applies.

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_FILES = 5;
const MAX_TOTAL_BYTES = 1500 * 1024 * 1024; // 1.5 GB aggregate

type SubmittedFile = {
  url: string;
  name: string;
  size: number;
};

type SubmitBody = {
  firstName?: string;
  email?: string;
  goal?: string;
  consent?: boolean;
  files?: SubmittedFile[];
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatBytes(n: number): string {
  if (n >= 1024 * 1024 * 1024)
    return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${n} B`;
}

// Defence in depth — only accept blob URLs we issued.
function isVercelBlobUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.endsWith(".public.blob.vercel-storage.com") ||
      u.hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return NextResponse.json(
      { error: "Could not read the submission. Try again." },
      { status: 400 },
    );
  }

  const firstName = String(body.firstName || "").trim();
  const email = String(body.email || "").trim();
  const goal = String(body.goal || "").trim();
  const consent = body.consent === true;
  const files = Array.isArray(body.files) ? body.files : [];

  if (!firstName) {
    return NextResponse.json({ error: "Missing first name" }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (goal.length < 10) {
    return NextResponse.json({ error: "Goal is too short" }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json({ error: "Consent is required" }, { status: 400 });
  }
  if (files.length === 0) {
    return NextResponse.json({ error: "No files attached" }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Too many files (max ${MAX_FILES})` },
      { status: 400 },
    );
  }

  const cleanFiles: SubmittedFile[] = [];
  for (const f of files) {
    if (!f || typeof f.url !== "string" || typeof f.name !== "string" ||
      typeof f.size !== "number") {
      return NextResponse.json(
        { error: "Malformed file entry" },
        { status: 400 },
      );
    }
    if (!isVercelBlobUrl(f.url)) {
      return NextResponse.json(
        { error: "Unexpected upload location" },
        { status: 400 },
      );
    }
    cleanFiles.push({ url: f.url, name: f.name, size: f.size });
  }

  const totalBytes = cleanFiles.reduce((s, f) => s + f.size, 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    return NextResponse.json(
      { error: "Total upload exceeds 1.5 GB" },
      { status: 413 },
    );
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";
  const resendKey = process.env.RESEND_API_KEY;

  if (!adminEmail || !resendKey) {
    console.error("Missing env vars", {
      hasAdmin: !!adminEmail,
      hasResend: !!resendKey,
    });
    return NextResponse.json(
      { error: "Server is not configured" },
      { status: 500 },
    );
  }

  const resend = new Resend(resendKey);
  const fileCountLabel =
    cleanFiles.length === 1 ? "1 file" : `${cleanFiles.length} files`;

  const fileRowsHtml = cleanFiles
    .map(
      (f) => `
        <tr>
          <td style="padding: 10px 12px; border-top: 1px solid #e6e4dd; vertical-align: top;">
            <div style="font-weight: 600;">${escapeHtml(f.name)}</div>
            <div style="color: #6b6b6b; font-size: 13px; margin-top: 2px;">${formatBytes(f.size)}</div>
          </td>
          <td style="padding: 10px 12px; border-top: 1px solid #e6e4dd; vertical-align: top; text-align: right; white-space: nowrap;">
            <a href="${escapeHtml(f.url)}" style="display: inline-block; padding: 8px 14px; background: #1f6b5e; color: white; text-decoration: none; border-radius: 6px; font-size: 13px;">Download</a>
          </td>
        </tr>`,
    )
    .join("");

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
      <h2 style="font-family: Georgia, serif; margin: 0 0 16px;">New submission — ${escapeHtml(firstName)}</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr><td style="padding: 8px 0; color: #6b6b6b; width: 140px;">Name</td><td style="padding: 8px 0;"><strong>${escapeHtml(firstName)}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #6b6b6b;">Email</td><td style="padding: 8px 0;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
      </table>
      <h3 style="font-family: Georgia, serif; margin: 24px 0 8px;">What they&rsquo;re hoping for</h3>
      <div style="white-space: pre-wrap; padding: 16px; background: #fafaf7; border-radius: 8px; border: 1px solid #e6e4dd;">${escapeHtml(goal)}</div>
      <h3 style="font-family: Georgia, serif; margin: 24px 0 8px;">Their files (${fileCountLabel} &middot; ${formatBytes(totalBytes)})</h3>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #e6e4dd; border-radius: 8px; overflow: hidden;">
        ${fileRowsHtml}
      </table>
      <p style="color: #6b6b6b; font-size: 13px; margin-top: 32px;">
        Submitted ${new Date().toLocaleString("en-AU", { timeZone: "Australia/Melbourne" })} AEDT
      </p>
    </div>
  `;

  const filesText = cleanFiles
    .map((f) => `- ${f.name} (${formatBytes(f.size)})\n  ${f.url}`)
    .join("\n");

  const text = `New submission — ${firstName}

Name: ${firstName}
Email: ${email}

What they're hoping for:
${goal}

Files (${fileCountLabel}, ${formatBytes(totalBytes)}):
${filesText}

Submitted ${new Date().toISOString()}
`;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      replyTo: email,
      subject:
        cleanFiles.length === 1
          ? `New Read submission — ${firstName}`
          : `New Read submission — ${firstName} (${cleanFiles.length} files)`,
      html,
      text,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Resend error:", error);
    // Files are already in Blob — don't make the user re-upload.
    return NextResponse.json(
      { ok: true, warning: "Uploaded, but notification email failed." },
      { status: 200 },
    );
  }
}
