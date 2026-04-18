"use client";

import { useState } from "react";
import { BrandMark } from "../../components/BrandMark";
import { friendlyApiMessage, messageFromFailedResponse } from "../../lib/client-api-error";

type AnalyzeResponse = { jobId: string; imageUrl: string; analysis: any };

// Renders the mobile-first create flow that uploads a photo and kicks off generation.
export default function CreatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<"idle" | "analyzing" | "starting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    // Uploads the image, runs AI analysis, then starts async generation and navigates to the result page.
    if (!file) return;
    setError(null);
    setStep("analyzing");

    const fd = new FormData();
    fd.append("image", file);
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
    <div className="min-h-dvh bg-bmm-sky text-bmm-brown">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-6">
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
            tip: bright lighting makes the face overlay look cleaner.
          </div>
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
