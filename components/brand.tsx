/* Brand artwork for the portal shell: bilingual AICTE block, tricolour swoosh and a light building line-drawing.
   All inline SVG – no image downloads, so it stays low-bandwidth friendly. */
import { cn } from "@/lib/utils";

/** Emblem slot + AICTE wordmark + English/Hindi council name (white on navy) */
export function BrandBlock({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Replace /public/brand/emblem.svg with the official emblem you are authorised to use */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/emblem.svg" alt="" width={40} height={50} className="h-[50px] w-10 shrink-0" />
      <div className="min-w-0 leading-tight text-white">
        <p className="text-[1.75rem] font-bold leading-none tracking-wide">AICTE</p>
        <p className="whitespace-nowrap text-[10.5px] text-white/90">All India Council for Technical Education</p>
        <p className="whitespace-nowrap text-[11px] text-white/80" lang="hi">अखिल भारतीय तकनीकी शिक्षा परिषद</p>
      </div>
    </div>
  );
}

/** Three flowing bands in saffron / white / green */
export function TricolourSwoosh({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 40" preserveAspectRatio="none" aria-hidden className={className}>
      <path d="M0 26 C60 4 130 0 240 8 L240 14 C130 8 64 12 0 32 Z" fill="#FF9933" />
      <path d="M0 32 C64 12 130 8 240 14 L240 20 C132 15 68 20 0 37 Z" fill="#FFFFFF" />
      <path d="M0 37 C68 20 132 15 240 20 L240 26 C134 22 72 28 0 40 Z" fill="#138808" />
    </svg>
  );
}

/** Light line-art of a colonnaded institutional building (decorative) */
export function BuildingArt({ className, stroke = "#B8C9E8" }: { className?: string; stroke?: string }) {
  const cols = Array.from({ length: 11 }, (_, i) => 30 + i * 22);
  return (
    <svg viewBox="0 0 300 130" fill="none" aria-hidden className={className}>
      <g stroke={stroke} strokeWidth="1.4" strokeLinecap="round">
        {/* dome + drum */}
        <path d="M120 40 Q150 2 180 40" />
        <line x1="150" y1="6" x2="150" y2="0" />
        <rect x="116" y="40" width="68" height="12" />
        {[124, 136, 148, 160, 172].map((x) => <line key={x} x1={x} y1="42" x2={x} y2="50" />)}
        {/* pediment */}
        <path d="M20 66 L150 52 L280 66" />
        <line x1="20" y1="66" x2="280" y2="66" />
        <line x1="16" y1="71" x2="284" y2="71" />
        {/* columns */}
        {cols.map((x) => (
          <g key={x}>
            <line x1={x} y1="73" x2={x} y2="112" />
            <line x1={x + 6} y1="73" x2={x + 6} y2="112" />
          </g>
        ))}
        {/* side wings */}
        <rect x="2" y="80" width="18" height="32" />
        <rect x="280" y="80" width="18" height="32" />
        {/* steps */}
        <line x1="0" y1="112" x2="300" y2="112" />
        <line x1="10" y1="118" x2="290" y2="118" />
        <line x1="22" y1="124" x2="278" y2="124" />
      </g>
    </svg>
  );
}

/** Small flag mark used beside the hero tagline */
export function FlagMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 12" aria-hidden className={className}>
      <path d="M0 4 Q18 -1 36 3 L36 5 Q18 1 0 6 Z" fill="#FF9933" />
      <path d="M0 6 Q18 1 36 5 L36 7 Q18 3 0 8 Z" fill="#E9EDF2" />
      <path d="M0 8 Q18 3 36 7 L36 9 Q18 5 0 10 Z" fill="#138808" />
    </svg>
  );
}
