// Migra SOLO las variantes, con dedupe por SKU (algunos SKUs del proveedor se repiten entre modelos).
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const URL_BASE = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE;

const productos = JSON.parse(readFileSync(resolve(HERE, '..', '08_TIENDA_ONLINE', 'data', 'productos.json'), 'utf8'));
const mapa = new Map();
let repetidos = 0;
for (const p of productos) {
  for (const v of (p.variantes || [])) {
    const sku = String(v.sku).trim();
    if (mapa.has(sku)) { repetidos++; continue; }
    mapa.set(sku, { sku, producto_id: p.id, codigo: v.codigo, color: v.color, talle: v.talle, stock: v.stock });
  }
}
const filas = [...mapa.values()];
console.log(`Variantes únicas: ${filas.length} (SKUs repetidos salteados: ${repetidos})`);

for (let i = 0; i < filas.length; i += 500) {
  const lote = filas.slice(i, i + 500);
  const r = await fetch(`${URL_BASE}/rest/v1/rl_variantes`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(lote)
  });
  if (!r.ok) { console.error(`lote ${i}: ${r.status}`, await r.text()); process.exit(1); }
  console.log(`rl_variantes: ${Math.min(i + 500, filas.length)}/${filas.length}`);
}
console.log('VARIANTES MIGRADAS ✅');
