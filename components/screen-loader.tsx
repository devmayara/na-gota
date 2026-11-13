"use client";

import Image from "next/image";

export function ScreenLoader({
  label = "Carregando...",
}: {
  label?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-background/70 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex size-32 items-center justify-center">
          <span
            className="absolute size-24 animate-ping rounded-full bg-primary/25"
            aria-hidden
          />
          <span
            className="absolute size-[4.5rem] animate-pulse rounded-full bg-primary/15"
            aria-hidden
          />
          <Image
            src="/brand/logo.png"
            alt=""
            width={88}
            height={88}
            priority
            className="relative size-[5.5rem] animate-nagota-drop object-contain drop-shadow-md"
          />
        </div>
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
    </div>
  );
}
