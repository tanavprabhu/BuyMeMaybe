// Bottom gradient + readable hook line on listing media (first bullet or title fallback).

export function MediaCaptionStrip(props: { line: string | null }) {
  if (!props.line) return null;
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/78 via-black/35 to-transparent px-4 pb-4 pt-12"
      aria-hidden
    >
      <p className="line-clamp-2 text-[0.85rem] font-semibold leading-snug text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]">
        {props.line}
      </p>
    </div>
  );
}
