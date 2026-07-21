import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { plata, getFotos, track } from '../lib/api.js';
import { agregar, precioLista } from '../lib/carrito.js';

export const MONOS = {
  'Ray-Ban': 'RB', 'Oakley': 'O', 'Prada': 'P', 'Gucci': 'GG', 'Dolce & Gabbana': 'D&G',
  'Louis Vuitton': 'LV', 'Balenciaga': 'BB', 'Fendi': 'FF', 'Versace': 'V', 'RICH': 'R$',
  'Miu Miu': 'MM', 'Off-White': 'OW', 'Ray-Ban · Ferrari': 'RB·F', 'Oscar Wylee': 'OS'
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
  if (p.destacado && p.estado === 'disponible') return <span className="card-badge badge-stock" style={style}>Más vendido</span>;
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
  const [agregado, setAgregado] = useState(false);
  useEffect(() => { getFotos(p.foto_codigo).then(fs => setFoto(fs[0] || null)); }, [p.foto_codigo]);

  function alCarrito(e) {
    e.preventDefault();
    e.stopPropagation();
    const v = (p.variantes || []).find(x => x.stock === 'STOCK' || x.stock === 'POCO STOCK');
    agregar({
      id: p.id, marca: p.marca, modelo: p.modelo, precio: p.precio_web,
      sku: v?.sku, color: v?.color, codigo: v?.codigo, talle: v?.talle
    });
    track('carrito_agregar', `${p.marca} ${p.modelo}`);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1400);
  }

  const comprable = p.precio_web > 0 && p.estado === 'disponible';

  return (
    <Link
      className="card"
      to={`/producto/${p.id}`}
      style={{ transitionDelay: `${(i % 4) * 60}ms`, '--pop': popColor(p.id), '--cart': i % 2 ? 'var(--rosa)' : 'var(--cian)', '--cart-texto': i % 2 ? 'var(--blanco)' : 'var(--tinta)' }}
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
        {p.precio_web > 0 && cfg ? (
          <div className="card-precios">
            <span className="precio-lista">{plata(precioLista(p.precio_web))}</span>
            <span className="precio">{plata(p.precio_web)}</span>
            <div className="cuotas">{cfg.cuotas} cuotas de {plata(Math.round(p.precio_web / cfg.cuotas))}</div>
          </div>
        ) : (
          <div className="card-precios"><span className="precio-consultar">Precio por WhatsApp →</span></div>
        )}
        {p.estado === 'disponible' && p.stock > 0 && p.stock <= 3 && (
          <span className="urgencia">⚡ Últimas {p.stock} {p.stock === 1 ? 'unidad' : 'unidades'}</span>
        )}
        {p.estado === 'disponible' && p.stock > 3 && (
          <span className="entrega-ya">Entrega inmediata</span>
        )}
        {comprable && (
          <button className="btn-cart" onClick={alCarrito}>
            {agregado ? '✓ En el carrito' : 'Agregar al carrito'}
          </button>
        )}
      </div>
    </Link>
  );
}
