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
      {/* fondo: el escudo drip de la casa + lluvia de $ estilo Alec (flow propio, sin IP ajena) */}
      <img src="/img/logo-drip.png" alt="" className="intro-logo-fondo" aria-hidden="true" />
      <div className="intro-billetes" aria-hidden="true">
        {[['6%', '14%', '-14deg', '2.6rem'], ['88%', '10%', '10deg', '3.4rem'], ['12%', '78%', '8deg', '3rem'],
          ['82%', '74%', '-10deg', '2.4rem'], ['26%', '32%', '12deg', '1.8rem'], ['70%', '30%', '-8deg', '2rem']].map(([l, t, r, s], i) => (
          <span key={i} style={{ left: l, top: t, fontSize: s, transform: `rotate(${r})`, animationDelay: (0.3 + i * 0.18) + 's' }}>$</span>
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
