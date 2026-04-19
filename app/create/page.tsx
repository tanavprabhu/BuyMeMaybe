"use client";

import { useMemo, useState } from "react";
import { BrandMark } from "../../components/BrandMark";
import { friendlyApiMessage, messageFromFailedResponse } from "../../lib/client-api-error";
import {
  LISTING_CATEGORY_FORMS,
  SELLER_CATEGORY_KEYS,
  type SellerListingCategoryKey,
} from "../../lib/listing-categories";

type AnalyzeResponse = { jobId: string; imageUrl: string; imageUrls: string[]; analysis: any };

const MAX_PHOTOS = 7;

function joinListingLine(...parts: string[]): string {
  return parts
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .join(" · ");
}

const fieldInputClass =
  "mt-0.5 w-full rounded-xl border-2 border-bmm-brown bg-bmm-white px-3 py-2 text-sm text-bmm-brown outline-none transition placeholder:text-bmm-brown/38 focus-visible:ring-2 focus-visible:ring-bmm-brown/25";

function detailsComplete(cat: SellerListingCategoryKey, details: Record<string, string>): boolean {
  const def = LISTING_CATEGORY_FORMS[cat];
  const slots = [def.line1[0], def.line1[1], def.line2[0], def.line2[1]];
  return slots.every((s) => (details[s.id] ?? "").trim().length > 0);
}

export default function CreatePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [sellerCategory, setSellerCategory] = useState<SellerListingCategoryKey | "">("");
  const [details, setDetails] = useState<Record<string, string>>({});
  const [listingExtra, setListingExtra] = useState("");
  const [listingPrice, setListingPrice] = useState("");
  const [step, setStep] = useState<"idle" | "analyzing" | "starting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const activeForm = sellerCategory ? LISTING_CATEGORY_FORMS[sellerCategory] : null;

  const canSubmit = useMemo(() => {
    if (files.length === 0) return false;
    if (!sellerCategory) return false;
    return detailsComplete(sellerCategory, details);
  }, [files.length, sellerCategory, details]);

  function setDetail(id: string, value: string) {
    setDetails((d) => ({ ...d, [id]: value }));
  }

  function pickCategory(cat: SellerListingCategoryKey) {
    setSellerCategory(cat);
    setDetails({});
  }

  async function onSubmit() {
    if (!canSubmit || !sellerCategory) return;
    setError(null);
    setStep("analyzing");

    const titleLine = joinListingLine(details.l1a ?? "", details.l1b ?? "");
    const detailLine = joinListingLine(details.l2a ?? "", details.l2b ?? "");

    const fd = new FormData();
    for (const f of files) {
      fd.append("images", f);
    }
    fd.append("sellerCategory", sellerCategory);
    fd.append("listingTitle", titleLine);
    fd.append("listingDetail", detailLine);
    fd.append("listingExtra", listingExtra);
    fd.append("listingPrice", listingPrice);
    const analyzeRes = await fetch("/api/analyze", { method: "POST", body: fd, cache: "no-store" });
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
      cache: "no-store",
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
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-bmm-sky pb-safe text-bmm-brown">
      <div className="mx-auto flex w-full max-w-md flex-col px-4 pb-4 pt-2 sm:px-5">
        <div className="flex items-center justify-between border-b-2 border-bmm-brown pb-2">
          <a
            href="/"
            className="text-sm font-semibold text-bmm-brown/90 hover:text-bmm-brown"
          >
            ← back
          </a>
          <BrandMark showWordmark={false} size={36} />
          <div className="w-9" aria-hidden />
        </div>

        <h1 className="mt-2 text-balance text-center text-xl font-bold leading-tight tracking-tight text-bmm-brown sm:text-2xl">
          snap a picture to list it
        </h1>

        <div className="mt-2 overflow-hidden rounded-2xl border-2 border-bmm-brown bg-bmm-cream">
          <div className="px-3 py-3">
            <h2 className="text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-bmm-brown/45">
              Photos
            </h2>
            <label className="mt-1.5 block cursor-pointer">
              <span className="sr-only">Choose listing photos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) =>
                  setFiles(Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS))
                }
                className={[
                  "block w-full cursor-pointer rounded-xl border-2 border-bmm-brown bg-bmm-white px-3 py-2 text-sm text-bmm-brown",
                  "outline-none transition file:mr-3 file:cursor-pointer file:rounded-lg file:border-2 file:border-bmm-brown file:bg-bmm-peach",
                  "file:px-3 file:py-2 file:text-xs file:font-bold file:text-bmm-brown file:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-bmm-brown/25",
                ].join(" ")}
              />
            </label>
            {files.length > 0 ? (
              <p className="mt-1.5 text-xs font-semibold text-bmm-brown/70">
                {files.length} photo{files.length === 1 ? "" : "s"} selected (max {MAX_PHOTOS})
              </p>
            ) : null}
          </div>

          <div className="h-px bg-bmm-brown/15" />

          <div className="space-y-2 px-3 pb-2 pt-3">
            <h2 className="text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-bmm-brown/45">
              Category
            </h2>
            <p className="text-[0.65rem] leading-snug text-bmm-brown/45">
              Pick what you&apos;re selling — the detail fields below match that type.
            </p>
            <div className="flex flex-wrap gap-2">
              {SELLER_CATEGORY_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => pickCategory(key)}
                  className={[
                    "rounded-full border-2 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide transition",
                    sellerCategory === key
                      ? "border-bmm-brown bg-bmm-brown text-bmm-cream"
                      : "border-bmm-brown bg-bmm-white text-bmm-brown hover:bg-bmm-peach/60",
                  ].join(" ")}
                >
                  {LISTING_CATEGORY_FORMS[key].shortLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-bmm-brown/15" />

          <div className="space-y-2 px-3 pb-3 pt-2">
            <h2 className="text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-bmm-brown/45">
              Details
            </h2>
            {!activeForm ? (
              <p className="text-xs font-semibold text-bmm-brown/55">Choose a category above to enter details.</p>
            ) : (
              <>
                <p className="text-[0.65rem] leading-snug text-bmm-brown/45">
                  All fields in this section are required. Extra notes and price stay optional.
                </p>
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {activeForm.line1.map((slot) => (
                      <div key={slot.id}>
                        <label
                          className="text-xs font-semibold text-bmm-brown/80"
                          htmlFor={`detail-${slot.id}`}
                        >
                          {slot.label}
                          <span className="text-red-800" aria-hidden>
                            {" "}
                            *
                          </span>
                        </label>
                        <input
                          id={`detail-${slot.id}`}
                          type="text"
                          value={details[slot.id] ?? ""}
                          onChange={(e) => setDetail(slot.id, e.target.value)}
                          placeholder={slot.placeholder}
                          className={fieldInputClass}
                          autoComplete="off"
                        />
                      </div>
                    ))}
                    {activeForm.line2.map((slot) => (
                      <div key={slot.id}>
                        <label
                          className="text-xs font-semibold text-bmm-brown/80"
                          htmlFor={`detail-${slot.id}`}
                        >
                          {slot.label}
                          <span className="text-red-800" aria-hidden>
                            {" "}
                            *
                          </span>
                        </label>
                        <input
                          id={`detail-${slot.id}`}
                          type="text"
                          value={details[slot.id] ?? ""}
                          onChange={(e) => setDetail(slot.id, e.target.value)}
                          placeholder={slot.placeholder}
                          className={fieldInputClass}
                          autoComplete="off"
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-bmm-brown/80" htmlFor="listing-extra">
                      Extra notes
                      <span className="font-normal text-bmm-brown/45"> (optional)</span>
                    </label>
                    <textarea
                      id="listing-extra"
                      value={listingExtra}
                      onChange={(e) => setListingExtra(e.target.value)}
                      placeholder="Care, story, flaws, why you’re selling…"
                      rows={3}
                      className="mt-0.5 w-full resize-none rounded-xl border-2 border-bmm-brown bg-bmm-white px-3 py-2 text-sm leading-snug text-bmm-brown outline-none transition placeholder:text-bmm-brown/38 focus-visible:ring-2 focus-visible:ring-bmm-brown/25"
                    />
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="min-w-0 flex-1 sm:max-w-[9rem]">
                      <label className="text-xs font-semibold text-bmm-brown/80" htmlFor="listing-price">
                        Price (USD)
                        <span className="font-normal text-bmm-brown/45"> (optional)</span>
                      </label>
                      <input
                        id="listing-price"
                        type="text"
                        inputMode="decimal"
                        value={listingPrice}
                        onChange={(e) => setListingPrice(e.target.value)}
                        placeholder="AI suggests if empty"
                        className="mt-0.5 w-full rounded-xl border-2 border-bmm-brown bg-bmm-white px-3 py-2 text-sm tabular-nums text-bmm-brown outline-none transition placeholder:text-bmm-brown/38 focus-visible:ring-2 focus-visible:ring-bmm-brown/25"
                      />
                    </div>
                    <p className="pb-0.5 text-[0.65rem] leading-snug text-bmm-brown/45 sm:flex-1">
                      Leave blank to use the AI-estimated price.
                    </p>
                  </div>
                </div>
              </>
            )}
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
          disabled={!canSubmit || step === "analyzing" || step === "starting"}
          className={[
            "mt-3 inline-flex w-full items-center justify-center rounded-full border-2 border-bmm-brown px-5 py-3 text-base font-bold transition",
            !canSubmit || step === "analyzing" || step === "starting"
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
      </div>
    </div>
  );
}
