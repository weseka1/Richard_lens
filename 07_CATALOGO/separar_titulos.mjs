/* Le da un título propio a las publicaciones que quedaron con el mismo.
 *
 * Duplicar el mismo modelo a precios distintos es la estrategia y está bien.
 * Lo que MELI castiga es el título IDÉNTICO: ve dos publicaciones iguales
 * compitiendo y las hunde a las dos. Con cambiarles el encabezado o el gancho
 * del final quedan separadas y siguen todas online.
 *
 * Nada de esto pausa ni borra: solo cambia el texto del título.
 *
 * Uso: node separar_titulos.mjs [--dry]
 */
import { createRequire } from 'node:module';
const { cruzar } = createRequire(import.meta.url)('../08_TIENDA_ONLINE/fichaMeli.js');

const BASE = process.env.RL_URL || 'http://localhost:5250';
const dry = process.argv.includes('--dry');

// los tres nombres con los que la gente busca lo mismo: variarlos suma alcance
const ENCABEZADOS = ['Lentes De Sol', 'Anteojos De Sol', 'Gafas De Sol'];

/* Ganchos que son ciertos para todo el catálogo. "Polarizados" NO está acá:
 * la ficha declara WITH_POLARIZED_LENS y prometer en el título algo que la
 * ficha desmiente es un reclamo servido. Se agrega aparte, solo a los que
 * de verdad lo son. */
const GANCHOS = [
  'Originales', 'Importados', 'Con Estuche', 'Cuotas Sin Interes', 'Envio Gratis',
  'Premium', 'Garantia', 'Hombre Mujer', 'Originales Italia', 'Unisex',
  'Uv400', 'Nuevos', 'Estuche Y Paño', 'Envio A Todo El Pais', 'Garantia Escrita',
  'Calidad Premium', 'Vision Uv400', 'Con Garantia', 'Modelo Nuevo', 'Sol Unisex',
];

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

const productos = await traer(`${BASE}/api/productos`);
const datos = await traer(`${BASE}/api/meli/mis-items`);
const activos = (datos.items || []).filter(i => i.estado === 'active');

const clave = t => t.toLowerCase().trim();
const usados = new Set(activos.map(i => clave(i.titulo)));

const grupos = new Map();
for (const it of activos) {
  const k = clave(it.titulo);
  if (!grupos.has(k)) grupos.set(k, []);
  grupos.get(k).push(it);
}
// la más vieja de cada grupo se queda con el título: es la que tiene historial
const aRetitular = [];
for (const items of grupos.values()) {
  if (items.length < 2) continue;
  items.sort((a, b) => String(a.creado).localeCompare(String(b.creado)));
  aRetitular.push(...items.slice(1));
}

console.log(`\n${activos.length} activas · ${aRetitular.length} con título repetido${dry ? ' (SIMULACIÓN)' : ''}\n`);
if (!aRetitular.length) process.exit(0);

let ok = 0, fallos = 0, sinHueco = 0, sinCruce = 0;
for (const it of aRetitular) {
  const p = cruzar(it.titulo, productos);
  if (!p) { sinCruce++; continue; }

  const marca = String(p.marca).split(' · ')[0];
  const polarizada = /polariz/i.test(`${p.modelo} ${p.cristal || ''}`);
  const ganchos = polarizada ? [...GANCHOS, 'Uv400 Polarizados', 'Polarizados'] : GANCHOS;

  let nuevo = null;
  for (const g of ganchos) {
    for (const enc of ENCABEZADOS) {
      const t = `${enc} ${marca} ${p.modelo} ${g}`;
      if (t.length > 60) continue;
      if (usados.has(clave(t))) continue;
      nuevo = t; break;
    }
    if (nuevo) break;
  }
  if (!nuevo) { sinHueco++; continue; }
  usados.add(clave(nuevo));

  if (dry) { console.log(`  ${it.titulo}\n     → ${nuevo}`); ok++; continue; }

  try {
    const r = await fetch(`${BASE}/api/meli/reactivar`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: it.id, titulo: nuevo })
    });
    const j = await r.json();
    if (j.ok) ok++; else fallos++;
  } catch { fallos++; }
  if ((ok + fallos) % 25 === 0) process.stdout.write(`\r  ${ok + fallos}/${aRetitular.length}`);
}

console.log(`\n\n${ok} separadas · ${fallos} fallaron · ${sinCruce} sin cruce · ${sinHueco} sin combinación libre.`);
if (sinHueco) console.log('Las "sin combinación libre" agotaron encabezados y ganchos: ese modelo ya tiene demasiadas.');
