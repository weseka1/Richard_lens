import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { plata, getFotos } from '../lib/api.js';

export const MONOS = {
  'Ray-Ban': 'RB', 'Oakley': 'O', 'Prada': 'P', 'Gucci': 'GG', 'Dolce & Gabbana': 'D&G',
  'Louis Vuitton': 'LV', 'Balenciaga': 'BB', 'Fendi': 'FF', 'Versace': 'V', 'RICH': 'R$'
};

export function Badge({ p, estatico }) {
  const style = estatico ? { position: 'static' } : undefined;
  if (p.estado === 'proximamente') return <span className="card-badge badge-drop" style={style}>Drop en camino</span>;
  if (p.estado === 'disponible' && p.stock > 0) return <span className="card-badge badge-stock" style={style}>Stock ya</span>;
  if (p.estado === 'disponible') return <span className="card-badge badge-stock" style={style}>Disponible</span>;
  return <span className="card-badge badge-pedido" style={style}>A pedido</span>;
}

export function TileMarca({ p, nota }) {
  return (
    <div className="tile-marca">
      <span className="mono">{MONOS[p.marca] || p.marca[0]}</span>
      <span className="marca-nombre">{p.marca}</span>
      {nota && <span style={{ fontSize: '.7rem', color: 'var(--hueso-35)', marginTop: 10 }}>{nota}</span>}
    </div>
  );
}

export default function CardProducto({ p, i = 0, cfg }) {
  const [foto, setFoto] = useState(null);
  const ref = useRef(null);

  useEffect(() => { getFotos(p.foto_codigo).then(fs => setFoto(fs[0] || null)); }, [p.foto_codigo]);

  /* tilt 3D suave (solo mouse) */
  useEffect(() => {
    if (matchMedia('(pointer: coarse)').matches) return;
    const card = ref.current;
    if (!card) return;
    const move = e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `translateY(-6px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
      card.style.transition = 'transform .1s';
    };
    const leave = () => { card.style.transform = ''; card.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1)'; };
    card.addEventListener('mousemove', move);
    card.addEventListener('mouseleave', leave);
    return () => { card.removeEventListener('mousemove', move); card.removeEventListener('mouseleave', leave); };
  }, []);

  return (
    <Link ref={ref} className="card" to={`/producto/${p.id}`} style={{ transitionDelay: `${(i % 4) * 70}ms` }}>
      <span className="card-num">{p.codigo}</span>
      <Badge p={p} />
      <div className="card-foto">
        {foto ? <img src={foto} alt={`${p.marca} ${p.modelo}`} loading="lazy" /> : <TileMarca p={p} />}
      </div>
      <div className="card-info">
        <div className="card-marca">{p.marca}</div>
        <div className="card-modelo">{p.modelo}</div>
        <div className="card-detalle">{p.color} · {p.cristal}</div>
        <div className="card-precio">
          {p.precio_web > 0 && cfg ? (
            <div>
              <span className="precio">{plata(p.precio_web)}</span>
              <div className="cuotas">{cfg.cuotas} cuotas de {plata(Math.round(p.precio_web / cfg.cuotas))}</div>
            </div>
          ) : (
            <span className="precio-consultar">Precio por WhatsApp →</span>
          )}
        </div>
      </div>
    </Link>
  );
}
