"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BulletScriptSection } from "./feed/BulletScriptSection";
import { ListingActionBar } from "./feed/ListingActionBar";
import { MediaCaptionStrip } from "./feed/MediaCaptionStrip";
import { QuickFactsCard, type QuickFactRow } from "./feed/QuickFactsCard";
import { SellerMetaRow } from "./feed/SellerMetaRow";
import { scriptToBullets } from "../lib/script-to-bullets";

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

function postedLine(iso?: string): string {
  if (!iso) return "Posted recently";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Posted recently";
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted 1 day ago";
  return `Posted ${days} days ago`;
}

function postedChip(iso?: string): string {
  if (!iso) return "Recently";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Recently";
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

// Renders one full-height listing: swipe right for details, left for video.
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

  const script = props.item.script?.trim() ?? "";
  const bullets = useMemo(() => scriptToBullets(script), [script]);
  const hookLine = bullets[0] ?? props.item.itemName;

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

  const quickRows: QuickFactRow[] = useMemo(() => {
    const rows: QuickFactRow[] = [
      { label: "Seller", value: props.item.sellerName },
      { label: "Ships from", value: props.item.sellerLocation },
      { label: "Posted", value: postedLine(props.item.createdAt) },
      {
        label: "Condition",
        value:
          props.item.urgencyDays === 0 ? "Fresh / like new" : `${props.item.urgencyDays} days on market`,
      },
    ];
    if (props.item.originalPrice != null) {
      rows.push({
        label: "Est. retail",
        value: `$${props.item.originalPrice}`,
        valueClassName: "line-through decoration-bmm-brown/35 text-bmm-brown/55 font-semibold",
      });
    }
    return rows;
  }, [props.item]);

  function copyHighlightLink() {
    const u = new URL(window.location.href);
    u.searchParams.set("highlight", props.item.id);
    void navigator.clipboard?.writeText(u.toString());
  }

  return (
    <section className="flex h-full min-h-0 w-full snap-start snap-always flex-col overflow-hidden bg-bmm-sky text-bmm-brown">
      <div
        ref={stripRef}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden no-scrollbar"
      >
        {/* —— Video —— */}
        <div className="flex h-full min-w-full w-full shrink-0 snap-start flex-col">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 px-screen pt-3">
              <div className="relative mx-auto w-full max-w-[300px]">
                <div className="relative mx-auto aspect-square w-[min(100%,min(78vw,34dvh))] max-w-full overflow-hidden rounded-2xl border-2 border-bmm-brown bg-bmm-white shadow-[4px_4px_0_#5c4033]">
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
                  <MediaCaptionStrip line={hookLine} />
                  <button
                    type="button"
                    onClick={props.onAdvance}
                    className="absolute left-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full border-2 border-bmm-brown bg-bmm-cream/95 text-2xl leading-none text-bmm-brown shadow-[2px_2px_0_#5c4033] backdrop-blur-[2px] transition hover:bg-bmm-peach"
                    aria-label="Skip to next listing"
                  >
                    ×
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSlide(1)}
                    className="absolute right-2 top-1/2 z-20 grid h-11 w-9 -translate-y-1/2 place-items-center rounded-l-xl border-y-2 border-l-2 border-bmm-brown bg-bmm-cream/95 text-lg font-extrabold text-bmm-brown shadow-[-3px_0_10px_rgba(0,0,0,0.08)] backdrop-blur-[2px] transition hover:bg-bmm-peach"
                    aria-label="View listing details"
                  >
                    ›
                  </button>
                </div>

                <div className="mt-3 flex justify-center gap-2">
                  {[0, 1].map((i) => (
                    <span
                      key={i}
                      className={[
                        "h-2 w-2 rounded-full border border-bmm-brown/40",
                        slide === i ? "bg-bmm-brown" : "bg-bmm-cream",
                      ].join(" ")}
                    />
                  ))}
                </div>
                <p className="mt-2 text-center text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-bmm-brown/45">
                  Swipe right for listing details
                </p>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-screen pb-4 pt-5">
              <SellerMetaRow
                sellerName={props.item.sellerName}
                postedLabel={`posted: ${postedChip(props.item.createdAt).toLowerCase()}`}
                itemId={props.item.id}
                initialLikes={props.item.likes}
              />
              <div className="mt-5">
                <h2 className="break-words text-[1.35rem] font-extrabold leading-snug tracking-tight text-bmm-brown">
                  {props.item.itemName}
                </h2>
                <p className="mt-2 text-[0.9rem] font-bold text-bmm-brown/60">{props.item.category}</p>
                <p className="mt-3 break-words text-[0.88rem] font-semibold leading-relaxed text-bmm-brown/70">
                  {props.item.sellerLocation}
                  <span className="text-bmm-brown/40"> · </span>
                  {props.item.urgencyDays === 0 ? "Like new" : `${props.item.urgencyDays} days waiting`}
                </p>
              </div>
            </div>
          </div>

          <ListingActionBar
            mode="purchase"
            price={props.item.askingPrice}
            onBuy={copyHighlightLink}
          />
        </div>

        {/* —— Details —— */}
        <div className="flex h-full min-w-full w-full shrink-0 snap-start flex-col border-l border-bmm-brown/25 bg-bmm-cream">
          <header className="shrink-0 border-b-2 border-bmm-brown bg-bmm-cream px-screen pb-3 pt-4">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => scrollToSlide(0)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-bmm-brown bg-bmm-sky text-2xl leading-none text-bmm-brown shadow-[3px_3px_0_#5c4033] transition hover:bg-bmm-peach"
                aria-label="Back to video"
              >
                ‹
              </button>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-bmm-brown/50">
                  Listing details
                </div>
                <div className="mt-1 text-[0.82rem] font-semibold text-bmm-brown/55">Swipe left for video</div>
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-screen pb-4 pt-1">
            <h2 className="break-words text-[1.45rem] font-black leading-snug tracking-tight text-bmm-brown">
              {props.item.itemName}
            </h2>
            <p className="mt-2 text-[0.9rem] font-bold text-bmm-brown/60">{props.item.category}</p>

            <div className="mt-5">
              <QuickFactsCard rows={quickRows} />
            </div>

            <BulletScriptSection bullets={bullets} />
          </div>

          <ListingActionBar
            mode="details"
            price={props.item.askingPrice}
            onCopyLink={copyHighlightLink}
            showRemove={props.mine}
            removing={props.deleting}
            onRemove={() => props.onDeleteMine(props.item.id)}
          />
        </div>
      </div>
    </section>
  );
}
