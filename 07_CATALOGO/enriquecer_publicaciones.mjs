/* Completa los atributos de las publicaciones que ya están online.
 *
 * MELI puntúa la "salud" de cada publicación según cuántos atributos tenga
 * cargados, y con salud baja te muestra último por más que el precio sea
 * competitivo. Las primeras tandas salieron con solo marca/modelo/género.
 *
 * Lee las publicaciones desde MELI (no desde el espejo local, que Supabase
 * reescribe cada 5 minutos) y las cruza con el catálogo por marca y modelo.
 *
 * Uso: node enriquecer_publicaciones.mjs [--dry]
 */
const BASE = process.env.RL_URL || 'http://localhost:5250';
const dry = process.argv.includes('--dry');

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

function atributos(p) {
  const attrs = [];
  const color = (p.variantes || [])[0]?.color || p.color || '';
  const [armazon, lente] = String(color).split('/');
  if (armazon && armazon.trim()) attrs.push({ id: 'FRAME_COLOR', value_name: armazon.trim() });
  if (lente && lente.trim()) attrs.push({ id: 'LENS_COLOR', value_name: lente.trim() });

  const m = norm(p.material);
  if (/acetat|acrilic|plastic/.test(m)) attrs.push({ id: 'FRAME_MATERIAL', value_name: 'Acetato' });
  else if (/metal|titan|acero|alumin/.test(m)) attrs.push({ id: 'FRAME_MATERIAL', value_name: 'Metal' });

  const FORMAS = { aviador: 'Aviador', wayfarer: 'Wayfarer', redondo: 'Redondo', cuadrado: 'Cuadrado', deportivo: 'Deportivo', lujo: 'Cuadrado' };
  const f = FORMAS[norm(p.forma)];
  if (f) attrs.push({ id: 'FRAME_SHAPE', value_name: f });

  if (/polariz/i.test(p.modelo) || /polariz/i.test(p.cristal || ''))
    attrs.push({ id: 'IS_POLARIZED', value_name: 'Sí' });

  attrs.push({ id: 'UV_PROTECTION', value_name: 'Sí' });
  return attrs;
}

const productos = await (await fetch(`${BASE}/api/productos`)).json();
const { items } = await (await fetch(`${BASE}/api/meli/mis-items`)).json();
const activos = items.filter(i => i.estado === 'active');

console.log(`\n${activos.length} publicaciones activas${dry ? ' (SIMULACIÓN)' : ''}\n`);

/* cruce por modelo: el título lleva el modelo, que es lo más específico */
const porModelo = productos
  .filter(p => p.modelo)
  .sort((a, b) => String(b.modelo).length - String(a.modelo).length);   // el más largo primero, para no matchear de más

let ok = 0, fallos = 0, sinMatch = 0;
for (const it of activos) {
  const t = norm(it.titulo);
  const p = porModelo.find(x => t.includes(norm(x.modelo)) && t.includes(norm(String(x.marca).split(' · ')[0])));
  if (!p) { sinMatch++; continue; }

  const attrs = atributos(p);
  if (!attrs.length) continue;
  if (dry) { ok++; continue; }

  try {
    const r = await fetch(`${BASE}/api/meli/atributos`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: it.id, attributes: attrs })
    });
    const j = await r.json();
    if (j.ok) ok++; else { fallos++; if (fallos <= 3) console.log(`  ❌ ${it.titulo}: ${j.error}`); }
  } catch (e) { fallos++; }
  process.stdout.write(`\r  ${ok + fallos + sinMatch}/${activos.length}`);
}

console.log(`\n\n${ok} enriquecidas · ${fallos} fallaron · ${sinMatch} sin cruce con el catálogo.`);
console.log('La salud de MELI recalcula en unas horas.\n');
