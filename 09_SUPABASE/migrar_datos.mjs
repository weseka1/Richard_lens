// Migra productos.json (506 productos + ~1.900 variantes) a Supabase vía REST.
// Uso:  $env:SUPABASE_URL = "https://xxxx.supabase.co"
//       $env:SUPABASE_SERVICE = "eyJ...service_role..."
//       node migrar_datos.mjs
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const URL_BASE = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE;
if (!URL_BASE || !KEY) { console.error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE'); process.exit(1); }

const productos = JSON.parse(readFileSync(resolve(HERE, '..', '08_TIENDA_ONLINE', 'data', 'productos.json'), 'utf8'));

async function upsert(tabla, filas) {
  for (let i = 0; i < filas.length; i += 500) {
    const lote = filas.slice(i, i + 500);
    const r = await fetch(`${URL_BASE}/rest/v1/${tabla}`, {
      method: 'POST',
      headers: {
        apikey: KEY, Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify(lote)
    });
    if (!r.ok) { console.error(`${tabla} lote ${i}: ${r.status}`, await r.text()); process.exit(1); }
    console.log(`${tabla}: ${Math.min(i + 500, filas.length)}/${filas.length}`);
  }
}

const filasProductos = [...new Map(productos.map(({ variantes, ...p }) => [p.id, p])).values()];
const filasVariantes = productos.flatMap(p => (p.variantes || []).map(v => ({
  sku: String(v.sku), producto_id: p.id, codigo: v.codigo, color: v.color, talle: v.talle, stock: v.stock
})));

console.log(`Migrando ${filasProductos.length} productos y ${filasVariantes.length} variantes…`);
await upsert('rl_productos', filasProductos);
await upsert('rl_variantes', filasVariantes);
console.log('MIGRACIÓN COMPLETA ✅');
