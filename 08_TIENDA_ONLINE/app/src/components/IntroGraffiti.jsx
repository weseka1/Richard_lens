import React, { useEffect, useState } from 'react';

/* Intro AEROSOL: el tag RICHARD LENS se pinta con spray — trazo gordo de borde
 * rugoso (turbulencia), niebla de overspray alrededor y chorreaduras al final.
 * Corre una vez por sesión y revela la maison. */
export default function IntroGraffiti() {
  const [fase, setFase] = useState(() => sessionStorage.getItem('intro_vista') ? 'fuera' : 'dibujando');

  useEffect(() => {
    if (fase !== 'dibujando') return;
    sessionStorage.setItem('intro_vista', '1');
    const t1 = setTimeout(() => setFase('saliendo'), 2600);
    const t2 = setTimeout(() => setFase('fuera'), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [fase]);

  if (fase === 'fuera') return null;

  return (
    <div className={'intro-graffiti' + (fase === 'saliendo' ? ' saliendo' : '')}>
      {/* fondo blanco fino: los doodles de línea negra se dibujan alrededor del tag
        * (elegancia inglesa en la línea, ostentosidad americana en el aerosol) */}
      <img src="/img/logo-drip.png" alt="" className="intro-logo-fondo" aria-hidden="true" />
      <div className="intro-doodles" aria-hidden="true">
        {[
          ['5%', '10%', 1.4, -10, 0.2, 'M14 34 L58 34 M20 34 L20 16 L52 16 L52 34 M14 16 L58 16 M56 44 A8 8 0 1 0 72 44 A8 8 0 1 0 56 44 M64 52 L64 62 M28 48 C34 54 40 54 46 48'],
          ['86%', '8%', 1.2, 8, 0.5, 'M6 40 L14 12 L26 30 L38 6 L50 30 L62 12 L70 40 L64 54 L12 54 Z'],
          ['8%', '72%', 1.1, 6, 0.8, 'M30 10 C10 12 8 30 26 34 C44 38 46 56 24 58 M28 2 L28 66'],
          ['88%', '68%', 1.0, -8, 1.1, 'M10 22 L30 6 L50 22 L30 58 Z M10 22 L50 22 M20 22 L30 58 M40 22 L30 58'],
          ['70%', '26%', 0.9, 12, 1.4, 'M20 24 L56 24 L56 44 L20 44 Z M38 28 A6 8 0 1 0 38 42 M20 30 C8 22 4 34 16 38 M56 30 C68 22 72 34 60 38'],
          ['22%', '28%', 0.8, -14, 1.7, 'M6 20 A14 14 0 1 0 34 20 A14 14 0 1 0 6 20 M42 20 A14 14 0 1 0 70 20 A14 14 0 1 0 42 20 M34 18 L42 18']
        ].map(([x, y, esc, rot, delay, d], i) => (
          <svg key={i} viewBox="0 0 76 70" style={{ left: x, top: y, width: 76 * esc, transform: `rotate(${rot}deg)` }}>
            <path d={d} className="intro-doodle-trazo" style={{ animationDelay: delay + 's' }} />
          </svg>
        ))}
      </div>
      <svg viewBox="0 0 900 260" className="intro-tag">
        <defs>
          {/* borde rugoso de spray */}
          <filter id="spray" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves="3" result="ruido" seed="7" />
            <feDisplacementMap in="SourceGraphic" in2="ruido" scale="9" />
          </filter>
          {/* niebla del overspray */}
          <filter id="niebla" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.3" numOctaves="2" result="ruido" seed="3" />
            <feDisplacementMap in="SourceGraphic" in2="ruido" scale="14" />
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        {/* capa 1: la niebla rosa que rodea el trazo (overspray) */}
        <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle"
          className="intro-texto capa-niebla" filter="url(#niebla)">RICHARD LENS</text>
        {/* capa 2: el trazo gordo del aerosol pintándose */}
        <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle"
          className="intro-texto capa-trazo" filter="url(#spray)">RICHARD LENS</text>
        {/* capa 3: el relleno pleno con borde spray */}
        <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle"
          className="intro-texto capa-relleno" filter="url(#spray)">RICHARD LENS</text>

        {/* chorreaduras */}
        {[[172, 148, 46], [305, 155, 68], [468, 150, 38], [610, 156, 82], [742, 148, 54]].map(([x, y, largo], i) => (
          <rect key={i} x={x} y={y} width="7" rx="3.5" height={largo} filter="url(#spray)"
            className="intro-drip" style={{ animationDelay: (1.7 + i * 0.12) + 's' }} />
        ))}
      </svg>
      <span className="intro-sub">EYEWEAR HOUSE</span>
    </div>
  );
}
