"use client";

const CATEGORIES = [
  { id: "all", label: "For you" },
  { id: "kitchen", label: "Kitchen" },
  { id: "clothing", label: "Clothes" },
  { id: "electronics", label: "Tech" },
  { id: "decor", label: "Decor" },
  { id: "books", label: "Books" },
  { id: "random", label: "Random" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

// Renders a horizontal category filter bar and notifies the parent on changes.
export function CategoryPills(props: {
  value: CategoryId;
  onChange: (next: CategoryId) => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-3 py-2">
      {CATEGORIES.map((c) => {
        const active = props.value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => props.onChange(c.id)}
            className={[
              "shrink-0 rounded-full border-2 border-bmm-brown px-3 py-1 text-sm font-semibold transition",
              active
                ? "bg-bmm-brown text-bmm-cream"
                : "bg-bmm-peach/70 text-bmm-brown hover:bg-bmm-peach",
            ].join(" ")}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
