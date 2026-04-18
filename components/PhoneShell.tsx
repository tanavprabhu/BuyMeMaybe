"use client";

// Wraps the app in a centered iPhone-style frame on wider viewports; full-bleed on small phones.
export function PhoneShell(props: { children: React.ReactNode }) {
  return (
    <div className="phone-root flex min-h-dvh w-full flex-col bg-bmm-sky md:min-h-dvh md:items-center md:justify-center md:bg-gradient-to-b md:from-zinc-700 md:to-zinc-900 md:py-6">
      <div className="relative flex min-h-dvh w-full flex-col bg-bmm-sky md:mx-auto md:min-h-0 md:h-[min(852px,calc(100dvh-48px))] md:max-h-[852px] md:w-[min(390px,calc(100vw-40px))] md:rounded-[2.85rem] md:border-[14px] md:border-zinc-900 md:bg-zinc-900 md:shadow-[0_28px_80px_rgba(0,0,0,0.55)] md:ring-1 md:ring-white/10">
        {/* Volume / mute rails (decorative, desktop only) */}
        <span
          className="pointer-events-none absolute left-0 top-[22%] hidden h-14 w-[3px] rounded-l-md bg-zinc-600 md:block"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute left-0 top-[32%] hidden h-10 w-[3px] rounded-l-md bg-zinc-600 md:block"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute right-0 top-[28%] hidden h-20 w-[3px] rounded-r-md bg-zinc-600 md:block"
          aria-hidden
        />

        {/* Dynamic Island */}
        <div className="hidden shrink-0 justify-center pt-3 md:flex">
          <div className="h-7 w-[112px] rounded-full bg-black shadow-inner" />
        </div>

        {/* Screen glass */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:mx-1 md:mb-1 md:rounded-b-[2.25rem] md:rounded-t-lg md:bg-bmm-sky">
          {props.children}
        </div>

        {/* Home indicator */}
        <div className="hidden shrink-0 justify-center pb-2 pt-1 md:flex">
          <div className="h-1 w-28 rounded-full bg-zinc-500/80" />
        </div>
      </div>
    </div>
  );
}
