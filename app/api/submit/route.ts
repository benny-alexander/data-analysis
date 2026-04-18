import { NextResponse } from "next/server";
import { Resend } from "resend";

type SubmittedFile = {
  url?: string;
  name?: string;
  size?: number;
};

type SubmitBody = {
  firstName?: string;
  email?: string;
  goal?: string;
  files?: SubmittedFile[];
  // legacy single-file fields (kept for backward compat — ignored if `files` present)
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
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

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as SubmitBody;

  const firstName = (body.firstName || "").trim();
  const email = (body.email || "").trim();
  const goal = (body.goal || "").trim();

  // Normalize: prefer `files` array; fall back to legacy single-file shape
  let files: { url: string; name: string; size: number }[] = [];
  if (Array.isArray(body.files) && body.files.length > 0) {
    files = body.files
      .map((f) => ({
        url: (f.url || "").trim(),
        name: (f.name || "").trim(),
        size: typeof f.size === "number" ? f.size : 0,
      }))
      .filter((f) => f.url && f.name);
  } else if (body.fileUrl && body.fileName) {
    files = [
      {
        url: body.fileUrl.trim(),
        name: body.fileName.trim(),
        size: typeof body.fileSize === "number" ? body.fileSize : 0,
      },
    ];
  }

  if (!firstName || !email || !goal || files.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";
  const resendKey = process.env.RESEND_API_KEY;

  if (!adminEmail || !resendKey) {
    console.error("Missing ADMIN_EMAIL or RESEND_API_KEY env vars");
    return NextResponse.json({ error: "Server is not configured" }, { status: 500 });
  }

  const resend = new Resend(resendKey);
  const totalBytes = files.reduce((s, f) => s + f.size, 0);
  const fileCountLabel = files.length === 1 ? "1 file" : `${files.length} files`;

  const fileRowsHtml = files
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

  const filesText = files
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
        files.length === 1
          ? `New Read submission — ${firstName}`
          : `New Read submission — ${firstName} (${files.length} files)`,
      html,
      text,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
