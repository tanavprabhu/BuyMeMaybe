// Two-column facts: default is a bordered card; `inline` is flat for embedding in the media carousel.

export type QuickFactRow = { label: string; value: string; valueClassName?: string };

export function QuickFactsCard(props: { rows: QuickFactRow[]; variant?: "card" | "inline" }) {
  const inline = props.variant === "inline";

  if (inline) {
    return (
      <div className="min-w-0 bg-transparent">
        <div className="text-[0.58rem] font-extrabold uppercase tracking-[0.12em] text-bmm-brown/45">
          Quick facts
        </div>
        <div className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5">
          {props.rows.map((r) => (
            <div key={r.label} className="contents">
              <div className="shrink-0 whitespace-nowrap text-[0.65rem] font-semibold leading-snug text-bmm-brown/50">
                {r.label}
              </div>
              <div
                className={[
                  "min-w-0 text-right text-[0.72rem] font-bold leading-snug text-bmm-brown break-words [overflow-wrap:anywhere]",
                  r.valueClassName,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {r.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-bmm-brown bg-bmm-white p-4">
      <div className="text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-bmm-brown/50">Quick facts</div>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 text-sm">
        {props.rows.map((r) => (
          <div key={r.label} className="contents">
            <div className="text-[0.8rem] font-semibold text-bmm-brown/55">{r.label}</div>
            <div
              className={[
                "max-w-[11.5rem] text-right text-[0.95rem] font-bold leading-snug text-bmm-brown",
                r.valueClassName,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {r.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
