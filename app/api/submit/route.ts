import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { Resend } from "resend";

/**
 * Accepts a multipart/form-data submission (files + contact details),
 * uploads each file to Vercel Blob server-side, then sends the admin
 * notification email via Resend.
 *
 * Server-side upload deliberately bypasses @vercel/blob client-upload,
 * which was failing with CORS/400 from blob.vercel-storage.com in Safari.
 * Trade-off: we're bound by the Vercel serverless body size limit
 * (~4.5 MB on Hobby), so the client-side oversize fallback routes
 * anything larger to WeTransfer.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

// Hard server-side ceiling — keep this under Vercel's body limit.
const MAX_TOTAL_BYTES = 4 * 1024 * 1024; // 4 MB
const MAX_FILES = 5;

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

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: Request): Promise<NextResponse> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch (err) {
    console.error("formData parse error:", err);
    return NextResponse.json(
      { error: "Could not read the upload. Try again, or email Ben directly." },
      { status: 400 },
    );
  }

  const firstName = String(form.get("firstName") || "").trim();
  const email = String(form.get("email") || "").trim();
  const goal = String(form.get("goal") || "").trim();
  const consent = String(form.get("consent") || "").trim();

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
    return NextResponse.json(
      { error: "Consent is required" },
      { status: 400 },
    );
  }

  // Collect files — field name is "files" (repeated).
  const rawFiles = form.getAll("files").filter((v): v is File => v instanceof File);
  if (rawFiles.length === 0) {
    return NextResponse.json({ error: "No files attached" }, { status: 400 });
  }
  if (rawFiles.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Too many files (max ${MAX_FILES})` },
      { status: 400 },
    );
  }

  const totalBytes = rawFiles.reduce((s, f) => s + f.size, 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    return NextResponse.json(
      {
        error:
          "Your upload is larger than 4 MB total. Please use the WeTransfer link on the oversize screen, or email Ben directly.",
      },
      { status: 413 },
    );
  }

  // Env — fail fast with a clear error
  const adminEmail = process.env.ADMIN_EMAIL;
  const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";
  const resendKey = process.env.RESEND_API_KEY;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (!adminEmail || !resendKey || !blobToken) {
    console.error("Missing env vars", {
      hasAdmin: !!adminEmail,
      hasResend: !!resendKey,
      hasBlob: !!blobToken,
    });
    return NextResponse.json(
      { error: "Server is not configured" },
      { status: 500 },
    );
  }

  // Server-side upload to Vercel Blob
  const timestamp = Date.now();
  let uploaded: { url: string; name: string; size: number }[];
  try {
    uploaded = await Promise.all(
      rawFiles.map(async (file) => {
        const pathname = `submissions/${timestamp}-${safeName(file.name)}`;
        const blob = await put(pathname, file, {
          access: "public",
          addRandomSuffix: true,
          token: blobToken,
        });
        return { url: blob.url, name: file.name, size: file.size };
      }),
    );
  } catch (err) {
    // Surface the real error while we're debugging the launch-day path.
    // The front-end shows this in the red error banner.
    const message = err instanceof Error ? err.message : String(err);
    const name = err instanceof Error ? err.name : "UnknownError";
    console.error("Blob upload error:", {
      name,
      message,
      stack: err instanceof Error ? err.stack : undefined,
      tokenPrefix: blobToken ? blobToken.slice(0, 20) + "..." : "missing",
    });
    return NextResponse.json(
      {
        error: `Blob upload failed — ${name}: ${message}`,
        debug: { name, message },
      },
      { status: 500 },
    );
  }

  // Build the email
  const resend = new Resend(resendKey);
  const fileCountLabel =
    uploaded.length === 1 ? "1 file" : `${uploaded.length} files`;

  const fileRowsHtml = uploaded
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

  const filesText = uploaded
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
        uploaded.length === 1
          ? `New Read submission — ${firstName}`
          : `New Read submission — ${firstName} (${uploaded.length} files)`,
      html,
      text,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Resend error:", error);
    // Files are already in Blob — don't make the user re-upload just because
    // email failed. Return a soft-success so the user still gets the success page.
    return NextResponse.json(
      {
        ok: true,
        warning: "Uploaded, but notification email failed.",
      },
      { status: 200 },
    );
  }
}
