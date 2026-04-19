import Image from "next/image";

export function BrandMark(props: {
  className?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
  size?: number;
}) {
  const size = props.size ?? 40;
  const show = props.showWordmark !== false;
  return (
    <div className={["flex items-center gap-2.5", props.className].filter(Boolean).join(" ")}>
      <Image
        src="/brand/logo.png"
        alt="BuyMeMaybe"
        width={size}
        height={size}
        className="shrink-0 rounded-full border-2 border-bmm-brown bg-bmm-white shadow-sm"
        priority
      />
      {show ? (
        <span
          className={[
            "font-display text-lg font-bold tracking-tight text-bmm-brown",
            props.wordmarkClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          BuyMeMaybe
        </span>
      ) : null}
    </div>
  );
}
