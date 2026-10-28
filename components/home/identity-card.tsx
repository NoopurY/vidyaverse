import { BadgeCheck, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";

// Clearly fictional target: this QR does not resolve to any real record.
const DEMO_QR_TEXT = "https://demo.vidyaverse.invalid/verify/DEMO-7832";

function QrGraphic({ className }: { className?: string }) {
  const qr = QRCode.create(DEMO_QR_TEXT, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const bits = qr.modules.data;
  let d = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (bits[y * n + x]) d += `M${x} ${y}h1v1h-1z`;
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className={className} shapeRendering="crispEdges" role="img" aria-label="Demonstration QR code (not linked to a real record)">
      <rect x="-1" y="-1" width={n + 2} height={n + 2} fill="#fff" />
      <path d={d} fill="#10234E" />
    </svg>
  );
}

/** Illustrative APAAR-style academic identity card. All data is fictional. */
export function AcademicIdentityCard({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[22px] border border-[#D5E2F5] bg-white p-5 shadow-[0_30px_60px_-24px_rgba(16,35,78,0.35),0_8px_20px_-10px_rgba(16,35,78,0.15)] ${className ?? ""}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-transparent to-[#EAF2FF]/70" aria-hidden />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-vv-ice text-vv-blue">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </span>
            <div className="leading-tight">
              <p className="text-[19px] font-extrabold tracking-tight text-vv-navy">APAAR</p>
              <p className="text-[10px] font-medium text-vv-muted">Academic Identity</p>
            </div>
          </div>
          <span className="rounded-md border border-vv-line bg-vv-ice px-2 py-0.5 text-[9px] font-bold tracking-widest text-vv-muted">DEMO</span>
        </div>

        <div className="mt-4 flex items-start gap-3">
          <div className="flex h-[62px] w-[62px] shrink-0 items-end justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[#DCE9FB] to-[#BCD3F5]" aria-hidden>
            <svg viewBox="0 0 60 60" className="h-full w-full">
              <circle cx="30" cy="24" r="10" fill="#E8B48A" />
              <path d="M19 22 Q20 11 31 11 Q42 12 41 22 Q38 16 30 16 Q23 16 19 22Z" fill="#1A1B33" />
              <path d="M8 62 Q10 40 30 38 Q50 40 52 62Z" fill="#0648B5" />
            </svg>
          </div>
          <dl className="min-w-0 flex-1 text-[11px] leading-snug">
            <dt className="sr-only">Name</dt>
            <dd className="text-[14px] font-bold text-vv-navy">Arjun Mehta</dd>
            <dt className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-vv-muted">APAAR ID</dt>
            <dd className="font-mono text-[12px] font-semibold text-vv-text">XXXX-XXXX-7832</dd>
          </dl>
          <QrGraphic className="h-[74px] w-[74px] shrink-0 rounded-lg border border-vv-line" />
        </div>
        <dl className="mt-3 text-[11px] leading-snug">
          <dt className="sr-only">Programme</dt>
          <dd className="font-medium text-vv-text">B.Tech · Computer Engineering</dd>
          <dt className="sr-only">Institution</dt>
          <dd className="text-vv-muted">Vidyalankar Institute of Technology</dd>
        </dl>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#CDEBD8] bg-vv-greenbg px-3.5 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-vv-green text-white">
            <BadgeCheck className="h-5 w-5" aria-hidden />
          </span>
          <div className="leading-tight">
            <p className="text-[13px] font-bold text-vv-green">Verified Student Record</p>
            <p className="text-[10.5px] text-vv-muted">Consent-based · Tamper-evident</p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-vv-muted/80">Demo state · fictional data</p>
          </div>
        </div>
      </div>
    </div>
  );
}
