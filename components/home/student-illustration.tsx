/** Flat editorial illustration of a student holding a laptop. Original artwork, no external asset. */
export function StudentIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 400" className={className} role="img" aria-label="Illustration of a smiling student in a blue hoodie holding a laptop" focusable="false">
      {/* saffron accent stroke behind the figure */}
      <path d="M18 330 C -4 210 40 110 120 70" fill="none" stroke="#FF8A18" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
      <path d="M30 352 C 8 240 52 140 128 92" fill="none" stroke="#FFB867" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      {/* torso: hoodie */}
      <path d="M38 400 L46 282 Q54 220 104 206 L158 206 Q208 220 216 282 L224 400 Z" fill="#0648B5" />
      <path d="M38 400 L46 282 Q50 244 74 224 L84 400 Z" fill="#053a96" opacity="0.55" />
      {/* hood + tee */}
      <path d="M98 206 Q130 242 162 206 Q152 188 130 188 Q108 188 98 206 Z" fill="#2166D1" />
      <path d="M112 207 L130 244 L148 207 Z" fill="#FFFFFF" />
      <path d="M110 232 L106 262 M150 232 L154 262" stroke="#DCE7F5" strokeWidth="3" strokeLinecap="round" />
      {/* neck + head */}
      <rect x="117" y="166" width="26" height="36" rx="10" fill="#D49A74" />
      <ellipse cx="130" cy="128" rx="40" ry="46" fill="#E8B48A" />
      <ellipse cx="90" cy="133" rx="6" ry="10" fill="#E0A87F" />
      <ellipse cx="170" cy="133" rx="6" ry="10" fill="#E0A87F" />
      {/* hair */}
      <path d="M88 122 Q84 70 134 68 Q180 70 172 122 Q168 96 144 92 Q112 90 100 112 Q96 120 88 122 Z" fill="#1A1B33" />
      <path d="M100 100 Q124 80 160 96" fill="none" stroke="#2D2F57" strokeWidth="3" strokeLinecap="round" />
      {/* face, gazing slightly up and to the right */}
      <path d="M104 118 Q114 111 124 116 M138 116 Q148 111 158 118" fill="none" stroke="#1A1B33" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="116" cy="130" rx="4.2" ry="5.2" fill="#1A1B33" />
      <ellipse cx="148" cy="130" rx="4.2" ry="5.2" fill="#1A1B33" />
      <circle cx="117.5" cy="128" r="1.3" fill="#fff" />
      <circle cx="149.5" cy="128" r="1.3" fill="#fff" />
      <path d="M133 134 Q136 146 130 148" fill="none" stroke="#C98B63" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M116 156 Q132 168 150 154" fill="none" stroke="#9B5B3C" strokeWidth="3" strokeLinecap="round" />
      {/* laptop held against the chest */}
      <g transform="rotate(-4 132 325)">
        <rect x="56" y="280" width="152" height="90" rx="6" fill="#10234E" />
        <rect x="62" y="286" width="140" height="78" rx="3" fill="#EAF2FF" />
        <rect x="70" y="294" width="46" height="5" rx="2.5" fill="#B9CDEE" />
        <rect x="70" y="304" width="30" height="5" rx="2.5" fill="#D3E1F7" />
        <circle cx="160" cy="326" r="17" fill="#EFFAF3" stroke="#169447" strokeWidth="2.5" />
        <path d="M152 326 l6 6 l11 -12" fill="none" stroke="#169447" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* sleeves + hands */}
      <path d="M46 282 Q22 338 58 372 L84 356 Q68 330 82 296 Z" fill="#0648B5" />
      <path d="M216 282 Q240 338 204 372 L178 356 Q194 330 180 296 Z" fill="#0648B5" />
      <ellipse cx="78" cy="358" rx="15" ry="12" fill="#E8B48A" />
      <ellipse cx="186" cy="358" rx="15" ry="12" fill="#E8B48A" />
    </svg>
  );
}
