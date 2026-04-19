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

Stack: **Next.js 16** (App Router), **React 19**, **Tailwind 4**, **Prisma + SQLite**, **xAI** (chat/vision + Grok Imagine), **FFmpeg** (square export / optional mux).

---

## Quick start

### Install

```bash
npm install
```

### Environment

Copy `.env.example` to `.env.local` and set at least:

- `XAI_API_KEY` — xAI console
- `DATABASE_URL` — default `file:./dev.db` is fine locally

### Database

```bash
npx prisma migrate deploy
npx prisma generate
```

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

- Point `DATABASE_URL` at your hosted DB if not using file SQLite.
- Ensure `XAI_API_KEY` (and any model overrides) are set in the deployment environment.
- Static assets under `public/generated` and `public/uploads` must persist on disk (or move to object storage in a future iteration).
