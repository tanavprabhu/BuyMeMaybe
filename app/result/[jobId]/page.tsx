"use client";

import { useEffect, useState } from "react";
import { BrandMark } from "../../../components/BrandMark";
import { addMyItemId } from "../../../lib/client-owned-items";

type JobStatus =
  | { status: "pending-analyze" }
  | { status: "ready-to-generate" }
  | { status: "generating" }
  | { status: "ready"; itemId: string }
  | { status: "error"; message: string };

type StatusResponse = { jobId: string } & JobStatus;

export default function ResultPage(props: { params: Promise<{ jobId: string }> }) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [state, setState] = useState<JobStatus>({ status: "generating" });

  useEffect(() => {
    void props.params.then((p) => setJobId(p.jobId));
  }, [props.params]);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    const poll = async () => {
      const res = await fetch(`/api/status/${encodeURIComponent(jobId)}`, { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as StatusResponse;
      if (cancelled) return;
      setState(json as any);
      if (json.status === "ready" || json.status === "error") return;
      setTimeout(poll, 2500);
    };
    void poll();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const ready = state.status === "ready" ? state.itemId : null;

  useEffect(() => {
    if (!ready) return;
    addMyItemId(ready);
  }, [ready]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-bmm-sky text-bmm-brown">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 py-6">
        <div className="flex items-center justify-between border-b-2 border-bmm-brown pb-3">
          <a
            href="/"
            className="text-sm font-semibold text-bmm-brown/90 hover:text-bmm-brown"
          >
            ← feed
          </a>
          <BrandMark showWordmark={false} size={40} />
          <div className="w-10" />
        </div>

        {state.status === "error" ? (
          <div className="mt-10 rounded-2xl border-2 border-red-700/40 bg-red-100/80 p-4">
            <div className="text-lg font-bold">generation failed</div>
            <div className="mt-2 text-sm text-bmm-brown/90">{state.message}</div>
            <a
              href="/create"
              className="mt-4 inline-flex rounded-full border-2 border-bmm-brown bg-bmm-peach px-4 py-2 text-sm font-bold text-bmm-brown"
            >
              try again
            </a>
          </div>
        ) : ready ? (
          <div className="mt-6 flex flex-1 flex-col">
            <div className="relative aspect-square w-full max-w-md mx-auto overflow-hidden rounded-2xl border-2 border-bmm-brown bg-bmm-white">
              <video
                className="h-full w-full object-cover"
                src={`/generated/${ready}.mp4`}
                playsInline
                controls
                autoPlay
              />
            </div>
            <div className="mt-6 text-center">
              <div className="font-display text-2xl font-bold">you’re live.</div>
              <div className="mt-2 text-bmm-brown/85">
                your listing just dropped into the feed.
              </div>
              <a
                href={`/?highlight=${encodeURIComponent(ready)}`}
                className="mt-5 inline-flex w-full items-center justify-center rounded-full border-2 border-bmm-brown bg-bmm-peach px-5 py-4 text-base font-bold text-bmm-brown transition hover:brightness-95"
              >
                view in feed
              </a>
            </div>
          </div>
        ) : (
          <div className="mt-10 flex flex-1 flex-col items-center justify-center text-center">
            <div className="font-display text-2xl font-bold">cooking your video…</div>
            <div className="mt-2 max-w-xs text-sm text-bmm-brown/85">
              this can take 1–3 minutes. don’t close the tab.
            </div>
            <div className="mt-6 text-xs text-bmm-brown/60">
              status: {state.status}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
