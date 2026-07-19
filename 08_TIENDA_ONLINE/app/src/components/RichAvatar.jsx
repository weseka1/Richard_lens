import React from 'react';

/* EL PERSONAJE RICH — avatar PFP de la marca modelando los Wayfarer.
 * Vector puro: corona torcida, lentes puestos (nunca se ven los ojos), sonrisa
 * con diente de oro, cadena con medallón $. Flat + outline grueso = gramática NFT. */

const OUT = '#111013';

export default function RichAvatar() {
  return (
    <svg viewBox="0 0 520 560" fill="none" role="img" aria-label="RICH, el personaje de Richard Lens, con los lentes puestos">
      {/* hoodie */}
      <path d="M62 560 C70 470 120 408 175 390 L345 390 C400 408 450 470 458 560 Z" fill="#1B1B22" stroke={OUT} strokeWidth="7" />
      <path d="M150 415 C180 380 340 380 370 415 C330 400 190 400 150 415 Z" fill="#26262E" stroke={OUT} strokeWidth="5" />
      {/* cordones del hoodie */}
      <path d="M228 428 L224 490" stroke="#FF3E8A" strokeWidth="9" strokeLinecap="round" />
      <path d="M292 428 L296 490" stroke="#FF3E8A" strokeWidth="9" strokeLinecap="round" />
      <circle cx="224" cy="496" r="8" fill="#FF3E8A" stroke={OUT} strokeWidth="4" />
      <circle cx="296" cy="496" r="8" fill="#FF3E8A" stroke={OUT} strokeWidth="4" />
      {/* cuello */}
      <rect x="222" y="322" width="76" height="82" rx="26" fill="#E8A15C" stroke={OUT} strokeWidth="7" />
      {/* orejas */}
      <ellipse cx="141" cy="252" rx="20" ry="28" fill="#E8A15C" stroke={OUT} strokeWidth="7" />
      <ellipse cx="379" cy="252" rx="20" ry="28" fill="#E8A15C" stroke={OUT} strokeWidth="7" />
      {/* aro de oro */}
      <circle cx="138" cy="288" r="13" stroke="#FFD52E" strokeWidth="7" fill="none" />
      {/* cabeza */}
      <ellipse cx="260" cy="232" rx="120" ry="130" fill="#E8A15C" stroke={OUT} strokeWidth="7" />
      {/* pelo */}
      <path d="M148 178 C150 120 200 88 260 88 C320 88 370 120 372 178 C340 158 320 166 300 152 C270 172 250 150 224 164 C200 150 170 168 148 178 Z" fill="#17141A" stroke={OUT} strokeWidth="6" />
      {/* corona torcida */}
      <g transform="rotate(-12 300 78)">
        <path d="M212 96 L228 42 L268 84 L300 26 L332 84 L372 42 L388 96 L380 128 L220 128 Z" fill="#FFD52E" stroke={OUT} strokeWidth="7" strokeLinejoin="round" />
        <circle cx="228" cy="38" r="10" fill="#FFD52E" stroke={OUT} strokeWidth="6" />
        <circle cx="300" cy="22" r="10" fill="#FFD52E" stroke={OUT} strokeWidth="6" />
        <circle cx="372" cy="38" r="10" fill="#FFD52E" stroke={OUT} strokeWidth="6" />
        <circle cx="252" cy="112" r="8" fill="#FF3E8A" stroke={OUT} strokeWidth="4" />
        <circle cx="300" cy="112" r="8" fill="#29D9F5" stroke={OUT} strokeWidth="4" />
        <circle cx="348" cy="112" r="8" fill="#9BE22E" stroke={OUT} strokeWidth="4" />
      </g>
      {/* cejas levantadas (canchero) */}
      <path d="M172 196 Q 202 180 232 192" stroke="#17141A" strokeWidth="11" strokeLinecap="round" fill="none" />
      <path d="M288 192 Q 318 180 348 196" stroke="#17141A" strokeWidth="11" strokeLinecap="round" fill="none" />
      {/* LOS LENTES (el producto): wayfarer negro, nunca se ven los ojos */}
      <g transform="rotate(-2 260 252)">
        <path d="M132 232 L155 226 M388 232 L365 226" stroke={OUT} strokeWidth="10" strokeLinecap="round" />
        <rect x="152" y="214" width="100" height="76" rx="16" fill="#17161B" stroke={OUT} strokeWidth="7" />
        <rect x="268" y="214" width="100" height="76" rx="16" fill="#17161B" stroke={OUT} strokeWidth="7" />
        <rect x="248" y="234" width="24" height="14" rx="6" fill="#17161B" stroke={OUT} strokeWidth="5" />
        <rect x="164" y="226" width="76" height="52" rx="10" fill="#2C3A2E" />
        <rect x="280" y="226" width="76" height="52" rx="10" fill="#2C3A2E" />
        {/* brillo en los cristales */}
        <path d="M180 268 L212 234 M196 272 L228 238" stroke="#FAF7F2" strokeWidth="6" strokeLinecap="round" opacity=".65" />
        <path d="M296 268 L328 234 M312 272 L344 238" stroke="#FAF7F2" strokeWidth="6" strokeLinecap="round" opacity=".65" />
      </g>
      {/* nariz */}
      <path d="M256 292 Q 270 304 254 310" stroke={OUT} strokeWidth="6" strokeLinecap="round" fill="none" />
      {/* tatuaje $ en el pómulo */}
      <text x="352" y="312" fontFamily="'Titan One', sans-serif" fontSize="24" fill={OUT} opacity=".45" transform="rotate(8 352 312)">$</text>
      {/* sonrisa abierta con diente de oro */}
      <path d="M204 326 Q 260 386 316 326 Q 288 342 260 342 Q 232 342 204 326 Z" fill="#5B2B26" stroke={OUT} strokeWidth="6" strokeLinejoin="round" />
      <path d="M204 326 Q 260 348 316 326 L 310 338 Q 260 356 210 338 Z" fill="#FAF7F2" stroke={OUT} strokeWidth="4" strokeLinejoin="round" />
      <rect x="266" y="327" width="20" height="16" rx="4" fill="#FFD52E" stroke={OUT} strokeWidth="4" />
      {/* cadena con medallón $ */}
      {[
        [152, 468], [178, 490], [208, 506], [242, 515], [278, 515], [312, 506], [342, 490], [368, 468]
      ].map(([x, y]) => <circle key={x} cx={x} cy={y} r="12" fill="#FFD52E" stroke={OUT} strokeWidth="5" />)}
      <circle cx="260" cy="540" r="36" fill="#FFD52E" stroke={OUT} strokeWidth="7" />
      <text x="260" y="556" textAnchor="middle" fontFamily="'Titan One', sans-serif" fontSize="44" fill={OUT}>$</text>
    </svg>
  );
}
