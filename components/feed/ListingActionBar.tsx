"use client";

type PurchaseProps = {
  mode: "purchase";
  price: number;
  buyLabel?: string;
  onBuy: () => void;
};

type DetailsProps = {
  mode: "details";
  price: number;
  onCopyLink: () => void;
  showRemove?: boolean;
  removing?: boolean;
  onRemove?: () => void;
};

// Sticky bottom bar: price + primary commerce actions, with safe-area padding.
export function ListingActionBar(props: PurchaseProps | DetailsProps) {
  const pad = "px-screen pb-safe pt-3";

  if (props.mode === "purchase") {
    return (
      <footer
        className={[
          "shrink-0 border-t-2 border-bmm-brown bg-bmm-cream/95 backdrop-blur-sm",
          pad,
        ].join(" ")}
      >
        <div className="mx-auto flex w-full max-w-md">
          <div className="flex flex-1 items-center justify-center border-r-2 border-bmm-brown py-3.5 text-[1.35rem] font-black tabular-nums text-bmm-brown">
            ${props.price}
          </div>
          <button
            type="button"
            className="flex flex-1 items-center justify-center py-3.5 text-base font-extrabold uppercase tracking-[0.12em] text-bmm-brown transition hover:bg-bmm-peach/80 active:bg-bmm-peach"
            onClick={props.onBuy}
          >
            {props.buyLabel ?? "Buy"}
          </button>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className={[
        "shrink-0 border-t-2 border-bmm-brown bg-bmm-cream/95 backdrop-blur-sm",
        pad,
      ].join(" ")}
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[0.65rem] font-bold uppercase tracking-wide text-bmm-brown/55">Asking</div>
            <div className="text-[1.65rem] font-black leading-none tabular-nums text-bmm-brown">${props.price}</div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="rounded-xl border-2 border-bmm-brown bg-bmm-peach px-4 py-2.5 text-xs font-extrabold uppercase tracking-wide text-bmm-brown shadow-[3px_3px_0_#5c4033] transition hover:brightness-95 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#5c4033]"
              onClick={props.onCopyLink}
            >
              Copy link
            </button>
            {props.showRemove ? (
              <button
                type="button"
                disabled={props.removing}
                className={[
                  "rounded-xl border-2 border-red-900 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wide shadow-[3px_3px_0_#7f1d1d] transition",
                  props.removing
                    ? "cursor-not-allowed bg-red-200/80 text-red-900/50"
                    : "bg-red-50 text-red-900 hover:bg-red-100 active:translate-x-[1px] active:translate-y-[1px]",
                ].join(" ")}
                onClick={() => props.onRemove?.()}
              >
                {props.removing ? "Removing…" : "Remove"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
