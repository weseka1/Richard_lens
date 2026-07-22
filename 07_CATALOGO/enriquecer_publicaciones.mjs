/* Completa los atributos de las publicaciones que ya están arriba.
 *
 * MELI puntúa la "salud" de cada publicación según cuántos atributos tenga
 * cargados, y con salud baja te muestra último por más que el precio sea
 * competitivo. Las primeras 400 salieron con solo marca/modelo/género.
 *
 * Uso: node enriquecer_publicaciones.mjs [--dry]
 */
const BASE = process.env.RL_URL || 'http://localhost:5250';
const dry = process.argv.includes('--dry');

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

function atributos(p) {
  const attrs = [];
  const color = (p.variantes || [])[0]?.color || p.color || '';
  const [armazon, lente] = String(color).split('/');
  if (armazon) attrs.push({ id: 'FRAME_COLOR', value_name: armazon.trim() });
  if (lente) attrs.push({ id: 'LENS_COLOR', value_name: lente.trim() });

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
const conPublicaciones = productos.filter(p => (p.meli_items || []).length);

let total = 0;
for (const p of conPublicaciones) total += p.meli_items.length;
console.log(`\n${conPublicaciones.length} modelos · ${total} publicaciones a enriquecer${dry ? ' (SIMULACIÓN)' : ''}\n`);

let ok = 0, fallos = 0;
for (const p of conPublicaciones) {
  const attrs = atributos(p);
  for (const item of p.meli_items) {
    if (dry) { ok++; continue; }
    try {
      const r = await fetch(`${BASE}/api/meli/atributos`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, attributes: attrs })
      });
      const j = await r.json();
      if (j.ok) ok++; else { fallos++; if (fallos < 4) console.log(`  ❌ ${item.id}: ${j.error}`); }
    } catch (e) { fallos++; }
  }
  process.stdout.write(`\r  ${ok + fallos}/${total}`);
}

console.log(`\n\n${ok} enriquecidas · ${fallos} fallaron.`);
console.log('La salud de MELI tarda unas horas en recalcular.\n');
