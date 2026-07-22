/* Revisa que el volumen de publicaciones sea sano.
 *
 * Tener muchas publicaciones del mismo modelo a precios distintos es la
 * estrategia, no un problema. Los problemas son otros dos:
 *   1. que alguna quede por debajo del costo y vender sea perder plata
 *   2. que haya títulos IDÉNTICOS, que es lo único que MELI penaliza de esto
 *
 * Uso: node auditar_meli.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const { cruzar } = createRequire(import.meta.url)('../08_TIENDA_ONLINE/fichaMeli.js');

const BASE = process.env.RL_URL || 'http://localhost:5250';
const DOLAR = 1545;
const COMISION = { gold_special: 0.155, gold_pro: 0.28 };
const IVA = 0.21, IIBB = 0.035, ENVIO = 7000;

async function traer(url, intentos = 3) {
  for (let i = 1; i <= intentos; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(900000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) {
      if (i === intentos) throw e;
      await new Promise(ok => setTimeout(ok, 5000));
    }
  }
}

const costoUsd = p => p.canal === 'WEB' ? 110 : /ferrari|polariz/i.test(`${p.modelo} ${p.cristal || ''}`) ? 61 : 58;

const productos = await traer(`${BASE}/api/productos`);
const datos = await traer(`${BASE}/api/meli/mis-items`);
const activos = (datos.items || []).filter(i => i.estado === 'active');
console.log(`\n${activos.length} publicaciones activas\n`);

/* --- 1. rentabilidad --- */
const enRojo = [];
for (const it of activos) {
  const p = cruzar(it.titulo, productos);
  if (!p) continue;
  const costo = costoUsd(p) * DOLAR;
  const comision = it.precio * (COMISION[it.listing] ?? 0.155);
  const neto = it.precio - comision - it.precio * IVA - it.precio * IIBB - ENVIO - costo;
  if (neto <= 0) enRojo.push({ it, costo, neto });
}
enRojo.sort((a, b) => a.neto - b.neto);

if (!enRojo.length) console.log('RENTABILIDAD: ninguna publicación pierde plata.\n');
else {
  console.log(`RENTABILIDAD: ${enRojo.length} publicaciones venden a pérdida.\n`);
  console.log('  PRECIO        COSTO      NETO   TÍTULO');
  for (const { it, costo, neto } of enRojo.slice(0, 25)) {
    console.log(`  $${String(it.precio).padStart(8)}  $${String(Math.round(costo)).padStart(8)}  $${String(Math.round(neto)).padStart(8)}  ${it.titulo}`);
  }
}

/* --- 2. títulos repetidos --- */
const porTitulo = new Map();
for (const it of activos) {
  const clave = it.titulo.toLowerCase().trim();
  if (!porTitulo.has(clave)) porTitulo.set(clave, []);
  porTitulo.get(clave).push(it);
}
const repetidos = [...porTitulo.entries()].filter(([, v]) => v.length > 1).sort((a, b) => b[1].length - a[1].length);

console.log(`\nTÍTULOS IDÉNTICOS: ${repetidos.length} títulos se repiten (${repetidos.reduce((s, [, v]) => s + v.length - 1, 0)} publicaciones de más).\n`);
for (const [titulo, items] of repetidos.slice(0, 20)) {
  const precios = [...new Set(items.map(i => i.precio))];
  console.log(`  ${items.length}×  ${titulo}`);
  console.log(`       precios: ${precios.map(p => '$' + p).join(' · ')}`);
}
if (repetidos.length) {
  console.log('\nDos publicaciones con el MISMO título compiten entre ellas y MELI las castiga.');
  console.log('Con precio distinto alcanza con cambiarles el gancho del final para separarlas.\n');
}

/* --- 3. títulos que prometen algo que la ficha desmiente ---
 * El escalón "Uv400 Polarizados" se aplicó a todo por igual, pero la ficha
 * declara WITH_POLARIZED_LENS producto por producto. Si el título promete
 * polarizado y la gafa no lo es, el comprador abre reclamo y con razón. */
const mentirosas = [];
for (const it of activos) {
  if (!/polariz/i.test(it.titulo)) continue;
  const p = cruzar(it.titulo, productos);
  if (!p) continue;
  if (!/polariz/i.test(`${p.modelo} ${p.cristal || ''}`)) mentirosas.push(it);
}
console.log(`\nTÍTULOS QUE PROMETEN POLARIZADO SIN SERLO: ${mentirosas.length}`);
if (mentirosas.length) {
  for (const it of mentirosas.slice(0, 8)) console.log(`  ${it.titulo}`);
  console.log('  El comprador que lo pida va a abrir reclamo, y va a tener razón.\n');
}

/* --- 4. reparto por marca y por precio --- */
const marcas = {};
for (const it of activos) {
  const m = it.titulo.replace(/^(Anteojos|Lentes|Gafas) De Sol /i, '').split(' ')[0];
  marcas[m] = (marcas[m] || 0) + 1;
}
console.log('REPARTO POR MARCA:');
for (const [m, n] of Object.entries(marcas).sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${String(n).padStart(5)}  ${m}`);
}

fs.writeFileSync(path.join(import.meta.dirname, 'AUDITORIA_MELI.json'),
  JSON.stringify({ activos: activos.length, enRojo: enRojo.map(x => ({ id: x.it.id, titulo: x.it.titulo, precio: x.it.precio, neto: Math.round(x.neto) })), repetidos: repetidos.map(([t, v]) => ({ titulo: t, veces: v.length, ids: v.map(i => i.id) })) }, null, 1), 'utf8');
console.log('\nDetalle completo en 07_CATALOGO/AUDITORIA_MELI.json');
