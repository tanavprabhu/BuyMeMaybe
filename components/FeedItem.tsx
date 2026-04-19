"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BulletScriptSection } from "./feed/BulletScriptSection";
import { QuickFactsCard, type QuickFactRow } from "./feed/QuickFactsCard";
import { SellerMetaRow } from "./feed/SellerMetaRow";
import { expandLocationForDisplay, formatUsdPrice } from "../lib/format-location";
import { quickFactLabelsForSellerCategory } from "../lib/listing-categories";

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
  listingLine1?: string | null;
  listingLine2?: string | null;
  listingExtra?: string | null;
  sellerCategoryKey?: string | null;
};

const MEDIA_PANELS = 3;

const CAROUSEL_SLIDE =
  "relative min-h-0 w-full min-w-0 shrink-0 grow-0 basis-full snap-start snap-always overflow-x-hidden";

function partsFromListingLine(line: string | null | undefined): string[] {
  if (!line?.trim()) return [];
  return line
    .split(/\s*·\s*/)
    .map((s) => s.trim())
    .filter((p) => p.length > 0);
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

export function FeedItem(props: {
  item: FeedItemModel;
  active: boolean;
  feedAudioOn: boolean;
  onUnlockFeedAudio: () => void;
  mine: boolean;
  deleting?: boolean;
  onDeleteMine: (id: string) => void;
}) {
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaPanel, setMediaPanel] = useState(0);

  const additionalInfoBullets = useMemo(() => {
    const t = props.item.listingExtra?.trim();
    return t ? [t] : [];
  }, [props.item.listingExtra]);

  const mediaSquareClass =
    "relative w-full min-w-0 max-w-full aspect-square overflow-hidden rounded-2xl border-2 border-bmm-brown";

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.clientWidth || 1;
      setMediaPanel(Math.min(MEDIA_PANELS - 1, Math.round(el.scrollLeft / w)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const expandedShipFrom = useMemo(
    () => expandLocationForDisplay(props.item.sellerLocation),
    [props.item.sellerLocation],
  );

  const priceLabel = useMemo(() => formatUsdPrice(props.item.askingPrice), [props.item.askingPrice]);

  const quickRowsCarousel: QuickFactRow[] = useMemo(() => {
    const postedShort = (() => {
      const c = postedChip(props.item.createdAt);
      return c === "Recently" ? "—" : c;
    })();
    const rows: QuickFactRow[] = [
      { label: "Seller", value: props.item.sellerName },
      { label: "Ships", value: expandedShipFrom },
      { label: "Posted", value: postedShort },
    ];

    const qf = quickFactLabelsForSellerCategory(props.item.sellerCategoryKey);
    const titleParts = partsFromListingLine(props.item.listingLine1 ?? undefined);
    if (titleParts.length >= 2) {
      rows.push({ label: qf.line1[0], value: titleParts[0]! });
      rows.push({ label: qf.line1[1], value: titleParts[1]! });
      for (let i = 2; i < titleParts.length; i++) {
        rows.push({ label: "Detail", value: titleParts[i]! });
      }
    } else if (titleParts.length === 1) {
      rows.push({ label: `${qf.line1[0]} & ${qf.line1[1].toLowerCase()}`, value: titleParts[0]! });
    }

    const detailParts = partsFromListingLine(props.item.listingLine2 ?? undefined);
    if (detailParts.length >= 2) {
      rows.push({ label: qf.line2[0], value: detailParts[0]! });
      rows.push({ label: qf.line2[1], value: detailParts[1]! });
      for (let i = 2; i < detailParts.length; i++) {
        rows.push({ label: "More", value: detailParts[i]! });
      }
    } else if (detailParts.length === 1) {
      rows.push({ label: `${qf.line2[0]} & ${qf.line2[1].toLowerCase()}`, value: detailParts[0]! });
    }

    return rows;
  }, [props.item, expandedShipFrom]);

  function copyHighlightLink() {
    const u = new URL(window.location.href);
    u.searchParams.set("highlight", props.item.id);
    void navigator.clipboard?.writeText(u.toString());
  }

  const videoActive = props.active && mediaPanel === 0;
  const videoMuted = !videoActive || !props.feedAudioOn;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (videoActive) {
      v.muted = videoMuted;
      v.preload = "auto";
      const p = v.play();
      if (p !== undefined) void p.catch(() => {});
    } else {
      v.pause();
      v.muted = true;
      v.preload = "metadata";
      try {
        v.currentTime = 0;
      } catch {
        /* seek may reject before metadata */
      }
    }
  }, [videoActive, videoMuted, props.item.videoUrl]);

  return (
    <section className="flex h-full min-h-0 w-full snap-start snap-always flex-col overflow-hidden bg-bmm-sky text-bmm-brown">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 w-full pt-3">
          <div className="mx-auto w-full max-w-full px-screen">
            <div className="relative min-w-0 w-full">
              <div
                ref={carouselRef}
                className="flex w-full min-w-0 touch-pan-x snap-x snap-mandatory overflow-x-auto overflow-y-hidden no-scrollbar"
              >
                <div className={CAROUSEL_SLIDE}>
                  <div className={`${mediaSquareClass} bg-black`}>
                      <video
                        key={props.item.videoUrl}
                        ref={videoRef}
                        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
                        src={props.item.videoUrl}
                        poster={props.item.imageUrl}
                        playsInline
                        loop
                        muted={videoMuted}
                        autoPlay={videoActive}
                        controls={false}
                        preload={videoActive ? "auto" : "metadata"}
                      />
                      {videoActive && !props.feedAudioOn ? (
                        <button
                          type="button"
                          onClick={() => {
                            props.onUnlockFeedAudio();
                            const v = videoRef.current;
                            if (v) {
                              v.muted = false;
                              void v.play().catch(() => {});
                            }
                          }}
                          className="absolute inset-0 z-10 grid place-items-center bg-black/10 transition hover:bg-black/15"
                          aria-label="Play with sound"
                        >
                          <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-bmm-brown/80 bg-bmm-cream/90 text-bmm-brown shadow-sm backdrop-blur-[2px] transition hover:border-bmm-brown hover:bg-bmm-peach/90">
                            <svg
                              viewBox="0 0 24 24"
                              className="ml-[3px] h-6 w-6"
                              fill="currentColor"
                              aria-hidden
                            >
                              <path d="M8 5v14l11-7L8 5z" />
                            </svg>
                          </span>
                        </button>
                      ) : null}
                    </div>
                  </div>

                <div className={CAROUSEL_SLIDE}>
                  <div className={`${mediaSquareClass} flex flex-col bg-bmm-cream`}>
                      <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center px-3 pb-3 pt-4">
                        <QuickFactsCard rows={quickRowsCarousel} variant="inline" />
                      </div>
                    </div>
                  </div>

                <div className={CAROUSEL_SLIDE}>
                  <div className={`${mediaSquareClass} flex flex-col bg-bmm-cream`}>
                      <div className="flex min-h-0 min-w-0 flex-1 flex-col px-3 pb-2 pt-4">
                        <BulletScriptSection
                          bullets={additionalInfoBullets}
                          embedded
                          title="Additional info"
                          emptyLabel="None"
                        />
                      </div>
                      <div className="shrink-0 border-t-2 border-bmm-brown/25 bg-bmm-cream/95 px-2 py-2">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={copyHighlightLink}
                            className="rounded-lg border-2 border-bmm-brown bg-bmm-peach px-3 py-1.5 text-[0.65rem] font-extrabold uppercase tracking-wide text-bmm-brown transition hover:brightness-95"
                          >
                            Copy link
                          </button>
                          {props.mine ? (
                            <button
                              type="button"
                              disabled={props.deleting}
                              className={[
                                "rounded-lg border-2 border-red-900 px-3 py-1.5 text-[0.65rem] font-extrabold uppercase tracking-wide transition",
                                props.deleting
                                  ? "cursor-not-allowed bg-red-200/80 text-red-900/50"
                                  : "bg-red-50 text-red-900 hover:bg-red-100",
                              ].join(" ")}
                              onClick={() => props.onDeleteMine(props.item.id)}
                            >
                              {props.deleting ? "Removing…" : "Remove"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 flex justify-center">
              <div
                className="inline-flex flex-nowrap items-center gap-1"
                role="status"
                aria-label={`Panel ${mediaPanel + 1} of ${MEDIA_PANELS}: ${mediaPanel === 0 ? "video" : mediaPanel === 1 ? "quick facts" : "additional info"}`}
              >
                {Array.from({ length: MEDIA_PANELS }, (_, i) => (
                  <span
                    key={i}
                    className={[
                      "box-border h-2 w-2 shrink-0 rounded-full border border-bmm-brown/40",
                      mediaPanel === i ? "bg-bmm-brown" : "bg-bmm-cream",
                    ].join(" ")}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-screen pb-safe pt-5">
          <h2 className="break-words text-balance text-center text-[1.35rem] font-extrabold leading-snug tracking-tight text-bmm-brown">
            {props.item.itemName}
          </h2>
          <div className="mt-4">
            <SellerMetaRow
              sellerName={props.item.sellerName}
              postedLabel={`posted: ${postedChip(props.item.createdAt).toLowerCase()}`}
              itemId={props.item.id}
              initialLikes={props.item.likes}
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <svg
                className="h-4 w-4 shrink-0 text-bmm-brown/65"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
              </svg>
              <p className="min-w-0 flex-1 break-words text-[0.82rem] font-semibold leading-snug text-bmm-brown/80">
                {expandedShipFrom}
              </p>
            </div>
            <button
              type="button"
              onClick={copyHighlightLink}
              aria-label={`Buy now for ${priceLabel} dollars`}
              className="shrink-0 min-h-12 whitespace-nowrap rounded-full border-2 border-bmm-brown bg-bmm-peach px-4 py-3 text-[1.02rem] font-extrabold leading-tight tracking-tight text-bmm-brown min-[360px]:px-5 min-[360px]:py-3.5 min-[360px]:text-[1.125rem] transition hover:brightness-95 active:brightness-95"
            >
              Buy now <span className="tabular-nums">${priceLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
