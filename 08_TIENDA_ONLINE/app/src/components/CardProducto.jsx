import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { plata, getFotos } from '../lib/api.js';

export const MONOS = {
  'Ray-Ban': 'RB', 'Oakley': 'O', 'Prada': 'P', 'Gucci': 'GG', 'Dolce & Gabbana': 'D&G',
  'Louis Vuitton': 'LV', 'Balenciaga': 'BB', 'Fendi': 'FF', 'Versace': 'V', 'RICH': 'R$'
};

/* cada producto tiene SU color pleno (estable por id) — la gramática PFP */
const POP = ['#1F8A4C', '#E23B2E', '#2A6FE8', '#F25CA2', '#F07F13', '#7C4DE0', '#D4AF37'];
export function popColor(id) {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) % 997;
  return POP[h % POP.length];
}

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
      {nota && <span style={{ fontSize: '.7rem', opacity: .65, marginTop: 10, fontWeight: 600 }}>{nota}</span>}
    </div>
  );
}

export default function CardProducto({ p, i = 0, cfg }) {
  const [foto, setFoto] = useState(null);
  useEffect(() => { getFotos(p.foto_codigo).then(fs => setFoto(fs[0] || null)); }, [p.foto_codigo]);

  return (
    <Link
      className="card"
      to={`/producto/${p.id}`}
      style={{ transitionDelay: `${(i % 4) * 60}ms`, '--pop': popColor(p.id) }}
    >
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
