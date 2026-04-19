# BuyMeMaybe

AI-generated **square video listings**: snap a photo, add a few details, and the app produces a short talking-item clip for a TikTok-style feed.

**Sites**

- Marketing / info: [buymemaybe.us](https://buymemaybe.us)
- Web app: [app.buymemaybe.us](https://app.buymemaybe.us)

---

## The app

1. **Create** — Upload up to 7 photos, pick category + listing lines, optional price/notes.
2. **Pipeline** — Vision + writer + director prompts (xAI) → Grok Imagine **10s, 1:1** video with on-model VO.
3. **Feed** — Vertical snap scroll, category filters, likes, highlight links, delete for “your” listings (local marker).

Stack: **Next.js 16** (App Router), **React 19**, **Tailwind 4**, **Prisma + PostgreSQL**, **xAI** (chat/vision + Grok Imagine), **FFmpeg** (square export / optional mux).

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

- Set **`DATABASE_URL`** on the host to the same PostgreSQL instance for all regions/instances so every user shares one database.
- Ensure **`XAI_API_KEY`** (and any model overrides) are set in the deployment environment.
- Static assets under `public/generated` and `public/uploads` must persist on disk (server with a volume) or move to **object storage** so uploads and videos survive serverless/ephemeral filesystems.
