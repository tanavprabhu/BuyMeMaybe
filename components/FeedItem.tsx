"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  script?: string;
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

// Renders one full-height listing: swipe right for text details, left for video.
export function FeedItem(props: {
  item: FeedItemModel;
  active: boolean;
  onAdvance: () => void;
  mine: boolean;
  deleting?: boolean;
  onDeleteMine: (id: string) => void;
}) {
  const stripRef = useRef<HTMLDivElement | null>(null);
  const [slide, setSlide] = useState(0);

  const scrollToSlide = useCallback((index: number) => {
    const el = stripRef.current;
    if (!el) return;
    const w = el.clientWidth;
    el.scrollTo({ left: index * w, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.clientWidth || 1;
      setSlide(Math.min(1, Math.round(el.scrollLeft / w)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const script = props.item.script?.trim() ?? "";

  return (
    <section className="flex h-full min-h-0 w-full snap-start snap-always flex-col overflow-hidden bg-bmm-sky text-bmm-brown">
      <div
        ref={stripRef}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden no-scrollbar"
      >
        {/* —— Video panel —— */}
        <div className="flex h-full min-w-full w-full shrink-0 snap-start flex-col">
          <div className="relative flex min-h-0 flex-1 flex-col px-3 pb-2 pt-24">
            <button
              type="button"
              onClick={props.onAdvance}
              className="absolute right-3 top-24 z-20 grid h-11 w-11 place-items-center rounded-full border-2 border-bmm-brown bg-bmm-cream text-2xl leading-none text-bmm-brown shadow-[3px_3px_0_#5c4033] transition hover:bg-bmm-peach"
              aria-label="Skip to next listing"
            >
              ×
            </button>

            <div className="relative mx-auto w-full max-w-[340px]">
              <div className="relative aspect-square w-full overflow-hidden border-2 border-bmm-brown bg-bmm-white shadow-[4px_4px_0_#5c4033]">
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
                  onClick={() => scrollToSlide(1)}
                  className="absolute right-0 top-1/2 z-10 -translate-y-1/2 grid h-12 w-9 place-items-center border-l-2 border-bmm-brown bg-bmm-cream/95 text-xl font-bold text-bmm-brown transition hover:bg-bmm-peach"
                  aria-label="View listing details"
                >
                  ›
                </button>
              </div>

              <div className="mt-2 flex justify-center gap-2">
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    className={[
                      "h-2.5 w-2.5 rounded-full border-2 border-bmm-brown",
                      slide === i ? "bg-bmm-brown" : "bg-bmm-cream",
                    ].join(" ")}
                  />
                ))}
              </div>
              <p className="mt-1 text-center text-[11px] font-semibold text-bmm-brown/65">
                Swipe right for listing details
              </p>
            </div>

            <div className="mt-2 flex min-h-0 flex-1 gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-bmm-brown bg-bmm-peach text-base text-bmm-brown"
                      aria-hidden
                    >
                      ☺
                    </div>
                    <span className="truncate text-base font-semibold text-bmm-brown">
                      {props.item.sellerName}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-bmm-brown/90">
                    {postedLine(props.item.createdAt)}
                  </span>
                </div>
                <div className="mt-2 text-lg font-bold leading-tight text-bmm-brown">
                  {props.item.itemName} · {props.item.category}
                </div>
                <div className="mt-0.5 text-sm text-bmm-brown/95">
                  {props.item.sellerLocation} ·{" "}
                  {props.item.urgencyDays === 0
                    ? "like new"
                    : `${props.item.urgencyDays} days waiting`}
                </div>
              </div>
              <div className="shrink-0 self-end pb-0.5">
                <LikeButton itemId={props.item.id} initialLikes={props.item.likes} />
              </div>
            </div>
          </div>

          <footer className="flex shrink-0 border-t-2 border-bmm-brown bg-bmm-cream">
            <div className="flex flex-1 items-center justify-center border-r-2 border-bmm-brown py-3 text-xl font-bold text-bmm-brown">
              ${props.item.askingPrice}
            </div>
            <button
              type="button"
              className="flex flex-1 items-center justify-center py-3 text-xl font-bold uppercase tracking-wide text-bmm-brown transition hover:bg-bmm-peach"
              onClick={() => {
                const u = new URL(window.location.href);
                u.searchParams.set("highlight", props.item.id);
                void navigator.clipboard?.writeText(u.toString());
              }}
            >
              buy
            </button>
          </footer>
        </div>

        {/* —— Text listing panel —— */}
        <div className="flex h-full min-w-full w-full shrink-0 snap-start flex-col border-l border-bmm-brown/30 bg-bmm-cream">
          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4 pt-24">
            <button
              type="button"
              onClick={() => scrollToSlide(0)}
              className="absolute left-3 top-24 z-20 grid h-11 w-11 place-items-center rounded-full border-2 border-bmm-brown bg-bmm-sky text-2xl leading-none text-bmm-brown shadow-[3px_3px_0_#5c4033] transition hover:bg-bmm-peach"
              aria-label="Back to video"
            >
              ‹
            </button>

            <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-bmm-brown/60">
              Listing
            </div>
            <h2 className="mt-1 text-2xl font-bold leading-tight text-bmm-brown">
              {props.item.itemName}
            </h2>
            <p className="mt-1 text-sm font-semibold text-bmm-brown/90">{props.item.category}</p>

            <div className="mt-4 space-y-2 rounded-xl border-2 border-bmm-brown bg-bmm-white p-3 text-sm text-bmm-brown">
              <div className="flex justify-between gap-2 border-b border-bmm-brown/20 pb-2">
                <span className="text-bmm-brown/70">Seller</span>
                <span className="font-semibold">{props.item.sellerName}</span>
              </div>
              <div className="flex justify-between gap-2 border-b border-bmm-brown/20 pb-2">
                <span className="text-bmm-brown/70">Ships from</span>
                <span className="font-semibold">{props.item.sellerLocation}</span>
              </div>
              <div className="flex justify-between gap-2 border-b border-bmm-brown/20 pb-2">
                <span className="text-bmm-brown/70">Posted</span>
                <span className="font-semibold">{postedLine(props.item.createdAt)}</span>
              </div>
              <div className="flex justify-between gap-2 border-b border-bmm-brown/20 pb-2">
                <span className="text-bmm-brown/70">Condition</span>
                <span className="font-semibold">
                  {props.item.urgencyDays === 0
                    ? "Fresh / like new"
                    : `${props.item.urgencyDays} days on market`}
                </span>
              </div>
              {props.item.originalPrice != null ? (
                <div className="flex justify-between gap-2 pb-2">
                  <span className="text-bmm-brown/70">Est. retail</span>
                  <span className="font-semibold line-through">${props.item.originalPrice}</span>
                </div>
              ) : null}
            </div>

            <div className="mt-4">
              <div className="text-xs font-bold uppercase tracking-wide text-bmm-brown/60">
                What it says in the video
              </div>
              <p className="mt-2 whitespace-pre-wrap rounded-xl border-2 border-dashed border-bmm-brown/40 bg-bmm-sky/60 p-3 text-sm leading-relaxed text-bmm-brown">
                {script || "No script stored for this listing."}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <div className="text-3xl font-black text-bmm-brown">${props.item.askingPrice}</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-xl border-2 border-bmm-brown bg-bmm-peach px-5 py-3 text-sm font-bold uppercase tracking-wide text-bmm-brown shadow-[3px_3px_0_#5c4033] transition hover:brightness-95"
                  onClick={() => {
                    const u = new URL(window.location.href);
                    u.searchParams.set("highlight", props.item.id);
                    void navigator.clipboard?.writeText(u.toString());
                  }}
                >
                  Copy link
                </button>
                {props.mine ? (
                  <button
                    type="button"
                    disabled={props.deleting}
                    className={[
                      "rounded-xl border-2 border-red-800 px-4 py-3 text-xs font-bold uppercase tracking-wide shadow-[3px_3px_0_#7f1d1d] transition",
                      props.deleting
                        ? "bg-red-200 text-red-800/60"
                        : "bg-red-100 text-red-900 hover:bg-red-200",
                    ].join(" ")}
                    onClick={() => props.onDeleteMine(props.item.id)}
                  >
                    {props.deleting ? "Removing…" : "Remove"}
                  </button>
                ) : null}
              </div>
            </div>

            <p className="mt-6 text-center text-[11px] text-bmm-brown/55">
              Swipe left to return to the video
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
