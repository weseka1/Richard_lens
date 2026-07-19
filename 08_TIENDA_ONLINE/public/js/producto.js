/* producto.js — ficha: galería, specs, precio/cuotas o consultar, CTA WhatsApp con mensaje armado */
import { cargarConfig, cargarProductos, montarHeader, montarFooter, montarFabs, conectarWA, activarReveals, plata, track } from './base.js';
import { activarTilt } from './efectos3d.js';
import { montarChat } from './chat.js';
import { cardProducto, badge } from './card.js';

const MONOS = { 'Ray-Ban': 'RB', 'Oakley': 'O', 'Prada': 'P', 'Gucci': 'GG', 'Dolce & Gabbana': 'D&G', 'Louis Vuitton': 'LV', 'Balenciaga': 'BB', 'Fendi': 'FF', 'Versace': 'V', 'RICH': 'R$' };

(async () => {
  montarHeader('catalogo');
  const cfg = await cargarConfig();
  const productos = await cargarProductos();
  const id = new URLSearchParams(location.search).get('id');
  const p = productos.find(x => x.id === id);

  if (!p) { location.href = '/catalogo'; return; }
  document.title = `${p.marca} ${p.modelo} — RICHARD LENS`;

  // galería
  let fotos = [];
  try { fotos = await (await fetch('/api/fotos/' + p.foto_codigo)).json(); } catch {}
  const principal = document.getElementById('foto-principal');
  const thumbs = document.getElementById('thumbs');
  if (fotos.length) {
    principal.innerHTML = `<img src="${fotos[0]}" alt="${p.marca} ${p.modelo}">`;
    thumbs.innerHTML = fotos.map((f, i) => `<img src="${f}" data-i="${i}" class="${i === 0 ? 'activa' : ''}" alt="vista ${i + 1}">`).join('');
    thumbs.querySelectorAll('img').forEach(t => t.addEventListener('click', () => {
      principal.querySelector('img').src = t.src;
      thumbs.querySelectorAll('img').forEach(x => x.classList.remove('activa'));
      t.classList.add('activa');
    }));
  } else {
    principal.innerHTML = `<div class="tile-marca"><span class="mono">${MONOS[p.marca] || p.marca[0]}</span><span class="marca-nombre">${p.marca}</span><span style="font-size:.7rem;color:var(--hueso-35);margin-top:10px">Fotos reales por WhatsApp — pedilas</span></div>`;
  }

  // info
  const msgWA = `Hola, me interesa el ${p.marca} ${p.modelo} (${p.codigo}). ¿Precio y stock?`;
  const precioHTML = p.precio_web > 0 ? `
    <div class="prod-precio-box">
      <div class="prod-precio">${plata(p.precio_web)}</div>
      <div class="prod-cuotas">${cfg.cuotas} cuotas de ${plata(Math.round(p.precio_web / cfg.cuotas))}</div>
      <div class="prod-transfer">${cfg.descuento_transferencia}% off por transferencia: ${plata(Math.round(p.precio_web * (1 - cfg.descuento_transferencia / 100)))}</div>
    </div>` : `
    <div class="prod-precio-box">
      <div class="prod-precio" style="font-size:1.4rem">Precio por WhatsApp</div>
      <div class="prod-cuotas">Precio real del día en minutos, con cuotas y descuento por transferencia. Sin números viejos.</div>
    </div>`;

  document.getElementById('info').innerHTML = `
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:12px">${badge(p).replace('class="card-badge', 'style="position:static" class="card-badge')}<span class="card-num" style="position:static">${p.codigo}</span></div>
    <p class="prod-marca">${p.marca}</p>
    <h1 class="prod-titulo">${p.modelo}</h1>
    <p class="prod-desc">${p.descripcion}</p>
    <div class="prod-specs">
      <div class="spec"><small>Color</small><span>${p.color}</span></div>
      <div class="spec"><small>Cristal</small><span>${p.cristal}</span></div>
      <div class="spec"><small>Forma</small><span>${p.forma}</span></div>
      <div class="spec"><small>Material</small><span>${p.material}</span></div>
      <div class="spec"><small>Autenticidad</small><span>Grabados + estuche + factura</span></div>
      <div class="spec"><small>Envío</small><span>24-48 h, asegurado, todo el país</span></div>
    </div>
    ${precioHTML}
    <div class="hero-ctas">
      <a href="#" class="btn btn-oro" data-wa data-wa-texto="${msgWA.replace(/"/g, '&quot;')}">${p.estado === 'a_pedido' ? 'Encargar este par' : 'Quiero este par'}</a>
      <a href="/catalogo" class="btn btn-linea">Ver más modelos</a>
    </div>`;

  // relacionados: misma marca primero, después mismo estado
  const rel = productos.filter(x => x.id !== p.id)
    .sort((a, b) => (b.marca === p.marca) - (a.marca === p.marca)).slice(0, 4);
  document.getElementById('relacionados').innerHTML =
    (await Promise.all(rel.map((x, i) => cardProducto(x, i, cfg)))).join('');

  montarFooter(cfg);
  const fabs = montarFabs(cfg);
  conectarWA(cfg);
  const chat = montarChat(cfg);
  fabs.querySelector('.fab-rich').addEventListener('click', chat.abrir);
  activarReveals();
  activarTilt();
  track('visita_producto', p.id);
})();
