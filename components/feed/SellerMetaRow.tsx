import { LikeButton } from "../LikeButton";

// Seller avatar, handle, posted date, and likes in one aligned row.
export function SellerMetaRow(props: {
  sellerName: string;
  postedLabel: string;
  itemId: string;
  initialLikes: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-bmm-brown bg-bmm-peach text-lg text-bmm-brown shadow-sm"
        aria-hidden
      >
        ☺
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[0.95rem] font-bold leading-tight text-bmm-brown">{props.sellerName}</div>
        <div className="mt-0.5 text-[0.8rem] font-semibold text-bmm-brown/55">{props.postedLabel}</div>
      </div>
      <div className="shrink-0 self-center">
        <LikeButton itemId={props.itemId} initialLikes={props.initialLikes} layout="inline" />
      </div>
    </div>
  );
}
