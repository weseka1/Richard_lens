import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { plata } from '../lib/api.js';
import { BotonWA } from './TiendaLayout.jsx';
import VideoAdaptativo from './VideoAdaptativo.jsx';

/* El hero maison: split editorial GRANDE — copy sobre porcelana a la izquierda,
 * la foto editorial (el negro) full-bleed a la derecha. Tilt 3D sutil tipo iPhone:
 * el panel entero se inclina 1-2 grados siguiendo el mouse, con perspectiva.
 * Si existe /img/hero.mp4 → modo cine con video de fondo. */

function useTilt() {
  const ref = useRef(null);
  useEffect(() => {
    if (matchMedia('(pointer: coarse)').matches) return;
    const el = ref.current;
    if (!el) return;
    let raf = null;
    const move = e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `perspective(1600px) rotateY(${x * 2.4}deg) rotateX(${y * -1.6}deg)`;
      });
    };
    const leave = () => {
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = 'perspective(1600px) rotateY(0deg) rotateX(0deg)';
    };
    el.addEventListener('mousemove', move);
    el.addEventListener('mouseleave', leave);
    return () => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave); };
  }, []);
  return ref;
}

export default function HeroCine({ drop, cfg }) {
  // el hero SIEMPRE es el video: si no puede reproducirse queda su propio
  // fotograma de portada, nunca una foto de otra sección
  const [videoRoto, setVideoRoto] = useState(false);
  const tiltRef = useTilt();

  const copy = (claro) => (
    <div className="hero-copy">
      <p className="hero-kicker" style={claro ? { color: 'rgba(255,255,255,.6)' } : undefined}>Richard Lens &amp; Co. — Est. Argentina</p>
      <h1>
        <span className="l1" style={claro ? { color: '#fff' } : undefined}>Eyewear</span>
        <span className="l2" style={claro ? { color: '#fff' } : undefined}>House.</span>
      </h1>
      <p className="hero-sub" style={claro ? { color: 'rgba(255,255,255,.72)' } : undefined}>
        Ray-Ban, Dior, Prada, Louis Vuitton, Cartier. 100% originales con garantía doble, envíos a todo el país.
      </p>
      <div className="hero-ctas">
        <Link to="/catalogo" className="btn-brush" style={claro ? { background: '#fff', color: '#1D1D1F' } : undefined}>Ver la colección</Link>
        <BotonWA cfg={cfg} className="btn-pill" texto="Hola, quiero ver modelos y precios."
          style={claro ? { borderColor: 'rgba(255,255,255,.4)', color: '#fff' } : undefined}>WhatsApp</BotonWA>
      </div>
      {drop && (
        <Link to={`/producto/${drop.id}`} className="hero-drop-linea" style={claro ? { color: 'rgba(255,255,255,.75)' } : undefined}>
          Drop en stock — {drop.marca} {drop.modelo}{drop.precio_web > 0 ? ` · ${plata(drop.precio_web)}` : ''} →
        </Link>
      )}
      {/* El probador de selfie queda fuera del lanzamiento: el encuadre todavía
          deforma la cara y era lo primero que ofrecía el hero. El componente
          sigue en components/Probador.jsx para retomarlo cuando esté fino. */}
    </div>
  );

  return (
    <section className="hero">
      <div className="wrap">
        <div className="hero-tilt" ref={tiltRef}>
          <div className="hero-cine">
            {videoRoto
              ? <img src="/img/hero-poster.jpg" alt="Richard Lens — Eyewear House" />
              : <VideoAdaptativo
                  src="/img/hero.mp4"
                  movil="/img/hero-movil.mp4"
                  poster="/img/hero-poster.jpg"
                  onError={() => setVideoRoto(true)}
                />}
            <div className="hero-cine-velo" />
            <div className="hero-cine-contenido">{copy(false)}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
