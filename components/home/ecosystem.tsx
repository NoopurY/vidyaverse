"use client";

import { useEffect, useState } from "react";

const PATHS = [
  { id: "vv-p1", d: "M285 48 C390 -6 510 18 548 92", color: "#2166D1", dur: "9s" },
  { id: "vv-p2", d: "M92 300 C70 190 150 90 215 62", color: "#FF8A18", dur: "11s" },
  { id: "vv-p3", d: "M612 150 C676 250 650 340 590 392", color: "#169447", dur: "10s" },
  { id: "vv-p4", d: "M170 505 C320 540 480 500 560 430", color: "#2166D1", dur: "12s" },
];

/** Thin SVG curves + nodes linking institutions → students → verifiers. Motion is skipped for reduced-motion users. */
export function EcosystemConnections({ className }: { className?: string }) {
  const [motion, setMotion] = useState(false);
  useEffect(() => {
    setMotion(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return (
    <svg viewBox="0 0 680 520" className={className} aria-hidden focusable="false">
      {PATHS.map((p) => (
        <g key={p.id}>
          <path id={p.id} d={p.d} fill="none" stroke={p.color} strokeWidth="2" strokeLinecap="round" opacity="0.75" />
          <circle r="5" fill="#fff" stroke={p.color} strokeWidth="2.5">
            {motion ? (
              <animateMotion dur={p.dur} repeatCount="indefinite">
                <mpath href={`#${p.id}`} />
              </animateMotion>
            ) : (
              <animateMotion dur="1s" fill="freeze" keyPoints="0.5;0.5" keyTimes="0;1" calcMode="linear">
                <mpath href={`#${p.id}`} />
              </animateMotion>
            )}
          </circle>
        </g>
      ))}
    </svg>
  );
}
