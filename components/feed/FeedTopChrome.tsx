import { BrandMark } from "../BrandMark";
import { CategoryPills, type CategoryId } from "../CategoryPills";

// Feed header: grouped logo + wordmark, create action, category chips.
export function FeedTopChrome(props: {
  category: CategoryId;
  onCategoryChange: (next: CategoryId) => void;
}) {
  return (
    <header className="shrink-0 border-b-2 border-bmm-brown bg-bmm-cream/95 backdrop-blur-sm pt-screen">
      <div className="flex items-center justify-between gap-2 px-screen pb-2 pt-1">
        <BrandMark size={36} className="min-w-0 flex-1" wordmarkClassName="text-[1.02rem] leading-none" />
        <a
          href="/create"
          className="inline-flex min-w-[9.5rem] shrink-0 items-center justify-center gap-2 rounded-full border-2 border-bmm-brown bg-bmm-peach px-4 py-1.5 text-[0.78rem] font-extrabold leading-tight tracking-wide text-bmm-brown min-[380px]:min-w-[10.5rem] min-[380px]:px-5 min-[380px]:py-2 min-[380px]:text-sm sm:min-w-[11.5rem] sm:px-6 sm:text-[0.95rem] sm:tracking-[0.08em] transition hover:brightness-95 active:brightness-95"
          aria-label="Create new listing"
        >
          <span aria-hidden className="text-base font-black leading-none min-[380px]:text-lg">
            +
          </span>
          <span className="whitespace-nowrap">New Listing</span>
        </a>
      </div>
      <CategoryPills value={props.category} onChange={props.onCategoryChange} />
    </header>
  );
}
