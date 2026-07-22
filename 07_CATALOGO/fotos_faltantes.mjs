/* Qué fotos hay que pedirle al proveedor, ordenado por lo que más duele.
 *
 * Las publicaciones con menos de 4 fotos rankean peor y convierten peor. No es
 * que MELI las haya rechazado: esas carpetas quedaron cortas después de que la
 * auditoría descartó las fotos que no eran el modelo exacto. La única salida es
 * conseguir las fotos que faltan.
 *
 * Uso: node fotos_faltantes.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.RL_URL || 'http://localhost:5250';
const IMAGENES = path.join(import.meta.dirname, 'imagenes');
const MINIMO = 4;

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

async function traer(url, intentos = 3) {
  for (let i = 1; i <= intentos; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(600000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) {
      if (i === intentos) throw e;
      await new Promise(ok => setTimeout(ok, 4000));
    }
  }
}

function contar(codigo) {
  const dir = path.join(IMAGENES, codigo);
  let usables = 0, descartadas = 0;
  try {
    for (const f of fs.readdirSync(dir)) {
      if (!/\.(jpe?g|png|webp)$/i.test(f)) continue;
      if (/^_descartada_/i.test(f)) descartadas++;
      else if (!f.startsWith('_')) usables++;
    }
  } catch { return null; }
  return { usables, descartadas };
}

const productos = await traer(`${BASE}/api/productos`);
const datos = await traer(`${BASE}/api/meli/mis-items`);
const activos = (datos.items || []).filter(i => i.estado === 'active');

const porModelo = productos.filter(p => p.modelo)
  .sort((a, b) => String(b.modelo).length - String(a.modelo).length);

// agrupamos por producto: una foto que falta arruina TODAS sus publicaciones
const faltantes = new Map();
for (const it of activos) {
  if (it.fotos >= MINIMO) continue;
  const t = norm(it.titulo);
  const p = porModelo.find(x => t.includes(norm(x.modelo)) && t.includes(norm(String(x.marca).split(' · ')[0])));
  if (!p) continue;
  const clave = p.foto_codigo;
  if (!faltantes.has(clave)) faltantes.set(clave, { p, publicaciones: 0, enMeli: it.fotos });
  faltantes.get(clave).publicaciones++;
}

const filas = [...faltantes.values()].map(f => {
  const c = contar(f.p.foto_codigo) || { usables: 0, descartadas: 0 };
  return { ...f, ...c, faltan: Math.max(0, MINIMO - c.usables) };
}).sort((a, b) => b.publicaciones - a.publicaciones);

const total = filas.reduce((s, f) => s + f.publicaciones, 0);
console.log(`\n${filas.length} modelos dejan ${total} publicaciones con menos de ${MINIMO} fotos.\n`);
console.log('  PUBS  TIENE  FALTAN  DESCART  MODELO');
for (const f of filas) {
  console.log(`  ${String(f.publicaciones).padStart(4)}  ${String(f.usables).padStart(5)}  ${String(f.faltan).padStart(6)}  ${String(f.descartadas).padStart(7)}  ${f.p.marca} ${f.p.modelo}  (${f.p.foto_codigo})`);
}

const pedir = filas.reduce((s, f) => s + f.faltan, 0);
console.log(`\nTotal de fotos a conseguir: ${pedir}.`);
console.log('Las "DESCART" son las que la auditoría sacó por no ser el modelo exacto:');
console.log('si el proveedor te manda las buenas, se recuperan estas publicaciones.\n');

fs.writeFileSync(path.join(import.meta.dirname, 'PEDIR_AL_PROVEEDOR.txt'),
  filas.map(f => `${f.p.marca} ${f.p.modelo} (${f.p.foto_codigo}) — faltan ${f.faltan} fotos, afecta ${f.publicaciones} publicaciones`).join('\n') + '\n',
  'utf8');
console.log('Lista guardada en 07_CATALOGO/PEDIR_AL_PROVEEDOR.txt');
