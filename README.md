# BuyMeMaybe

AI-generated **square video listings**: snap a photo, add a few details, and the app produces a short talking-item clip for a TikTok-style feed.

**Sites**

- Marketing / info: [buymemaybe.us](https://buymemaybe.us)
- Web app: [app.buymemaybe.us](https://app.buymemaybe.us)

---

## Quick start

### Install

```bash
npm install
```

### Environment

Copy `.env.example` to `.env.local` and set at least:

- `DATABASE_URL` — **PostgreSQL** connection string (hosted or local). Examples: [Neon](https://neon.tech), [Supabase](https://supabase.com) (Database → URI), or Docker below.
- `XAI_API_KEY` — xAI console

### Database

You need a running Postgres instance whose URL matches `DATABASE_URL`.

**Local Postgres (Docker)**

```bash
docker run --name bmm-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=buymemaybe -p 5432:5432 -d postgres:16
```

Then set `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/buymemaybe?schema=public"` in `.env.local`.

Apply the schema:

```bash
npx prisma migrate deploy
npx prisma generate
```

**Hosted (Neon, Supabase, RDS, …)**  
Create a project, copy the **pooled** or **direct** `postgresql://…` URL (include `?sslmode=require` if the provider says so), put it in `.env.local` and in your host’s environment (Vercel, etc.), then run `npx prisma migrate deploy` from CI or once locally against that URL.

### Dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use `npm run dev -- -H 0.0.0.0` to test on a phone over LAN.

### Seed the feed (optional)

Put images in `seed-photos/`, then:

```bash
npm run seed
```

Runs `scripts/generate-seed.ts` (full analyze → video → DB + `public/` assets). Sequential to respect API limits.

---

## Scripts

| Command | Purpose |
|--------|---------|
| `npm run seed` | Generate listings from `seed-photos/` |
| `npx tsx scripts/remove-first-four-items.ts` | Deletes the **4 oldest** `Item` rows by `createdAt` (and their `public/` video + image files). Use once to drop early seed/demo listings. |
| `npx tsx scripts/remove-item-by-name.ts "Partial title"` | Deletes every `Item` whose `itemName` **contains** the substring (plus `public/` assets). |

---

## Project layout

```
BuyMeMaybe/
├── app/                    # Routes + API
│   ├── page.tsx            # Feed
│   ├── create/page.tsx     # New listing
│   ├── result/[jobId]/     # Generation status + video
│   └── api/                # analyze, generate, status, feed, like, item
├── components/             # FeedItem, FeedScroller, chrome, etc.
├── lib/                    # pipeline, video, ffmpeg, db, prompts, …
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   ├── brand/
│   ├── generated/          # mp4s (gitignored)
│   └── uploads/            # listing images (gitignored)
├── scripts/
│   ├── generate-seed.ts
│   └── remove-first-four-items.ts
└── README.md
```

---

## Production notes

Environment variables are **server-only** (Next.js API routes); they are not exposed to the browser. Copy names and values from `.env.example` / `.env.local` into your host’s dashboard.

**Vercel (typical checklist)** — Project → **Settings** → **Environment Variables**. Add each for **Production** (and **Preview** if you use preview deployments), then **Redeploy** so new values apply.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (Neon, Supabase, etc.). Run **`npx prisma migrate deploy`** so tables include **`GenerationJob`** (pipeline state between analyze and generate; required on Vercel). |
| `XAI_API_KEY` | Required for analyze + video (from [console.x.ai](https://console.x.ai)). If this is missing online, generation fails until you add it and redeploy. |
| `BLOB_READ_WRITE_TOKEN` | Required on Vercel for uploads/video files (read-only filesystem under `/var/task`). Use a **Public** Blob store; link it so the token is injected. |
| `XAI_VISION_MODEL`, `XAI_TEXT_MODEL` | Optional overrides (defaults are Grok fast models in `lib/pipeline.ts`). |

**File uploads on Vercel:** without Blob, creating `public/uploads` fails with `ENOENT`. With **[Vercel Blob](https://vercel.com/docs/storage/vercel-blob)** and a public store, images and MP4s get `https://…` URLs in the database. Locally, omit `BLOB_READ_WRITE_TOKEN` to use `public/uploads` and `public/generated` on disk.

**FFmpeg on Vercel:** serverless images do not include system `ffmpeg`/`ffprobe`. This repo uses **`@ffmpeg-installer/ffmpeg`** and **`@ffprobe-installer/ffprobe`** so the Linux binaries ship with the deployment. Optional overrides: `FFMPEG_PATH` / `FFPROBE_PATH` env vars if you supply your own binaries.
