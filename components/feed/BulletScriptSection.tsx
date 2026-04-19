"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { partitionBullets } from "../../lib/script-to-bullets";

const PRIMARY_MAX = 5;

function BulletList(props: { items: string[]; muted?: boolean }) {
  if (props.items.length === 0) {
    return (
      <p className={["text-sm leading-relaxed", props.muted ? "text-bmm-brown/55" : "text-bmm-brown/70"].join(" ")}>
        No extra notes for this listing.
      </p>
    );
  }
  return (
    <ul className="space-y-2.5">
      {props.items.map((t, i) => (
        <li key={`${i}-${t.slice(0, 24)}`} className="flex gap-3">
          <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-bmm-brown/35" aria-hidden />
          <span className="min-w-0 text-[0.95rem] font-semibold leading-snug text-bmm-brown">{t}</span>
        </li>
      ))}
    </ul>
  );
}

// Bullet list with optional horizontal paging when content overflows.
export function BulletScriptSection(props: { bullets: string[] }) {
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
