/* Cuántas visitas está juntando cada publicación.
 *
 * Es el termómetro más honesto que hay: sin visitas no hay problema de precio
 * ni de foto, hay problema de que no aparecemos. Con visitas y sin ventas, el
 * problema es precio, foto o reputación. Son dos diagnósticos opuestos.
 *
 * Uso: node visitas_meli.mjs [--top 20]
 */
import fs from 'node:fs';
import path from 'node:path';

const CFG = path.join(import.meta.dirname, '..', '08_TIENDA_ONLINE', 'data', 'meli.json');
const args = process.argv.slice(2);
const top = args.includes('--top') ? Number(args[args.indexOf('--top') + 1]) : 20;

const t = JSON.parse(fs.readFileSync(CFG, 'utf8')).tokens;
if (!t) { console.log('No hay tokens de MELI. Conectá la cuenta primero.'); process.exit(1); }

async function api(ruta, intentos = 3) {
  for (let i = 1; i <= intentos; i++) {
    try {
      const r = await fetch('https://api.mercadolibre.com' + ruta, {
        headers: { Authorization: 'Bearer ' + t.access_token },
        signal: AbortSignal.timeout(120000),
      });
      if (!r.ok) throw new Error(r.status + ' ' + (await r.text()).slice(0, 160));
      return await r.json();
    } catch (e) {
      if (i === intentos) throw e;
      await new Promise(ok => setTimeout(ok, 3000));
    }
  }
}

/* El total del vendedor sale en UNA llamada. Conviene pedirlo primero: si da
 * cero, no hace falta recorrer las 500 de a una para enterarse de lo mismo. */
const resumen = await api(`/users/${t.user_id}/items_visits/time_window?last=30&unit=day`);
console.log(`\nVISITAS EN LOS ÚLTIMOS 30 DÍAS: ${resumen.total_visits}`);

const porDia = (resumen.results || []).filter(d => d.total > 0);
if (porDia.length) {
  console.log('\n  DÍA           VISITAS');
  for (const d of porDia) console.log(`  ${d.date.slice(0, 10)}    ${String(d.total).padStart(6)}`);
}

if (!resumen.total_visits) {
  console.log('\nCero visitas. Eso no es problema de precio ni de foto: es que todavía no aparecemos.');
  console.log('Lo que mueve la aguja acá es la calidad de ficha, los títulos y el tiempo publicado.\n');
  process.exit(0);
}

// el listado del vendedor se pagina con scroll; sin cortar bien, repite páginas
const ids = new Set();
let scroll = null;
for (let i = 0; i < 60; i++) {
  const j = await api(`/users/${t.user_id}/items/search?search_type=scan&limit=100${scroll ? '&scroll_id=' + scroll : ''}`);
  if (!j.results?.length) break;
  const antes = ids.size;
  j.results.forEach(x => ids.add(x));
  if (ids.size === antes) break;       // scroll agotado: sigue devolviendo lo mismo
  scroll = j.scroll_id;
}
console.log(`\n${ids.size} publicaciones — buscando cuáles se llevan las visitas...\n`);

// MELI dejó de aceptar consultas por lote: hay que ir de a una
const visitas = {};
for (const id of ids) {
  try { visitas[id] = (await api(`/items/${id}/visits/time_window?last=30&unit=day`)).total_visits || 0; }
  catch { visitas[id] = 0; }
}

const conVisitas = Object.entries(visitas).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
console.log(`Publicaciones que recibieron alguna: ${conVisitas.length} de ${ids.size}\n`);

console.log('  VISITAS  VENDIDOS  PRECIO       TÍTULO');
for (const [id, n] of conVisitas.slice(0, top)) {
  const it = await api(`/items/${id}?attributes=title,price,sold_quantity,health`);
  console.log(`  ${String(n).padStart(7)}  ${String(it.sold_quantity || 0).padStart(8)}  $${String(it.price).padStart(9)}  ${it.title}`);
}

console.log(`\nEl ${((conVisitas.length / ids.size) * 100).toFixed(1)}% de las publicaciones se lleva todas las visitas.`);
