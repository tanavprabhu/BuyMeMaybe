"use client";

import { useState } from "react";

// Renders an optimistic like button that increments likes via POST /api/like.
export function LikeButton(props: {
  itemId: string;
  initialLikes: number;
  /** Default: stacked icon + count. Inline keeps count attached for dense rows. */
  layout?: "stack" | "inline";
}) {
  const [likes, setLikes] = useState(props.initialLikes);
  const [busy, setBusy] = useState(false);

  async function onLike() {
    // Optimistically increments likes and reconciles with the server response.
    if (busy) return;
    setBusy(true);
    setLikes((x) => x + 1);
    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: props.itemId }),
      });
      if (res.ok) {
        const json = (await res.json()) as { likes: number };
        if (typeof json.likes === "number") setLikes(json.likes);
      }
    } finally {
      setBusy(false);
    }
  }

  const layout = props.layout ?? "stack";

  if (layout === "inline") {
    return (
      <button
        type="button"
        onClick={onLike}
        className="flex items-center gap-2 select-none"
        aria-label="Like"
      >
        <div
          className={[
            "grid h-10 w-10 place-items-center rounded-full border-2 border-bmm-brown bg-bmm-cream shadow-sm",
            busy ? "opacity-70" : "hover:bg-bmm-peach",
          ].join(" ")}
        >
          <span className="text-lg leading-none text-bmm-brown">♡</span>
        </div>
        <span className="min-w-[1.25rem] text-right text-sm font-extrabold tabular-nums text-bmm-brown">{likes}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onLike}
      className="flex flex-col items-center gap-1 select-none"
      aria-label="Like"
    >
      <div
        className={[
          "grid h-11 w-11 place-items-center rounded-full border-2 border-bmm-brown bg-bmm-cream",
          busy ? "opacity-70" : "hover:bg-bmm-peach",
        ].join(" ")}
      >
        <span className="text-xl leading-none text-bmm-brown">♡</span>
      </div>
      <div className="text-xs font-semibold text-bmm-brown tabular-nums">
        {likes}
      </div>
    </button>
  );
}
