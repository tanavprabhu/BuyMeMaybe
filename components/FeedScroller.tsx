"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { messageFromFailedResponse } from "../lib/client-api-error";
import { readMyItemIds, removeMyItemId } from "../lib/client-owned-items";
import { FeedTopChrome } from "./feed/FeedTopChrome";
import { FeedItem, type FeedItemModel } from "./FeedItem";
import type { CategoryId } from "./CategoryPills";

type FeedResponse = { items: FeedItemModel[]; nextCursor: string | null };

export function FeedScroller(props: { highlightId?: string | null }) {
  const [category, setCategory] = useState<CategoryId>("all");
  const [items, setItems] = useState<FeedItemModel[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mineIds, setMineIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedAudioOn, setFeedAudioOn] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;

  const highlight = props.highlightId ?? null;

  const initialCategory = useMemo(() => category, [category]);

  async function loadFirst(nextCategory: CategoryId) {
    const res = await fetch(`/api/feed?category=${encodeURIComponent(nextCategory)}&limit=10`);
    const json = (await res.json()) as FeedResponse;
    setItems(json.items ?? []);
    setCursor(json.nextCursor ?? null);
    setActiveId(json.items?.[0]?.id ?? null);
  }

  const loadMore = useCallback(async () => {
    if (!cursor) return;
    const res = await fetch(
      `/api/feed?category=${encodeURIComponent(category)}&limit=10&cursor=${encodeURIComponent(cursor)}`,
    );
    const json = (await res.json()) as FeedResponse;
    setItems((prev) => [...prev, ...(json.items ?? [])]);
    setCursor(json.nextCursor ?? null);
  }, [cursor, category]);

  useEffect(() => {
    setMineIds(readMyItemIds());
  }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("bmm-feed-audio") === "1") setFeedAudioOn(true);
    } catch {
      /* private mode */
    }
  }, []);

  const unlockFeedAudio = useCallback(() => {
    setFeedAudioOn(true);
    try {
      sessionStorage.setItem("bmm-feed-audio", "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadFirst(initialCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadFirst(category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onScroll = () => {
      const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-item-id]"));
      const center = window.innerHeight / 2;
      let best: { id: string; dist: number } | null = null;
      for (const s of sections) {
        const rect = s.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const d = Math.abs(mid - center);
        const id = s.dataset.itemId;
        if (!id) continue;
        if (!best || d < best.dist) best = { id, dist: d };
      }
      if (best && best.id !== activeIdRef.current) setActiveId(best.id);

      const nearEnd = root.scrollTop + root.clientHeight >= root.scrollHeight - root.clientHeight * 1.5;
      if (nearEnd) void loadMore();
    };

    root.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => root.removeEventListener("scroll", onScroll);
  }, [loadMore, items]);

  useEffect(() => {
    if (!highlight) return;
    const root = rootRef.current;
    if (!root) return;
    const target = root.querySelector<HTMLElement>(`[data-item-id="${CSS.escape(highlight)}"]`);
    if (target) target.scrollIntoView({ block: "start" });
  }, [highlight, items]);

  async function deleteMine(id: string) {
    if (deletingId) return;
    if (!window.confirm("Remove this listing permanently?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/item/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) {
        const msg = await messageFromFailedResponse(res);
        window.alert(`Could not remove listing: ${msg}`);
        return;
      }
      setItems((prev) => prev.filter((x) => x.id !== id));
      removeMyItemId(id);
      setMineIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (activeId === id) {
        const rest = items.filter((x) => x.id !== id);
        setActiveId(rest[0]?.id ?? null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      window.alert(`Could not remove listing: ${msg}`);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col bg-bmm-sky text-bmm-brown">
      <FeedTopChrome category={category} onCategoryChange={setCategory} />

      <div
        ref={rootRef}
        className="flex min-h-0 flex-1 flex-col overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        {items.length === 0 ? (
          <div className="flex min-h-0 flex-[0_0_100%] flex-col items-center justify-center px-6 text-center">
            <div>
              <div className="text-2xl font-bold text-bmm-brown">No items yet</div>
              <div className="mt-2 text-bmm-brown/85">
                Tap + to generate the first talking listing.
              </div>
              <a
                href="/create"
                className="mt-5 inline-flex items-center justify-center border-2 border-bmm-brown bg-bmm-peach px-5 py-3 text-lg font-bold text-bmm-brown transition hover:brightness-95"
              >
                Create one
              </a>
            </div>
          </div>
        ) : (
          items.map((it) => (
            <div
              key={it.id}
              data-item-id={it.id}
              className="flex min-h-0 flex-[0_0_100%] snap-start flex-col"
            >
              <FeedItem
                item={it}
                active={activeId === it.id}
                feedAudioOn={feedAudioOn}
                onUnlockFeedAudio={unlockFeedAudio}
                mine={mineIds.has(it.id)}
                deleting={deletingId === it.id}
                onDeleteMine={deleteMine}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
