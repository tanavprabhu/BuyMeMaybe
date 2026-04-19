import { LikeButton } from "../LikeButton";

function sellerAvatarInitial(sellerName: string): string {
  const raw = sellerName.trim();
  if (!raw) return "?";
  const afterAt = raw.startsWith("@") ? raw.slice(1).trim() : raw;
  const letter = afterAt.match(/\p{L}/u) ?? afterAt.match(/[A-Za-z]/);
  if (letter) return letter[0]!.toUpperCase();
  const digit = afterAt.match(/\d/);
  if (digit) return digit[0]!;
  return "?";
}

export function SellerMetaRow(props: {
  sellerName: string;
  postedLabel: string;
  itemId: string;
  initialLikes: number;
}) {
  const initial = sellerAvatarInitial(props.sellerName);

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 sm:gap-x-3">
      <div className="flex items-center self-stretch">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-bmm-brown bg-bmm-peach text-[1.05rem] font-extrabold leading-none text-bmm-brown shadow-sm"
          aria-hidden
        >
          {initial}
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-2 self-stretch sm:gap-3">
        <div className="flex min-w-0 flex-1 flex-col justify-center pr-1">
          <div className="truncate text-[0.95rem] font-bold leading-snug text-bmm-brown">{props.sellerName}</div>
          <div className="mt-0.5 truncate text-[0.8rem] font-semibold leading-snug text-bmm-brown/55">{props.postedLabel}</div>
        </div>
        <div className="flex shrink-0 items-center">
          <LikeButton itemId={props.itemId} initialLikes={props.initialLikes} layout="inline" />
        </div>
      </div>
    </div>
  );
}
