/* card.js — la card de producto estilo NFT (foto real si hay; si no, tile tipográfico de marca) */
import { plata } from './base.js';

const MONOS = {
  'Ray-Ban': 'RB', 'Oakley': 'O', 'Prada': 'P', 'Gucci': 'GG', 'Dolce & Gabbana': 'D&G',
  'Louis Vuitton': 'LV', 'Balenciaga': 'BB', 'Fendi': 'FF', 'Versace': 'V', 'RICH': 'R$'
};

const fotosCache = {};
export async function primeraFoto(codigo) {
  if (!(codigo in fotosCache)) {
    try { fotosCache[codigo] = await (await fetch('/api/fotos/' + codigo)).json(); }
    catch { fotosCache[codigo] = []; }
  }
  return fotosCache[codigo][0] || null;
}

export function badge(p) {
  if (p.estado === 'proximamente') return '<span class="card-badge badge-drop">Drop en camino</span>';
  if (p.estado === 'disponible' && p.stock > 0) return '<span class="card-badge badge-stock">Stock ya</span>';
  if (p.estado === 'disponible') return '<span class="card-badge badge-stock">Disponible</span>';
  return '<span class="card-badge badge-pedido">A pedido</span>';
}

export async function cardProducto(p, i, cfg) {
  const foto = await primeraFoto(p.foto_codigo);
  const visual = foto
    ? `<img src="${foto}" alt="${p.marca} ${p.modelo}" loading="lazy">`
    : `<div class="tile-marca"><span class="mono">${MONOS[p.marca] || p.marca[0]}</span><span class="marca-nombre">${p.marca}</span></div>`;
  const precio = p.precio_web > 0
    ? `<div><span class="precio">${plata(p.precio_web)}</span><div class="cuotas">${cfg.cuotas} cuotas de ${plata(Math.round(p.precio_web / cfg.cuotas))}</div></div>`
    : `<span class="precio-consultar">Precio por WhatsApp →</span>`;
  return `
  <a class="card" href="/producto?id=${p.id}" style="transition-delay:${(i % 4) * 70}ms">
    <span class="card-num">${p.codigo}</span>
    ${badge(p)}
    <div class="card-foto">${visual}</div>
    <div class="card-info">
      <div class="card-marca">${p.marca}</div>
      <div class="card-modelo">${p.modelo}</div>
      <div class="card-detalle">${p.color} · ${p.cristal}</div>
      <div class="card-precio">${precio}</div>
    </div>
  </a>`;
}
