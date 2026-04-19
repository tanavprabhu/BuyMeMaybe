import { BrandMark } from "../BrandMark";
import { CategoryPills, type CategoryId } from "../CategoryPills";

// Feed header: grouped logo + wordmark, create action, category chips.
export function FeedTopChrome(props: {
  category: CategoryId;
  onCategoryChange: (next: CategoryId) => void;
}) {
  return (
    <header className="shrink-0 border-b-2 border-bmm-brown bg-bmm-cream/95 backdrop-blur-sm pt-screen">
      <div className="flex items-center justify-between gap-3 px-screen pb-2 pt-1">
        <BrandMark size={36} className="min-w-0" wordmarkClassName="text-[1.02rem] leading-none" />
        <a
          href="/create"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-bmm-brown bg-bmm-peach text-[1.35rem] font-bold leading-none text-bmm-brown shadow-[3px_3px_0_#5c4033] transition hover:brightness-95 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#5c4033]"
          aria-label="Create listing"
        >
          ＋
        </a>
      </div>
      <CategoryPills value={props.category} onChange={props.onCategoryChange} />
    </header>
  );
}
