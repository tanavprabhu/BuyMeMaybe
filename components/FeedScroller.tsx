"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { messageFromFailedResponse } from "../lib/client-api-error";
import { readMyItemIds, removeMyItemId } from "../lib/client-owned-items";
import { FeedTopChrome } from "./feed/FeedTopChrome";
import { FeedItem, type FeedItemModel } from "./FeedItem";
import type { CategoryId } from "./CategoryPills";

type FeedResponse = { items: FeedItemModel[]; nextCursor: string | null };

// Renders the vertically snap-scrolling feed and handles fetching/pagination and autoplay selection.
export function FeedScroller(props: { highlightId?: string | null }) {
  const [category, setCategory] = useState<CategoryId>("all");
  const [items, setItems] = useState<FeedItemModel[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mineIds, setMineIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const highlight = props.highlightId ?? null;

  const initialCategory = useMemo(() => category, [category]);

  async function loadFirst(nextCategory: CategoryId) {
    // Fetches the first page for a category and resets state.
    const res = await fetch(`/api/feed?category=${encodeURIComponent(nextCategory)}&limit=10`);
    const json = (await res.json()) as FeedResponse;
    setItems(json.items ?? []);
    setCursor(json.nextCursor ?? null);
    setActiveId(json.items?.[0]?.id ?? null);
  }

  async function loadMore() {
    // Fetches the next page for the current category and appends to the feed.
    if (!cursor) return;
    const res = await fetch(
      `/api/feed?category=${encodeURIComponent(category)}&limit=10&cursor=${encodeURIComponent(cursor)}`,
    );
    const json = (await res.json()) as FeedResponse;
    setItems((prev) => [...prev, ...(json.items ?? [])]);
    setCursor(json.nextCursor ?? null);
  }

  useEffect(() => {
    // Loads locally-owned listing ids for delete controls.
    setMineIds(readMyItemIds());
  }, []);

  useEffect(() => {
    // Loads the initial feed.
    void loadFirst(initialCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Reloads the feed when the category changes.
    void loadFirst(category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  useEffect(() => {
    // Autoplays the visible video by tracking the section nearest the center of the viewport.
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
      if (best && best.id !== activeId) setActiveId(best.id);

      const nearEnd = root.scrollTop + root.clientHeight >= root.scrollHeight - root.clientHeight * 1.5;
      if (nearEnd) void loadMore();
    };

    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, [activeId, cursor, category]);

  useEffect(() => {
    // Scrolls the feed to a highlighted item id (used after creation).
    if (!highlight) return;
    const root = rootRef.current;
    if (!root) return;
    const target = root.querySelector<HTMLElement>(`[data-item-id="${CSS.escape(highlight)}"]`);
    if (target) target.scrollIntoView({ block: "start" });
  }, [highlight, items]);

  function advanceFrom(id: string) {
    // Scrolls to the next feed item, wrapping to the first when at the end.
    const root = rootRef.current;
    if (!root) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-item-id]"));
    const idx = sections.findIndex((s) => s.dataset.itemId === id);
    if (idx < 0) return;
    const next = sections[idx + 1] ?? sections[0];
    next?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function deleteMine(id: string) {
    // Deletes a locally-owned listing from DB and removes it from feed state.
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
                className="mt-5 inline-flex items-center justify-center border-2 border-bmm-brown bg-bmm-peach px-5 py-3 text-lg font-bold text-bmm-brown shadow-[4px_4px_0_#5c4033] transition hover:brightness-95"
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
                onAdvance={() => advanceFrom(it.id)}
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
