import React from 'react';

/* Doodles new-rich dibujándose en loop detrás de toda la web.
 * mix-blend-mode difference: se ven NEGROS sobre el fondo porcelana y BLANCOS
 * sobre las secciones oscuras — un solo sistema, dos mundos.
 * Iconografía propia: $, corona, diamante, gafas, billete alado y el caballero
 * de galera y monóculo (arquetipo genérico — nada de IP ajena). */

const DOODLES = [
  // [x%, y%, escala, rotación, delay, path]
  ['4%', '12%', 1.1, -12, 0, 'M30 10 C10 12 8 30 26 34 C44 38 46 56 24 58 M28 2 L28 66'],                    // $
  ['88%', '8%', 1.3, 8, 2, 'M6 40 L14 12 L26 30 L38 6 L50 30 L62 12 L70 40 L64 54 L12 54 Z'],                 // corona
  ['92%', '55%', 0.9, -6, 4, 'M10 22 L30 6 L50 22 L30 58 Z M10 22 L50 22 M20 22 L30 58 M40 22 L30 58'],       // diamante
  ['3%', '62%', 1.2, 6, 1, 'M6 20 A14 14 0 1 0 34 20 A14 14 0 1 0 6 20 M42 20 A14 14 0 1 0 70 20 A14 14 0 1 0 42 20 M34 18 L42 18'], // gafas
  ['48%', '4%', 0.8, -4, 3, 'M20 24 L56 24 L56 44 L20 44 Z M38 28 A6 8 0 1 0 38 42 M20 30 C8 22 4 34 16 38 M56 30 C68 22 72 34 60 38'], // billete alado
  ['80%', '86%', 1.15, 5, 5, 'M14 34 L58 34 M20 34 L20 16 L52 16 L52 34 M14 16 L58 16 M56 44 A8 8 0 1 0 72 44 A8 8 0 1 0 56 44 M64 52 L64 62 M28 48 C34 54 40 54 46 48'], // galera + monóculo + sonrisa
  ['12%', '88%', 0.85, -8, 6, 'M30 10 C10 12 8 30 26 34 C44 38 46 56 24 58 M28 2 L28 66'],                    // $ chico
  ['62%', '70%', 0.7, 10, 7, 'M6 40 L14 12 L26 30 L38 6 L50 30 L62 12 L70 40 L64 54 L12 54 Z']                // corona chica
];

export default function FondoDoodles() {
  return (
    <div className="fondo-doodles" aria-hidden="true">
      {DOODLES.map(([x, y, esc, rot, delay, d], i) => (
        <svg key={i} viewBox="0 0 76 70" style={{ left: x, top: y, width: 76 * esc, transform: `rotate(${rot}deg)` }}>
          <path d={d} className="doodle-trazo" style={{ animationDelay: delay + 's' }} />
        </svg>
      ))}
    </div>
  );
}
