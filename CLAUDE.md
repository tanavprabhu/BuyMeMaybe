@AGENTS.md

# BuyMeMaybe

A TikTok-style mobile-web marketplace where every listing is a 15–20s vertical AI video of the item itself pleading to be resold.

## Tech stack

- **Frontend + backend:** Next.js (App Router) + React + TypeScript + Tailwind — one repo, one codebase. API routes live under `app/api/`.
- **Database:** SQLite via Prisma — local file at `prisma/dev.db`, accessed through `lib/db.ts`.
- **LLM + vision:** Native xAI OpenAI-compatible API (`https://api.x.ai/v1`, `XAI_API_KEY`) — 4-step pipeline in `lib/pipeline.ts` (defaults: `grok-4-1-fast-non-reasoning` for vision + text; override with `XAI_VISION_MODEL` / `XAI_TEXT_MODEL`). Client in `lib/xai-openai.ts`; `lib/gemini.ts` re-exports `analyzeItem()`.
- **Voice AI:** ElevenLabs. Wrapper in `lib/voice.ts`.
- **Video AI (talking item):** xAI Grok Imagine (`grok-imagine-video`) — submit + poll in `lib/video.ts` (`XAI_API_KEY`).
- **Video compositing:** FFmpeg via `fluent-ffmpeg` — burns captions, enforces 9:16, muxes audio. Wrapper in `lib/ffmpeg.ts`.

## Working agreements

- **One-sentence docstring on every function.** Single-line comment or JSDoc summary at the top of every named function, method, or exported arrow function. No multi-line docstrings, no param tags unless non-obvious.
- **95% confidence rule.** Don't guess between reasonable interpretations — ask the user. Especially for provider/API choices, scope calls, and UI layout decisions.
- **Never write comments that explain WHAT the code does** (well-named identifiers already do that) or that reference the current task/caller (rots fast). Function-opening summaries are the one exception.
- **Provider-switch pattern:** `lib/voice.ts` and `lib/video.ts` expose a single function whose implementation is chosen by env flag. Callers never know which provider they got.

## Key paths

- `app/page.tsx` — The Feed (TikTok-style vertical swipe).
- `app/create/page.tsx` — Camera/upload page.
- `app/result/[id]/page.tsx` — Result page that polls and plays the generated video.
- `app/api/analyze/` + `app/api/generate/` + `app/api/status/[id]/` — the pipeline.
- `app/api/feed/` — paginated feed endpoint.
- `lib/` — all provider wrappers, DB client, and helpers.
- `prisma/schema.prisma` — `Item` model is the single table.
- `public/generated/` — output mp4s (gitignored).
- `seed-photos/` — 20 source photos for the seed script.
- `scripts/generate-seed.ts` — runs the full pipeline over `seed-photos/` to fill the feed.

## Non-obvious notes

- Run with `npm run dev -- -H 0.0.0.0` when testing on a phone over LAN.
- Camera on phones: `<input type="file" accept="image/*" capture="environment">`.
- Feed autoplay: use Intersection Observer to play only the visible video; mobile browsers require `playsInline` and a user-gesture to unmute.
