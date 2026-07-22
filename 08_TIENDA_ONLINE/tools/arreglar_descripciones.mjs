/* Corrige las descripciones que dicen la marca equivocada.
 *
 * El generador de descripciones tenía "Ray-Ban" fijo, así que 118 productos
 * de otras marcas quedaron con "Ray-Ban Dior 30Montaigne", "Ray-Ban Gucci..."
 * Para un cliente que está por gastar medio palo en un Dior, leer eso es la
 * señal de que el negocio es trucho. No hay peor cartel en una tienda de lujo.
 *
 * Uso: node arreglar_descripciones.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = path.join(import.meta.dirname, '..');
const ARCHIVO = path.join(RAIZ, 'data', 'productos.json');
const BASE = process.env.RL_URL || 'http://localhost:5250';
const dry = process.argv.includes('--dry');

const productos = JSON.parse(fs.readFileSync(ARCHIVO, 'utf8'));
const marcaDe = p => String(p.marca || '').split(' · ')[0].trim();

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function armar(p) {
  const marca = marcaDe(p);
  let modelo = String(p.modelo || '').trim();
  // "Amore Fashion" + modelo "Amore Fashion 4390" daba el nombre dos veces
  if (norm(modelo).startsWith(norm(marca))) modelo = modelo.slice(marca.length).trim();

  const colores = new Set((p.variantes || []).map(v => v.color).filter(Boolean)).size;
  const cuantos = colores > 1 ? `${colores} combinaciones de color` : 'Color único';
  return `${[marca, modelo].filter(Boolean).join(' ')}. ${cuantos}, 100% original con garantía doble.`;
}

let tocados = 0;
for (const p of productos) {
  const marca = marcaDe(p);
  const desc = p.descripcion || '';
  if (!/ray.?ban/i.test(desc) || /ray.?ban/i.test(marca)) continue;

  const nueva = armar(p);
  if (nueva === desc) continue;
  if (!dry) p.descripcion = nueva;
  if (tocados < 5) console.log(`  ${marca}\n     antes: ${desc}\n     ahora: ${nueva}`);
  tocados++;
}

console.log(`\n${tocados} descripciones corregidas${dry ? ' (SIMULACIÓN)' : ''}.`);
if (dry || !tocados) process.exit(0);

fs.writeFileSync(ARCHIVO, JSON.stringify(productos, null, 2), 'utf8');
console.log('productos.json actualizado.');

/* El archivo es un espejo: la fuente de verdad es Supabase, y si no se sube
 * la corrección se pierde en la próxima sincronización. */
try {
  const r = await fetch(`${BASE}/api/push-nube`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  const j = await r.json();
  console.log(j.error ? `⚠ no subió a Supabase: ${j.error}` : 'Subido a Supabase.');
} catch (e) {
  console.log(`⚠ no subió a Supabase (${e.message}). Levantá el server y corré: curl -X POST ${BASE}/api/push-nube`);
}
