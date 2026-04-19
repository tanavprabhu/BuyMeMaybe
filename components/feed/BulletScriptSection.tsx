"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { partitionBullets } from "../../lib/script-to-bullets";

const PRIMARY_MAX = 5;

function BulletList(props: {
  items: string[];
  muted?: boolean;
  compact?: boolean;
  /** Shown when `items` is empty (e.g. "None" for condition notes). */
  emptyLabel?: string;
}) {
  if (props.items.length === 0) {
    const label = props.emptyLabel ?? "No extra notes for this listing.";
    return (
      <p
        className={[
          props.compact ? "text-[0.78rem] leading-snug" : "text-sm leading-relaxed",
          props.muted ? "text-bmm-brown/55" : "text-bmm-brown/70",
        ].join(" ")}
      >
        {label}
      </p>
    );
  }
  const compact = props.compact;
  return (
    <ul className={compact ? "space-y-1.5" : "space-y-2.5"}>
      {props.items.map((t, i) => (
        <li key={`${i}-${t.slice(0, 24)}`} className={compact ? "flex gap-2" : "flex gap-3"}>
          <span
            className={[
              "shrink-0 rounded-full bg-bmm-brown/35",
              compact ? "mt-[0.32rem] h-1 w-1" : "mt-[0.45rem] h-1.5 w-1.5",
            ].join(" ")}
            aria-hidden
          />
          <span
            className={[
              "min-w-0 font-semibold text-bmm-brown",
              compact ? "text-[0.72rem] leading-snug" : "text-[0.95rem] leading-snug",
            ].join(" ")}
          >
            {t}
          </span>
        </li>
      ))}
    </ul>
  );
}

// Bullet list with optional horizontal paging when content overflows.
export function BulletScriptSection(props: {
  bullets: string[];
  /** One scrollable column, all bullets (e.g. in-card carousel). */
  embedded?: boolean;
  /** Overrides the section eyebrow (default: Highlights). */
  title?: string;
  /** When embedded and bullets are empty, shown instead of the default empty copy. */
  emptyLabel?: string;
}) {
  const title = props.title ?? "Highlights";
  if (props.embedded) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
        <div className="shrink-0 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-bmm-brown/50">
          {title}
        </div>
        <div className="mt-2 min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain pr-0.5 no-scrollbar">
          <BulletList items={props.bullets} compact emptyLabel={props.emptyLabel} />
        </div>
      </div>
    );
  }

  const { primary, extra } = partitionBullets(props.bullets, PRIMARY_MAX);
  const pagerRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState(0);

  const onScroll = useCallback(() => {
    const el = pagerRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    setPage(Math.min(1, Math.round(el.scrollLeft / w)));
  }, []);

  useEffect(() => {
    const el = pagerRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll, extra.length]);

  if (extra.length === 0) {
    return (
      <section className="mt-5">
        <div className="text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-bmm-brown/50">Highlights</div>
        <div className="mt-3">
          <BulletList items={primary} />
        </div>
      </section>
    );
  }

  return (
    <section className="mt-5">
      <div className="flex items-end justify-between gap-3">
        <div className="text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-bmm-brown/50">Highlights</div>
        <div className="text-[0.65rem] font-bold text-bmm-brown/45">Swipe for more</div>
      </div>

      <div
        ref={pagerRef}
        className="mt-3 flex w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden no-scrollbar"
      >
        <div className="min-w-full shrink-0 snap-start pr-2">
          <BulletList items={primary} />
        </div>
        <div className="min-w-full shrink-0 snap-start pl-2">
          <div className="rounded-2xl border border-bmm-brown/25 bg-bmm-sky/50 p-4">
            <div className="text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-bmm-brown/45">
              More details
            </div>
            <div className="mt-3">
              <BulletList items={extra} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-center gap-2">
        {[0, 1].map((i) => (
          <span
            key={i}
            className={[
              "h-2 w-2 rounded-full border border-bmm-brown/40",
              page === i ? "bg-bmm-brown" : "bg-bmm-cream",
            ].join(" ")}
          />
        ))}
      </div>
    </section>
  );
}
