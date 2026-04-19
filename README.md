# BuyMeMaybe

AI-powered square video listings. Snap a photo, add a few details, and the app generates a short talking-item clip served in a TikTok-style feed.

**Live:** [buymemaybe.us](https://buymemaybe.us) | **App:** [app.buymemaybe.us](https://app.buymemaybe.us)

---

## The Product

BuyMeMaybe turns static product photos into engaging square video ads. The pipeline works in three stages:

1. **Analyze**: Vision model examines the uploaded photo and extracts item details
2. **Script**: Text model writes a short, punchy sales script for the item
3. **Generate**: Video model produces a square clip, post-processed with FFmpeg

The result is served in a mobile-first snap-scroll feed with autoplaying video cards.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL via Prisma ORM |
| AI | xAI Grok (vision, text, video) via OpenAI-compatible client |
| Video | FFmpeg (fluent-ffmpeg + bundled binaries) |
| Storage | Vercel Blob (production), local filesystem (dev) |
| Hosting | Vercel |

---

## Quick Start

### Installation

```bash
npm install
```

### Environment

Copy `.env.example` to `.env.local` and set:

- `DATABASE_URL`: PostgreSQL connection string (hosted or local)
- `XAI_API_KEY`: from [console.x.ai](https://console.x.ai)

### Database

You need a running Postgres instance whose URL matches `DATABASE_URL`.

**Local (Docker):**

```bash
docker run --name bmm-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=buymemaybe -p 5432:5432 -d postgres:16
```

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/buymemaybe?schema=public"
```

**Hosted (Neon, Supabase, RDS, etc.):**
Create a project, copy the connection URI (include `?sslmode=require` if needed), and add it to `.env.local`.

Apply the schema:

```bash
npx prisma migrate deploy
npx prisma generate
```

### Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use `npm run dev -- -H 0.0.0.0` to test on a phone over LAN.

### Seed the Feed (optional)

Place images in `seed-photos/`, then:

```bash
npm run seed
```

Runs the full analyze/video/DB pipeline via `scripts/generate-seed.ts`. Sequential to respect API rate limits.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run seed` | Generate listings from `seed-photos/` |
| `npx tsx scripts/remove-first-four-items.ts` | Delete the 4 oldest items by `createdAt` (plus assets) |
| `npx tsx scripts/remove-item-by-name.ts "Partial title"` | Delete every item whose name contains the substring |

---

## Project Structure

```
BuyMeMaybe/
├── app/                        # Routes + API
│   ├── page.tsx                # Feed
│   ├── create/page.tsx         # New listing flow
│   ├── result/[jobId]/         # Generation status + video
│   └── api/                    # analyze, generate, status, feed, like, item
├── components/                 # FeedItem, FeedScroller, chrome
├── lib/                        # Pipeline, video, ffmpeg, db, prompts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   ├── brand/
│   ├── generated/              # MP4s (gitignored)
│   └── uploads/                # Listing images (gitignored)
├── scripts/
│   ├── generate-seed.ts
│   └── remove-first-four-items.ts
└── README.md
```

---

## Production

### Environment Variables

All variables are server-only (Next.js API routes) and never exposed to the browser. Add each variable in your host's dashboard (e.g. Vercel > Settings > Environment Variables).

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string. Run `npx prisma migrate deploy` so tables include `GenerationJob`. |
| `XAI_API_KEY` | Required for analyze + video generation. From [console.x.ai](https://console.x.ai). |
| `BLOB_READ_WRITE_TOKEN` | Required on Vercel for file storage (serverless has a read-only filesystem). Use a public Blob store. |
| `XAI_VISION_MODEL` | Optional. Override the default vision model in `lib/pipeline.ts`. |
| `XAI_TEXT_MODEL` | Optional. Override the default text model in `lib/pipeline.ts`. |

### File Storage

Vercel's serverless runtime has no writable filesystem under `/var/task`. With [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) and a public store, images and MP4s get hosted URLs stored in the database. Locally, omit `BLOB_READ_WRITE_TOKEN` to write directly to `public/uploads` and `public/generated`.

### FFmpeg

Serverless images do not include system `ffmpeg`/`ffprobe`. This repo bundles `@ffmpeg-installer/ffmpeg` and `@ffprobe-installer/ffprobe` so the Linux binaries ship with the deployment. Set `FFMPEG_PATH` / `FFPROBE_PATH` if you need to supply your own binaries.
