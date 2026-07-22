/* Rellena las publicaciones que quedaron con menos de 4 fotos.
 *
 * Al publicar, cuando MELI rechaza una imagen (peso, formato, fondo) el
 * publicador seguía de largo: la publicación salía con 2 o 3 fotos y quedaba
 * peor rankeada. Acá las volvemos a subir desde el disco.
 *
 * Uso: node fotos_meli.mjs [--dry] [--minimo 4]
 */
const BASE = process.env.RL_URL || 'http://localhost:5250';
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const minimo = args.includes('--minimo') ? Number(args[args.indexOf('--minimo') + 1]) : 4;

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

const productos = await traer(`${BASE}/api/productos`);
const datos = await traer(`${BASE}/api/meli/mis-items`);
const flojas = (datos.items || []).filter(i => i.estado === 'active' && i.fotos < minimo);

console.log(`\n${flojas.length} publicaciones con menos de ${minimo} fotos${dry ? ' (SIMULACIÓN)' : ''}\n`);
if (!flojas.length) process.exit(0);

const porModelo = productos.filter(p => p.modelo)
  .sort((a, b) => String(b.modelo).length - String(a.modelo).length);

let arregladas = 0, sinFotos = 0, sinCruce = 0, fallos = 0;
const motivos = {};

for (const it of flojas) {
  const t = norm(it.titulo);
  const p = porModelo.find(x => t.includes(norm(x.modelo)) && t.includes(norm(String(x.marca).split(' · ')[0])));
  if (!p) { sinCruce++; continue; }

  if (dry) { console.log(`  ${it.fotos} fotos → ${p.foto_codigo}  (${it.titulo})`); arregladas++; continue; }

  try {
    const r = await fetch(`${BASE}/api/meli/rellenar-fotos`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: it.id, codigo: p.foto_codigo, minimo })
    });
    const j = await r.json();
    if (j.ok && !j.sinCambios) { arregladas++; console.log(`  ✓ ${j.antes} → ${j.ahora}  ${it.titulo}`); }
    else if (j.ok) arregladas++;
    else { fallos++; motivos[j.error] = (motivos[j.error] || 0) + 1; if (/sin fotos locales/.test(j.error)) sinFotos++; }
  } catch (e) { fallos++; motivos[e.message] = (motivos[e.message] || 0) + 1; }
}

console.log(`\n${arregladas} arregladas · ${fallos} sin arreglar · ${sinCruce} sin cruce.`);
for (const [m, n] of Object.entries(motivos).sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`  ${n}× ${m}`);
if (sinFotos) console.log(`\n${sinFotos} necesitan que el proveedor te pase fotos: no las tenemos en disco.`);
