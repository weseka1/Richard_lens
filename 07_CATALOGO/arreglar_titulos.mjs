/* Corrige los títulos que quedaron con sufijos de Ray-Ban en productos de lujo.
 * "Lentes De Sol Versace VE4432U Gafas Rb" no tiene sentido: Rb es Ray-Ban.
 * Los reemplaza por ganchos que sí buscan los compradores de estas marcas.
 */
const BASE = process.env.RL_URL || 'http://localhost:5250';

const REEMPLAZOS = [
  [/\s+Gafas Rb$/i, ' Originales Italia'],
  [/\s+Italy Rb$/i, ' Importados Uv400']
];

const r = await fetch(`${BASE}/api/meli/mis-items`);
const { items } = await r.json();

const aCorregir = items.filter(i =>
  /gafas rb$|italy rb$/i.test(i.titulo) && !/rayban|ray-ban/i.test(i.titulo)
);

console.log(`\n${aCorregir.length} títulos para corregir\n`);

let ok = 0, fallos = 0;
for (const it of aCorregir) {
  let nuevo = it.titulo;
  for (const [re, val] of REEMPLAZOS) nuevo = nuevo.replace(re, val);
  if (nuevo === it.titulo) continue;

  try {
    const res = await fetch(`${BASE}/api/meli/reactivar`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: it.id, titulo: nuevo, activar: false })
    });
    const j = await res.json();
    if (j.ok) { console.log(`  ✅ ${nuevo}`); ok++; }
    else { console.log(`  ❌ ${it.titulo} → ${j.error}`); fallos++; }
  } catch (e) { console.log(`  ❌ ${it.titulo} → ${e.message}`); fallos++; }
}

console.log(`\n${ok} corregidos, ${fallos} fallaron.`);
