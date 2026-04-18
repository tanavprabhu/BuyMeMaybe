"use client";

import { useState } from "react";
import { BrandMark } from "../../components/BrandMark";
import { friendlyApiMessage, messageFromFailedResponse } from "../../lib/client-api-error";

type AnalyzeResponse = { jobId: string; imageUrl: string; analysis: any };

// Renders the mobile-first create flow that uploads a photo and kicks off generation.
export default function CreatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [listingTitle, setListingTitle] = useState("");
  const [listingDetail, setListingDetail] = useState("");
  const [listingExtra, setListingExtra] = useState("");
  const [listingPrice, setListingPrice] = useState("");
  const [step, setStep] = useState<"idle" | "analyzing" | "starting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    // Uploads the image, runs AI analysis, then starts async generation and navigates to the result page.
    if (!file) return;
    setError(null);
    setStep("analyzing");

    const fd = new FormData();
    fd.append("image", file);
    fd.append("listingTitle", listingTitle);
    fd.append("listingDetail", listingDetail);
    fd.append("listingExtra", listingExtra);
    fd.append("listingPrice", listingPrice);
    const analyzeRes = await fetch("/api/analyze", { method: "POST", body: fd });
    if (!analyzeRes.ok) {
      setStep("error");
      const raw = await messageFromFailedResponse(analyzeRes);
      setError(friendlyApiMessage(raw));
      return;
    }
    const analyzed = (await analyzeRes.json()) as AnalyzeResponse;

    setStep("starting");
    const genRes = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: analyzed.jobId }),
    });
    if (!genRes.ok) {
      setStep("error");
      const raw = await messageFromFailedResponse(genRes);
      setError(friendlyApiMessage(raw));
      return;
    }

    window.location.href = `/result/${encodeURIComponent(analyzed.jobId)}`;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-bmm-sky text-bmm-brown">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 py-6">
        <div className="flex items-center justify-between border-b-2 border-bmm-brown pb-3">
          <a
            href="/"
            className="text-sm font-semibold text-bmm-brown/90 hover:text-bmm-brown"
          >
            ← back
          </a>
          <BrandMark showWordmark={false} size={40} />
          <div className="w-10" />
        </div>

        <div className="mt-8">
          <div className="text-3xl font-bold leading-tight tracking-tight text-bmm-brown">
            take a pic of something
            <br />
            sitting around.
          </div>
          <div className="mt-3 text-bmm-brown/85">
            we’ll turn it into a listing that literally begs to be resold.
          </div>
        </div>

        <div className="mt-7 rounded-2xl border-2 border-bmm-brown bg-bmm-cream p-4 shadow-[4px_4px_0_#5c4033]">
          <label className="block text-sm font-semibold text-bmm-brown/90">
            Photo
          </label>
          <input
            className="mt-2 w-full text-sm file:mr-4 file:rounded-full file:border-2 file:border-bmm-brown file:bg-bmm-peach file:px-4 file:py-2 file:text-sm file:font-bold file:text-bmm-brown"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="mt-2 text-xs text-bmm-brown/70">
            tip: square-friendly framing helps — leave a little margin around the item.
          </div>
        </div>

        <div className="mt-6 rounded-2xl border-2 border-bmm-brown bg-bmm-cream p-4 shadow-[4px_4px_0_#5c4033]">
          <div className="text-sm font-bold text-bmm-brown">Listing specs</div>
          <p className="mt-1 text-xs text-bmm-brown/75">
            Facts you type here are woven into the voiceover and video prompt (brand, size, price, care…).
          </p>
          <label className="mt-3 block text-xs font-semibold text-bmm-brown/90">
            Line 1 — e.g. brand · category
          </label>
          <input
            type="text"
            value={listingTitle}
            onChange={(e) => setListingTitle(e.target.value)}
            placeholder="H&M shirt · Men's"
            className="mt-1 w-full rounded-xl border-2 border-bmm-brown bg-bmm-white px-3 py-2 text-sm text-bmm-brown placeholder:text-bmm-brown/40"
          />
          <label className="mt-3 block text-xs font-semibold text-bmm-brown/90">
            Line 2 — e.g. size · condition
          </label>
          <input
            type="text"
            value={listingDetail}
            onChange={(e) => setListingDetail(e.target.value)}
            placeholder="Size XL · Like new"
            className="mt-1 w-full rounded-xl border-2 border-bmm-brown bg-bmm-white px-3 py-2 text-sm text-bmm-brown placeholder:text-bmm-brown/40"
          />
          <label className="mt-3 block text-xs font-semibold text-bmm-brown/90">
            Extra facts for the pitch
          </label>
          <textarea
            value={listingExtra}
            onChange={(e) => setListingExtra(e.target.value)}
            placeholder="Brand Gildan, only worn once, washing machine safe, Hack Princeton Spring '26…"
            rows={3}
            className="mt-1 w-full resize-y rounded-xl border-2 border-bmm-brown bg-bmm-white px-3 py-2 text-sm text-bmm-brown placeholder:text-bmm-brown/40"
          />
          <label className="mt-3 block text-xs font-semibold text-bmm-brown/90">
            Your asking price (USD, optional — overrides AI guess)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={listingPrice}
            onChange={(e) => setListingPrice(e.target.value)}
            placeholder="6"
            className="mt-1 w-full max-w-[8rem] rounded-xl border-2 border-bmm-brown bg-bmm-white px-3 py-2 text-sm text-bmm-brown placeholder:text-bmm-brown/40"
          />
        </div>

        {error ? (
          <div
            className="mt-4 rounded-xl border-2 border-[#d48c96] bg-bmm-peach p-4 text-sm font-semibold text-bmm-brown"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onSubmit}
          disabled={!file || step === "analyzing" || step === "starting"}
          className={[
            "mt-6 inline-flex w-full items-center justify-center rounded-full border-2 border-bmm-brown px-5 py-4 text-base font-bold shadow-[4px_4px_0_#5c4033] transition",
            !file || step === "analyzing" || step === "starting"
              ? "bg-bmm-peach/50 text-bmm-brown/50"
              : "bg-bmm-peach text-bmm-brown hover:brightness-95",
          ].join(" ")}
        >
          {step === "analyzing"
            ? "analyzing…"
            : step === "starting"
              ? "starting video…"
              : "generate my listing"}
        </button>

        <div className="mt-auto pt-10 text-center text-xs text-bmm-brown/60">
          sustainability but make it dramatic.
        </div>
      </div>
    </div>
  );
}
