/* Pausa las publicaciones de una marca.
 *
 * Sirve para sacar de la vidriera lo que ensucia el posicionamiento sin
 * borrarlo: una publicación pausada conserva su historial y se puede
 * reactivar cuando convenga.
 *
 * Uso: node pausar_marca.mjs "Amore Fashion" [--dry]
 */
const BASE = process.env.RL_URL || 'http://localhost:5250';
const marca = process.argv[2];
const dry = process.argv.includes('--dry');
if (!marca) { console.log('Falta la marca. Ej: node pausar_marca.mjs "Amore Fashion"'); process.exit(1); }

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const { items } = await (await fetch(`${BASE}/api/meli/mis-items`)).json();
const objetivo = items.filter(i => i.estado === 'active' && norm(i.titulo).includes(norm(marca)));

console.log(`\n${objetivo.length} publicaciones activas de "${marca}"${dry ? ' (SIMULACIÓN)' : ''}\n`);

let ok = 0, fallos = 0;
for (const it of objetivo) {
  if (dry) { console.log(`   ${it.titulo} · $${it.precio.toLocaleString('es-AR')}`); ok++; continue; }
  try {
    const r = await fetch(`${BASE}/api/meli/reactivar`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: it.id, pausar: true })
    });
    const j = await r.json();
    if (j.ok) ok++; else { fallos++; if (fallos <= 3) console.log(`   ❌ ${it.titulo}: ${j.error}`); }
  } catch (e) { fallos++; }
}
console.log(`\n${ok} pausadas · ${fallos} fallaron.\n`);
