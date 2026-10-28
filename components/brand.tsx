"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * VidyaVerse Brand Logo Icon
 * Concept:
 * - Geometric 'V' inspired by open book pages (Navy #0B3D91 / Deep Navy #082B63)
 * - Integrated verification checkmark (#138808)
 * - Thin saffron orbital arc (#FF9933) representing the connected academic ecosystem
 * - Small orbit node representing participating institutions
 */
export function VidyaVerseLogo({
  className,
  size = 36,
  inverted = false,
}: {
  className?: string;
  size?: number;
  inverted?: boolean;
}) {
  const primaryNavy = inverted ? "#FFFFFF" : "#0B3D91";
  const deepNavy = inverted ? "#E8EEF9" : "#082B63";
  const saffron = "#FF9933";
  const green = "#138808";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {/* Saffron Orbital Arc representing interconnected academic ecosystem */}
      <path
        d="M 6 22 C 7 10, 24 5, 39 12 C 43 14, 45 17, 43 21 C 41 24, 38 25, 35 23"
        stroke={saffron}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeDasharray="2 1"
        opacity="0.95"
      />

      {/* Orbit node: Participating institution */}
      <circle cx="41" cy="13" r="2.75" fill={saffron} />
      <circle cx="41" cy="13" r="4.5" stroke={saffron} strokeWidth="0.8" opacity="0.4" />

      {/* Left wing of geometric V (Open Book Spine/Page) */}
      <path
        d="M 10 13 L 24 37 L 24 23 L 14 11 Z"
        fill={deepNavy}
      />

      {/* Right wing of geometric V (Elevated Page) */}
      <path
        d="M 24 37 L 38 13 L 32 11 L 24 25 Z"
        fill={primaryNavy}
      />

      {/* Center spine highlight */}
      <path
        d="M 23 24 L 24 37 L 25 24 Z"
        fill={inverted ? "#CBD5E1" : "#DCE5F0"}
      />

      {/* Integrated verification check badge on the right apex/wing */}
      <circle cx="34" cy="28" r="8" fill={green} />
      <path
        d="M 30.5 28 L 33 30.5 L 37.5 25.5"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * VidyaVerse Brand Wordmark with Logo
 */
export function VidyaVerseBrand({
  className,
  inverted = false,
  subtitle = true,
  compact = false,
}: {
  className?: string;
  inverted?: boolean;
  subtitle?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <VidyaVerseLogo size={compact ? 32 : 38} inverted={inverted} />
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "font-bold tracking-tight text-lg sm:text-xl",
              inverted ? "text-white" : "text-navy"
            )}
          >
            Vidya<span className="text-[#082B63] dark:text-saffron">Verse</span>
          </span>
          <span className="rounded bg-saffron/15 px-1.5 py-0.2 text-[9.5px] font-bold uppercase tracking-wider text-[#B45309]">
            AICTE
          </span>
        </div>
        {subtitle && (
          <span
            className={cn(
              "text-[10.5px] tracking-tight font-medium",
              inverted ? "text-white/75" : "text-muted"
            )}
          >
            APAAR Student Identity & Verification
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Brand Block for existing portal shells and footers
 */
export function BrandBlock({ className }: { className?: string }) {
  return <VidyaVerseBrand className={className} inverted />;
}

/**
 * Three flowing bands in saffron / white / green
 */
export function TricolourSwoosh({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 40" preserveAspectRatio="none" aria-hidden className={className}>
      <path d="M0 26 C60 4 130 0 240 8 L240 14 C130 8 64 12 0 32 Z" fill="#FF9933" />
      <path d="M0 32 C64 12 130 8 240 14 L240 20 C132 15 68 20 0 37 Z" fill="#FFFFFF" />
      <path d="M0 37 C68 20 132 15 240 20 L240 26 C134 22 72 28 0 40 Z" fill="#138808" />
    </svg>
  );
}

/**
 * Light line-art of colonnaded institutional building
 */
export function BuildingArt({ className, stroke = "#B8C9E8" }: { className?: string; stroke?: string }) {
  const cols = Array.from({ length: 11 }, (_, i) => 30 + i * 22);
  return (
    <svg viewBox="0 0 300 130" fill="none" aria-hidden className={className}>
      <g stroke={stroke} strokeWidth="1.4" strokeLinecap="round">
        <path d="M120 40 Q150 2 180 40" />
        <line x1="150" y1="6" x2="150" y2="0" />
        <rect x="116" y="40" width="68" height="12" />
        {[124, 136, 148, 160, 172].map((x) => (
          <line key={x} x1={x} y1="42" x2={x} y2="50" />
        ))}
        <path d="M20 66 L150 52 L280 66" />
        <line x1="20" y1="66" x2="280" y2="66" />
        <line x1="16" y1="71" x2="284" y2="71" />
        {cols.map((x) => (
          <g key={x}>
            <line x1={x} y1="73" x2={x} y2="112" />
            <line x1={x + 6} y1="73" x2={x + 6} y2="112" />
          </g>
        ))}
        <rect x="2" y="80" width="18" height="32" />
        <rect x="280" y="80" width="18" height="32" />
        <line x1="0" y1="112" x2="300" y2="112" />
        <line x1="10" y1="118" x2="290" y2="118" />
        <line x1="22" y1="124" x2="278" y2="124" />
      </g>
    </svg>
  );
}

/** Small flag mark */
export function FlagMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 12" aria-hidden className={className}>
      <path d="M0 4 Q18 -1 36 3 L36 5 Q18 1 0 6 Z" fill="#FF9933" />
      <path d="M0 6 Q18 1 36 5 L36 7 Q18 3 0 8 Z" fill="#DCE5F0" />
      <path d="M0 8 Q18 3 36 7 L36 9 Q18 5 0 10 Z" fill="#138808" />
    </svg>
  );
}

/**
 * The VidyaVerse Identity Ecosystem Visualization
 * A high-quality vector illustration featuring:
 * 1. Central academic credential card (focal point, demo specimen)
 * 2. Abstract student identity & masked APAAR identifier (•••• •••• 4092)
 * 3. Green verification badge & QR code representation
 * 4. Thin orbital connection paths
 * 5. Three connected nodes:
 *    - Institution (Intake & Records)
 *    - Student (Consent & Privacy)
 *    - Authorized Verifier (Employer/Academic Verification)
 * 6. Restrained saffron and green accent points
 */
export function IdentityEcosystemIllustration({ className }: { className?: string }) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[560px] select-none", className)}>
      <svg
        viewBox="0 0 540 440"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-md"
        aria-label="Illustration of VidyaVerse academic identity and verification ecosystem"
      >
        <defs>
          <linearGradient id="cardGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8FAFD" />
          </linearGradient>
          <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B3D91" />
            <stop offset="100%" stopColor="#082B63" />
          </linearGradient>
          <filter id="cardShadow" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0B3D91" floodOpacity="0.08" />
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#0B3D91" floodOpacity="0.04" />
          </filter>
        </defs>

        {/* Ambient background orbital circles and connection geometry */}
        <circle cx="270" cy="220" r="190" stroke="#E2EBF5" strokeWidth="1.2" strokeDasharray="4 4" />
        <circle cx="270" cy="220" r="145" stroke="#E8F0F8" strokeWidth="1" />
        <circle cx="270" cy="220" r="80" stroke="#EDF4FA" strokeWidth="1" />

        {/* Saffron elliptical orbital accent */}
        <path
          d="M 100 240 C 130 90, 410 90, 440 240 C 410 390, 130 390, 100 240"
          stroke="#FF9933"
          strokeWidth="1.2"
          strokeDasharray="6 6"
          opacity="0.55"
        />

        {/* Connection rays from center to nodes */}
        <line x1="270" y1="220" x2="80" y2="110" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3" />
        <line x1="270" y1="220" x2="460" y2="110" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3" />
        <line x1="270" y1="220" x2="270" y2="385" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3" />

        {/* ========================================================= */}
        {/* NODE 1: Institution (Top-Left) */}
        {/* ========================================================= */}
        <g transform="translate(40, 65)">
          <rect width="145" height="66" rx="12" fill="#FFFFFF" stroke="#DCE5F0" strokeWidth="1.5" />
          <circle cx="32" cy="33" r="16" fill="#E8EEF9" />
          {/* Building Icon */}
          <path
            d="M 24 39 L 24 28 L 32 23 L 40 28 L 40 39 Z M 28 32 H 30 V 34 H 28 Z M 34 32 H 36 V 34 H 34 Z M 30 39 V 35 H 34 V 39 Z"
            fill="#0B3D91"
          />
          <text x="56" y="28" fill="#152238" fontSize="11" fontWeight="700">Institution</text>
          <text x="56" y="42" fill="#64748B" fontSize="9.5" fontWeight="500">Approved Intake</text>
          <text x="56" y="53" fill="#138808" fontSize="8.5" fontWeight="600">✓ Digital Seat Ledger</text>
          {/* Node pulse indicator */}
          <circle cx="140" cy="12" r="3.5" fill="#0B3D91" />
        </g>

        {/* ========================================================= */}
        {/* NODE 2: Authorized Verifier (Top-Right) */}
        {/* ========================================================= */}
        <g transform="translate(355, 65)">
          <rect width="145" height="66" rx="12" fill="#FFFFFF" stroke="#DCE5F0" strokeWidth="1.5" />
          <circle cx="32" cy="33" r="16" fill="#EAF7EF" />
          {/* Shield Check Icon */}
          <path
            d="M 32 23 L 39 26 V 32 C 39 36 36 39 32 41 C 28 39 25 36 25 32 V 26 Z M 29 32 L 31.5 34.5 L 35.5 29.5"
            stroke="#138808"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text x="56" y="28" fill="#152238" fontSize="11" fontWeight="700">Verifier</text>
          <text x="56" y="42" fill="#64748B" fontSize="9.5" fontWeight="500">Employer / Agency</text>
          <text x="56" y="53" fill="#138808" fontSize="8.5" fontWeight="600">✓ Instant Verification</text>
          {/* Node pulse indicator */}
          <circle cx="6" cy="12" r="3.5" fill="#138808" />
        </g>

        {/* ========================================================= */}
        {/* NODE 3: Student Consent Node (Bottom-Center) */}
        {/* ========================================================= */}
        <g transform="translate(190, 350)">
          <rect width="160" height="64" rx="12" fill="#FFFFFF" stroke="#DCE5F0" strokeWidth="1.5" />
          <circle cx="30" cy="32" r="15" fill="#FFF5E8" />
          {/* Key / Lock User Icon */}
          <circle cx="30" cy="28" r="4.5" fill="#D97706" />
          <path d="M 23 38 C 23 34 26 33 30 33 C 34 33 37 34 37 38" fill="#D97706" />
          <text x="54" y="27" fill="#152238" fontSize="11" fontWeight="700">Student Control</text>
          <text x="54" y="40" fill="#64748B" fontSize="9.5" fontWeight="500">DPDP Act 2023 Consent</text>
          <text x="54" y="51" fill="#FF9933" fontSize="8.5" fontWeight="600">● Self-Sovereign Access</text>
        </g>

        {/* ========================================================= */}
        {/* CENTRAL FOCAL POINT: Verifiable Academic Credential Card */}
        {/* ========================================================= */}
        <g transform="translate(150, 115)" filter="url(#cardShadow)">
          {/* Main Card Container */}
          <rect
            width="240"
            height="210"
            rx="14"
            fill="url(#cardGlow)"
            stroke="#DCE5F0"
            strokeWidth="1.5"
          />

          {/* Tricolour Accent Line at Top */}
          <rect x="0" y="0" width="80" height="3.5" rx="2" fill="#FF9933" />
          <rect x="80" y="0" width="80" height="3.5" fill="#FFFFFF" />
          <rect x="160" y="0" width="80" height="3.5" rx="2" fill="#138808" />

          {/* Card Header */}
          <g transform="translate(14, 16)">
            {/* AICTE / VidyaVerse Monogram */}
            <rect width="24" height="24" rx="6" fill="#0B3D91" />
            <path d="M 6 7 L 12 19 L 18 7" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <text x="32" y="12" fill="#0B3D91" fontSize="10.5" fontWeight="800" letterSpacing="0.3">VIDYAVERSE</text>
            <text x="32" y="22" fill="#64748B" fontSize="8" fontWeight="600">ACADEMIC CREDENTIAL</text>
            <rect x="148" y="2" width="64" height="18" rx="9" fill="#EAF7EF" stroke="#B9DDB1" strokeWidth="0.8" />
            <circle cx="157" cy="11" r="3" fill="#138808" />
            <text x="164" y="14" fill="#0E6106" fontSize="8" fontWeight="700">VERIFIED</text>
          </g>

          <line x1="14" y1="48" x2="226" y2="48" stroke="#DCE5F0" strokeWidth="1" />

          {/* Student Profile & Identifier Segment */}
          <g transform="translate(14, 58)">
            {/* Avatar Placeholder */}
            <circle cx="18" cy="18" r="16" fill="#E8EEF9" stroke="#CBD5E1" strokeWidth="1" />
            <circle cx="18" cy="14" r="5" fill="#0B3D91" />
            <path d="M 9 27 C 9 22 13 21 18 21 C 23 21 27 22 27 27" fill="#0B3D91" />

            <text x="42" y="13" fill="#64748B" fontSize="8" fontWeight="600">STUDENT IDENTITY (SPECIMEN)</text>
            <text x="42" y="25" fill="#152238" fontSize="12" fontWeight="700">Aarav Sharma</text>
            <text x="42" y="36" fill="#64748B" fontSize="9" fontWeight="500">B.Tech · Computer Science</text>
          </g>

          {/* Masked APAAR ID Block */}
          <g transform="translate(14, 106)">
            <rect width="212" height="30" rx="6" fill="#F0F4FA" stroke="#DCE5F0" strokeWidth="1" />
            <text x="10" y="19" fill="#64748B" fontSize="8" fontWeight="700" letterSpacing="0.5">APAAR ID</text>
            <text x="68" y="20" fill="#082B63" fontSize="11" fontWeight="700" fontFamily="monospace" letterSpacing="1">
              •••• •••• 4092
            </text>
            <rect x="174" y="6" width="30" height="18" rx="4" fill="#E8EEF9" />
            <text x="180" y="18" fill="#0B3D91" fontSize="7.5" fontWeight="700">VALID</text>
          </g>

          {/* Cryptographic Proof & QR Section */}
          <g transform="translate(14, 145)">
            <rect width="160" height="52" rx="6" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
            <text x="8" y="14" fill="#64748B" fontSize="7.5" fontWeight="600">ISSUING INSTITUTION</text>
            <text x="8" y="25" fill="#152238" fontSize="8.5" fontWeight="700">Pune Inst. of Engg & Tech</text>
            <text x="8" y="36" fill="#64748B" fontSize="7.5">STANDARD: W3C VC 2.0 (Ed25519)</text>
            <text x="8" y="46" fill="#138808" fontSize="7.5" fontWeight="600">STATUS: Bitstring Active (0)</text>

            {/* Stylized QR Code Graphic */}
            <g transform="translate(170, 2)">
              <rect width="42" height="42" rx="4" fill="#FFFFFF" stroke="#0B3D91" strokeWidth="1" />
              {/* QR Corners */}
              <rect x="4" y="4" width="10" height="10" fill="#0B3D91" />
              <rect x="6" y="6" width="6" height="6" fill="#FFFFFF" />
              <rect x="28" y="4" width="10" height="10" fill="#0B3D91" />
              <rect x="30" y="6" width="6" height="6" fill="#FFFFFF" />
              <rect x="4" y="28" width="10" height="10" fill="#0B3D91" />
              <rect x="6" y="30" width="6" height="6" fill="#FFFFFF" />
              {/* QR internal data blocks */}
              <rect x="16" y="8" width="4" height="4" fill="#0B3D91" />
              <rect x="22" y="12" width="4" height="6" fill="#0B3D91" />
              <rect x="16" y="18" width="8" height="4" fill="#0B3D91" />
              <rect x="28" y="22" width="6" height="4" fill="#0B3D91" />
              <rect x="18" y="28" width="6" height="6" fill="#0B3D91" />
              <rect x="28" y="32" width="8" height="4" fill="#0B3D91" />
              <text x="21" y="49" fill="#64748B" fontSize="6.5" textAnchor="middle" fontWeight="600">SCAN QR</text>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
