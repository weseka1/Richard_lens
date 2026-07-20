import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { plata, getFotos } from '../lib/api.js';
import RichAvatar from './RichAvatar.jsx';

/* Lado derecho del hero: el modelo en B&N + panel de vidrio flotante con el drop
 * (glassmorphism estilo editorial — la referencia de los mockups de Spotify). */
export default function HeroCollage({ drop, cfg }) {
  const [hayFoto, setHayFoto] = useState(true);
  const [fotoDrop, setFotoDrop] = useState(null);
  const glassRef = useRef(null);

  useEffect(() => {
    if (drop) getFotos(drop.foto_codigo).then(fs => setFotoDrop(fs[0] || null));
  }, [drop?.id]);

  /* parallax sutil del panel de vidrio (solo mouse, el modelo queda clavado) */
  useEffect(() => {
    if (matchMedia('(pointer: coarse)').matches) return;
    const el = glassRef.current;
    if (!el) return;
    const move = e => {
      const x = (e.clientX / innerWidth - 0.5) * 2;
      const y = (e.clientY / innerHeight - 0.5) * 2;
      el.style.transform = `translate(${x * -8}px, ${y * -6}px)`;
    };
    addEventListener('mousemove', move, { passive: true });
    return () => removeEventListener('mousemove', move);
  }, []);

  return (
    <div className="hero-avatar">
      {hayFoto ? (
        <img src="/img/rich-hero.png" alt="El modelo RICH con los lentes puestos" className="hero-modelo" onError={() => setHayFoto(false)} />
      ) : (
        <RichAvatar />
      )}

      {drop && (
        <Link to={`/producto/${drop.id}`} className="glass-widget" ref={glassRef}>
          <span className="glass-kicker">Drop en stock</span>
          {fotoDrop && <img src={fotoDrop} alt={drop.modelo} className="glass-foto" />}
          <span className="glass-nombre">{drop.marca} {drop.modelo}</span>
          {drop.precio_web > 0 && cfg && (
            <span className="glass-precio">{plata(drop.precio_web)} <i>· {cfg.cuotas} cuotas</i></span>
          )}
          <span className="glass-barra"><i style={{ width: '68%' }} /></span>
          <span className="glass-cta">Ver el drop →</span>
        </Link>
      )}
    </div>
  );
}
