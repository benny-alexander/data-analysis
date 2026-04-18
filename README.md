# The Read — MVP

A simple Next.js website where visitors upload their fitness tracker export and get a personal insight from Ben.

## What it does

- **Landing page** (`/`) — hero copy plus a drag-and-drop upload form
- **How-to-export page** (`/how-to-export`) — tabbed instructions for Apple Watch, Garmin, WHOOP, Strava, and Oura
- **Success page** (`/success`) — confirmation after submission
- **Upload flow** — up to 5 files at once go to Vercel Blob (500 MB per file, 1.5 GB total); each with its own download link emailed to you via Resend
- **Oversize fallback** — anything over the limit gets redirected to a prefilled WeTransfer `mailto:` handoff
- **No database, no auth, no admin UI** — your inbox is the dashboard

## Getting it running locally

```bash
cd the-read-mvp
npm install
cp .env.example .env.local
# Fill in .env.local with real values — see "Environment variables" below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

All three are required in `.env.local` (local dev) and in Vercel Project Settings → Environment Variables (production).

| Variable | Where to get it |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | Vercel Dashboard → Storage → Create a Blob store → token is shown |
| `RESEND_API_KEY` | [resend.com/api-keys](https://resend.com/api-keys) — create a new key |
| `ADMIN_EMAIL` | Your email, where submissions are sent (e.g. `ben@alfredapp.com.au`) |

Optional:

| Variable | Default | Notes |
|---|---|---|
| `FROM_EMAIL` | `onboarding@resend.dev` | Resend's sandbox sender works for testing. For production, verify your own domain in Resend and use `notifications@yourdomain.com`. |
| `NEXT_PUBLIC_SITE_NAME` | `The Read` | Shown in header, footer, metadata |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `ben@alfredapp.com.au` | Shown in footer and "too large?" note |
| `NEXT_PUBLIC_WHATSAPP_INVITE_URL` | _(blank)_ | Paste the WhatsApp group invite link here to show a "While you wait — join the chat" CTA on the success page. Leave blank to hide the block. |

## Deploying to Vercel

### One-time setup

1. Push this folder to a new GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. In the import flow, leave framework detection as Next.js. Don't change build or output settings.
4. **Before deploying**, click **Environment Variables** and add the three required ones (plus any optional ones).
5. Click **Deploy**. First deploy takes 1–3 minutes.
6. You'll get a `your-project-name.vercel.app` URL. Visit it — the site should be live.

### Creating the Vercel Blob store

1. In your Vercel project dashboard, go to **Storage** → **Create Database** → **Blob**.
2. Name it (e.g. `the-read-uploads`).
3. Vercel will auto-link it to the project. The `BLOB_READ_WRITE_TOKEN` is added to your environment variables automatically, but double-check it appears under Settings → Environment Variables.

### Setting up Resend

1. Sign up at [resend.com](https://resend.com).
2. Go to **API Keys** and create one. Copy it into `RESEND_API_KEY`.
3. For initial testing, use the default `FROM_EMAIL=onboarding@resend.dev`. Emails will be marked as from "onboarding@resend.dev" — fine for testing but looks unprofessional.
4. **Before public launch**, add your domain in Resend → **Domains** → follow the DNS instructions (three records: SPF, DKIM, return-path). Takes 5–15 minutes once DNS propagates. Then change `FROM_EMAIL=notifications@yourdomain.com`.

### Custom domain

1. In Vercel project → **Settings** → **Domains** → add your domain.
2. Follow Vercel's DNS instructions (CNAME or A record).
3. SSL is automatic and usually ready within 10 minutes of DNS propagation.

## Testing the submission flow

1. Run `npm run dev` (or visit your deployed URL).
2. Fill the form with a real email (your own), a small test file (a random `.csv` or `.zip` under 10 MB), and a goal.
3. Submit.
4. You should land on `/success`.
5. Check your inbox (`ADMIN_EMAIL`) — you should have an email titled `New Read submission — {name}` with a download link that actually downloads the file.

If any step fails, check the terminal (local) or Vercel logs (production) for errors.

## Common issues

- **"Failed to send notification"** — `RESEND_API_KEY` or `FROM_EMAIL` is wrong, or the `FROM_EMAIL` domain isn't verified in Resend. Use `onboarding@resend.dev` as a temporary sender.
- **"Upload failed"** — `BLOB_READ_WRITE_TOKEN` is missing or wrong. Recreate the token in Vercel.
- **File above 500 MB rejected** — expected. Add a WeTransfer fallback link if this comes up often.
- **Emails going to spam** — verify your sending domain in Resend; add SPF + DKIM DNS records.

## What's explicitly not here

- Database (submissions live only in your email + Vercel Blob)
- Admin dashboard (use Gmail)
- User auth
- Payments
- Mobile optimisation (desktop-first; it renders on mobile but isn't tuned)
- Claude auto-drafting (phase 2)
- Return-user flow

## File map

```
app/
├── layout.tsx              # Site shell, metadata
├── page.tsx                # Landing page
├── globals.css             # Tailwind + base styles
├── components/
│   └── UploadForm.tsx      # Drag-drop form (client component)
├── how-to-export/
│   └── page.tsx            # Device tabs with instructions
├── success/
│   └── page.tsx            # Post-submit confirmation
└── api/
    ├── upload/route.ts     # Vercel Blob client-upload token
    └── submit/route.ts     # Resend email to admin
```

## When you're ready for v2

Revisit `../website-build-plan.md` in this folder. The roadmap there covers: Supabase with private storage and signed URLs, Claude auto-drafting, admin dashboard, Stripe + subscription tiers, and the path to $1M MRR.
# data-analysis
