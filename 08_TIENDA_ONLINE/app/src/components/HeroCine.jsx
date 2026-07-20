import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { plata, getFotos } from '../lib/api.js';
import { BotonWA } from './TiendaLayout.jsx';

/* El hero. Dos modos:
 * 1) CINE: si existe app/public/img/hero.mp4 (video real bajado de la ref) → panel oscuro
 *    full-bleed con el video de fondo y el copy centrado.
 * 2) PORCELANA: fallback — el aviador recortado flotando estilo Apple.
 * El widget de vidrio con el drop vive en los dos modos. */

function GlassWidget({ drop, cfg }) {
  const [foto, setFoto] = useState(null);
  const ref = useRef(null);
  useEffect(() => { if (drop) getFotos(drop.foto_codigo).then(fs => setFoto(fs[0] || null)); }, [drop?.id]);
  useEffect(() => {
    if (matchMedia('(pointer: coarse)').matches) return;
    const el = ref.current;
    if (!el) return;
    const move = e => {
      const x = (e.clientX / innerWidth - 0.5) * 2, y = (e.clientY / innerHeight - 0.5) * 2;
      el.style.transform = `translate(${x * -8}px, ${y * -6}px)`;
    };
    addEventListener('mousemove', move, { passive: true });
    return () => removeEventListener('mousemove', move);
  }, []);
  if (!drop) return null;
  return (
    <Link to={`/producto/${drop.id}`} className="glass-widget" ref={ref}>
      <span className="glass-kicker">Drop en stock</span>
      {foto && <img src={foto} alt={drop.modelo} className="glass-foto" />}
      <span className="glass-nombre">{drop.marca} {drop.modelo}</span>
      {drop.precio_web > 0 && cfg && <span className="glass-precio">{plata(drop.precio_web)} <i>· {cfg.cuotas} cuotas</i></span>}
      <span className="glass-barra"><i style={{ width: '68%' }} /></span>
      <span className="glass-cta">Ver el drop →</span>
    </Link>
  );
}

export default function HeroCine({ drop, cfg }) {
  const [hayVideo, setHayVideo] = useState(true);

  if (hayVideo) return (
    <section className="hero">
      <div className="wrap">
        <div className="hero-cine">
          <video
            src="/img/hero.mp4"
            autoPlay muted loop playsInline
            onError={() => setHayVideo(false)}
          />
          <div className="hero-cine-velo" />
          <div className="hero-cine-contenido">
            <p className="hero-kicker" style={{ color: 'rgba(255,255,255,.65)' }}>Richard Lens &amp; Co. — Est. Argentina</p>
            <h1>
              <span className="l1" style={{ color: '#fff' }}>Eyewear</span>
              <span className="l2" style={{ color: '#fff' }}>House.</span>
            </h1>
            <p className="hero-sub" style={{ color: 'rgba(255,255,255,.72)', margin: '22px auto 32px' }}>
              Ray-Ban, Dior, Prada, Louis Vuitton, Cartier. 100% originales, garantía doble, envíos a todo el país.
            </p>
            <div className="hero-ctas" style={{ justifyContent: 'center' }}>
              <Link to="/catalogo" className="btn-brush" style={{ background: '#fff', color: '#1D1D1F' }}>Ver la colección</Link>
              <BotonWA cfg={cfg} className="btn-pill" texto="Hola, quiero ver modelos y precios."
                style={{ borderColor: 'rgba(255,255,255,.4)', color: '#fff' }}>WhatsApp</BotonWA>
            </div>
          </div>
          <GlassWidget drop={drop} cfg={cfg} />
        </div>
      </div>
    </section>
  );

  return (
    <section className="hero">
      <div className="wrap">
        <div className="hero-panel">
          <div>
            <p className="hero-kicker">Richard Lens &amp; Co. — Est. Argentina</p>
            <h1>
              <span className="l1">Eyewear</span>
              <span className="l2">House.</span>
            </h1>
            <p className="hero-sub">Ray-Ban, Dior, Prada, Louis Vuitton, Cartier. 100% originales con garantía doble, entrega inmediata y envíos a todo el país.</p>
            <div className="hero-ctas">
              <Link to="/catalogo" className="btn-brush">Ver la colección</Link>
              <BotonWA cfg={cfg} className="btn-pill" texto="Hola, quiero ver modelos y precios.">WhatsApp</BotonWA>
            </div>
          </div>
          <div className="hero-avatar">
            <img src="/img/hero-editorial.jpg" alt="Modelo con Ray-Ban — Richard Lens" className="hero-foto-editorial" />
            <GlassWidget drop={drop} cfg={cfg} />
          </div>
        </div>
      </div>
    </section>
  );
}
