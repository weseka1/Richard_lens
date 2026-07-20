import React, { useEffect, useState } from 'react';

/* El alma streetwear de la maison: al entrar, un tag "RICHARD LENS" rosa se dibuja
 * en vivo (trazo de marcador estilo Alec) y se desvanece revelando la tienda fina.
 * Corre una vez por sesión. */
export default function IntroGraffiti() {
  const [fase, setFase] = useState(() => sessionStorage.getItem('intro_vista') ? 'fuera' : 'dibujando');

  useEffect(() => {
    if (fase !== 'dibujando') return;
    sessionStorage.setItem('intro_vista', '1');
    const t1 = setTimeout(() => setFase('saliendo'), 2100);
    const t2 = setTimeout(() => setFase('fuera'), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [fase]);

  if (fase === 'fuera') return null;

  return (
    <div className={'intro-graffiti' + (fase === 'saliendo' ? ' saliendo' : '')}>
      <svg viewBox="0 0 900 220" className="intro-tag">
        <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" className="intro-texto intro-trazo">
          RICHARD LENS
        </text>
        <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" className="intro-texto intro-relleno">
          RICHARD LENS
        </text>
      </svg>
      <span className="intro-sub">EYEWEAR HOUSE</span>
    </div>
  );
}
