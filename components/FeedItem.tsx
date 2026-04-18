"use client";

import { LikeButton } from "./LikeButton";

export type FeedItemModel = {
  id: string;
  itemName: string;
  category: string;
  videoUrl: string;
  imageUrl: string;
  askingPrice: number;
  originalPrice: number | null;
  urgencyDays: number;
  sellerName: string;
  sellerLocation: string;
  likes: number;
  createdAt?: string;
};

// Formats a short "posted: …" label from an ISO createdAt when present.
function postedLine(iso?: string): string {
  if (!iso) return "posted: recently";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "posted: recently";
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "posted: today";
  if (days === 1) return "posted: 1 day";
  return `posted: ${days} days`;
}

// Renders one full-screen listing card with cozy marketplace chrome.
export function FeedItem(props: {
  item: FeedItemModel;
  active: boolean;
  onAdvance: () => void;
}) {
  return (
    <section className="relative flex h-dvh w-full snap-start snap-always flex-col overflow-hidden bg-bmm-sky text-bmm-brown">
      <div className="relative flex min-h-0 flex-1 flex-col px-4 pb-2 pt-28">
        <button
          type="button"
          onClick={props.onAdvance}
          className="absolute right-4 top-28 z-20 grid h-11 w-11 place-items-center rounded-full border-2 border-bmm-brown bg-bmm-cream text-2xl leading-none text-bmm-brown shadow-[3px_3px_0_#5c4033] transition hover:bg-bmm-peach"
          aria-label="Skip to next listing"
        >
          ×
        </button>

        <div className="relative mx-auto w-full max-w-md">
          <div className="relative aspect-square max-h-[min(92vw,52vh)] w-full overflow-hidden border-2 border-bmm-brown bg-bmm-white shadow-[4px_4px_0_#5c4033]">
            <video
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              src={props.item.videoUrl}
              playsInline
              loop
              muted={!props.active}
              autoPlay={props.active}
              controls={false}
              preload="metadata"
            />
            <button
              type="button"
              onClick={props.onAdvance}
              className="absolute right-1 top-1/2 z-10 -translate-y-1/2 grid h-12 w-10 place-items-center border-l-2 border-bmm-brown bg-bmm-cream/95 text-xl font-bold text-bmm-brown transition hover:bg-bmm-peach"
              aria-label="Next slide"
            >
              ›
            </button>
          </div>

          <div className="mt-3 flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={[
                  "h-2.5 w-2.5 rounded-full border-2 border-bmm-brown",
                  i === 0 ? "bg-bmm-brown" : "bg-bmm-cream",
                ].join(" ")}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <div
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-bmm-brown bg-bmm-peach text-lg text-bmm-brown"
                  aria-hidden
                >
                  ☺
                </div>
                <span className="truncate text-lg font-semibold text-bmm-brown">
                  {props.item.sellerName}
                </span>
              </div>
              <span className="shrink-0 text-sm font-semibold text-bmm-brown/90">
                {postedLine(props.item.createdAt)}
              </span>
            </div>

            <div className="mt-3 text-xl font-bold leading-tight text-bmm-brown">
              {props.item.itemName} · {props.item.category}
            </div>
            <div className="mt-1 text-lg text-bmm-brown/95">
              {props.item.sellerLocation} ·{" "}
              {props.item.urgencyDays === 0
                ? "like new"
                : `${props.item.urgencyDays} days waiting`}
            </div>
          </div>

          <div className="shrink-0 self-end pb-1">
            <LikeButton itemId={props.item.id} initialLikes={props.item.likes} />
          </div>
        </div>
      </div>

      <footer className="flex shrink-0 border-t-2 border-bmm-brown bg-bmm-cream">
        <div className="flex flex-1 items-center justify-center border-r-2 border-bmm-brown py-4 text-2xl font-bold text-bmm-brown">
          ${props.item.askingPrice}
        </div>
        <button
          type="button"
          className="flex flex-1 items-center justify-center py-4 text-2xl font-bold uppercase tracking-wide text-bmm-brown transition hover:bg-bmm-peach"
          onClick={() => {
            const u = new URL(window.location.href);
            u.searchParams.set("highlight", props.item.id);
            void navigator.clipboard?.writeText(u.toString());
          }}
        >
          buy
        </button>
      </footer>
    </section>
  );
}
