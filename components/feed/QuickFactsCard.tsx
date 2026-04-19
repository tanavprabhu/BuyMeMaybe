// Compact two-column facts card for listing details.

export type QuickFactRow = { label: string; value: string; valueClassName?: string };

export function QuickFactsCard(props: { rows: QuickFactRow[] }) {
  return (
    <div className="rounded-2xl border-2 border-bmm-brown bg-bmm-white p-4 shadow-[4px_4px_0_#5c4033]">
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
