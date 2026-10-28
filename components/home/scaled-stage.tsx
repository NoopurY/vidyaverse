"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lays children out on a fixed design canvas (w × h) and scales it down to fit the
 * available width, so the layered hero illustration keeps its composition on laptops.
 */
export function ScaledStage({ w, h, children, className }: { w: number; h: number; children: React.ReactNode; className?: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / w));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);

  const s = scale ?? 1;
  return (
    <div ref={outer} className={className} style={{ height: h * s }}>
      <div
        style={{
          width: w,
          height: h,
          transform: `scale(${s})`,
          transformOrigin: "top left",
          opacity: scale === null ? 0 : 1,
          transition: "opacity .3s",
        }}
        className="relative"
      >
        {children}
      </div>
    </div>
  );
}
