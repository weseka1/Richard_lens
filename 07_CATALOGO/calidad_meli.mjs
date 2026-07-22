/* Lleva las publicaciones a calidad máxima en MercadoLibre.
 *
 * MELI puntúa la ficha por cuántos atributos completás, y con ficha pobre te
 * muestra último aunque tengas el mejor precio. Arrancábamos con 17 de 77.
 *
 * Casi todo sale de datos que ya tenemos:
 *   "Standard (51-21)"     → ancho de lente 51 mm, puente 21 mm
 *   "Carey/marrón degradé" → armazón Carey, lente marrón, tratamiento Degradé
 *   "acetato/metal"        → material de armazón y varilla
 *
 * Uso: node calidad_meli.mjs [--dry] [--limite N]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
// mismo mapeo que usa el publicador, para que no se separen con el tiempo
const { ficha, cruzar } = createRequire(import.meta.url)('../08_TIENDA_ONLINE/fichaMeli.js');

const BASE = process.env.RL_URL || 'http://localhost:5250';
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const limite = args.includes('--limite') ? Number(args[args.indexOf('--limite') + 1]) : Infinity;



/* listar las 500 publicaciones tarda: MELI se pide de a 20 y a veces corta */
async function traer(url, intentos = 3) {
  for (let i = 1; i <= intentos; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(600000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) {
      if (i === intentos) throw e;
      console.log(`   (reintento ${i} — ${e.message})`);
      await new Promise(ok => setTimeout(ok, 4000));
    }
  }
}

const productos = await traer(`${BASE}/api/productos`);
const datos = await traer(`${BASE}/api/meli/mis-items`);
const activos = (datos.items || []).filter(i => i.estado === 'active');
if (!activos.length) { console.log('No pude leer las publicaciones.'); process.exit(1); }

console.log(`\n${activos.length} publicaciones activas${dry ? ' (SIMULACIÓN)' : ''}`);
const pocasFotos = activos.filter(i => i.fotos < 4);
if (pocasFotos.length) console.log(`⚠ ${pocasFotos.length} con menos de 4 fotos\n`); else console.log('Todas con 4 fotos o más\n');

let ok = 0, fallos = 0, sinCruce = 0;
const stats = {}, cuantos = [], motivos = {}, caidas = [];
for (const it of activos) {
  if (ok + fallos >= limite) break;
  const p = cruzar(it.titulo, productos);
  if (!p) { sinCruce++; console.log(`  sin cruce: ${it.titulo}`); continue; }

  const attrs = ficha(p);
  if (dry) {
    ok++;
    for (const a of attrs) stats[a.id] = (stats[a.id] || 0) + 1;
    cuantos.push(attrs.length);
    continue;
  }

  try {
    const r = await fetch(`${BASE}/api/meli/atributos`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: it.id, attributes: attrs })
    });
    const j = await r.json();
    if (j.ok) ok++;
    else { fallos++; motivos[j.error] = (motivos[j.error] || 0) + 1; caidas.push(`${it.id}  ${it.titulo}  →  ${j.error}`); }
  } catch (e) { fallos++; motivos[e.message] = (motivos[e.message] || 0) + 1; caidas.push(`${it.id}  ${it.titulo}  →  ${e.message}`); }
  if ((ok + fallos) % 25 === 0) process.stdout.write(`\r  ${ok + fallos}/${activos.length}`);
}

if (dry) {
  const prom = (cuantos.reduce((s, n) => s + n, 0) / (cuantos.length || 1)).toFixed(1);
  console.log(`cruzadas ${ok} · sin cruce ${sinCruce} · promedio ${prom} atributos por publicacion\n`);
  for (const [id, n] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}/${ok}  ${id}`);
  }
  process.exit(0);
}

console.log(`\n\n${ok} enriquecidas · ${fallos} fallaron · ${sinCruce} sin cruce.`);
for (const [m, n] of Object.entries(motivos).sort((a, b) => b[1] - a[1])) console.log(`  ${n}× ${m}`);
if (caidas.length) {
  // sin los ids no hay forma de ir a mirar qué tienen de distinto
  fs.writeFileSync(path.join(import.meta.dirname, 'CALIDAD_FALLIDAS.txt'), caidas.join('\n') + '\n', 'utf8');
  console.log(`\nLas ${caidas.length} que fallaron quedaron en 07_CATALOGO/CALIDAD_FALLIDAS.txt`);
}
console.log('MELI recalcula la calidad en unas horas.\n');
