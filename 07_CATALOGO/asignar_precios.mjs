// Aplica las reglas de precios (reglas_precios.mjs) a TODOS los productos de la tienda.
// Uso: node asignar_precios.mjs           → pisa todos los precios con las reglas
//      node asignar_precios.mjs --solo-vacios  → solo completa los que están en 0
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { precioPara } from './reglas_precios.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PRODUCTOS = resolve(HERE, '..', '08_TIENDA_ONLINE', 'data', 'productos.json');
const soloVacios = process.argv.includes('--solo-vacios');

const productos = JSON.parse(readFileSync(PRODUCTOS, 'utf8'));
let tocados = 0;
for (const p of productos) {
  if (soloVacios && p.precio_web > 0) continue;
  const { web, ml } = precioPara(p.marca, p.modelo, p.forma);
  p.precio_web = web;
  p.precio_ml = p.canal === 'WEB' ? 0 : ml;
  tocados++;
}
writeFileSync(PRODUCTOS, JSON.stringify(productos, null, 2), 'utf8');

const rango = productos.filter(p => p.precio_web > 0).map(p => p.precio_web);
console.log(`Precios asignados a ${tocados}/${productos.length} productos.`);
console.log(`Rango: $${Math.min(...rango).toLocaleString('es-AR')} – $${Math.max(...rango).toLocaleString('es-AR')}`);
const porNivel = {};
for (const p of productos) { if (p.precio_web) porNivel[p.precio_web] = (porNivel[p.precio_web] || 0) + 1; }
for (const [precio, n] of Object.entries(porNivel).sort((a, b) => a[0] - b[0]))
  console.log(`  $${Number(precio).toLocaleString('es-AR')} → ${n} modelos`);
