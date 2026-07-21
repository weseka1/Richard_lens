/* Lanzador MELI — el método de Juani, con sus números actualizados.
 *
 * Sale de sus 80 publicaciones anteriores: 5 publicaciones por modelo con
 * precios escalonados. Vendió en tres escalones distintos del mismo modelo,
 * así que no es duplicar por duplicar: es cubrir toda la banda de búsqueda.
 * Cada publicación lleva título y foto de portada distintos, que es lo que
 * las hace publicaciones separadas y no duplicados.
 *
 * Prioridad FERRARI: 17 de sus 22 ventas fueron Ferrari. Wayfarer y Round
 * vendieron cero.
 *
 * Uso:  node lanzar_meli.mjs --dry              simula, no publica
 *       node lanzar_meli.mjs --escalon 3        publica solo el escalón 3
 *       node lanzar_meli.mjs --modelo <id>      publica solo un modelo
 *       node lanzar_meli.mjs                    dispara todo
 */

const BASE = process.env.RL_URL || 'http://localhost:5250';
const DOLAR = 1545;
const MELI = 0.155, IIBB = 0.035, IVA = 0.21, ENVIO = 7000;

const costoDe = p => (String(p.marca).includes('Ferrari') || /polariz/i.test(p.modelo) ? 61 : 58) * DOLAR;
const piso = costo => (costo + ENVIO) / (1 - MELI - IIBB - IVA / (1 + IVA));
const bolsillo = (precio, costo) => precio - precio * MELI - ENVIO - (precio - precio / (1 + IVA)) - precio * IIBB - costo;
const plata = n => '$' + Math.round(n).toLocaleString('es-AR');
const redondear = n => Math.round(n / 1000) * 1000 - 100;

/* Títulos con la fórmula que YA le vendió a Juani:
 *   "Anteojos De Sol Rayban X Escudería Ferrari 3674m Gafas Rb"
 * Escribe "Rayban" pegado, que es como busca la gente, mete el número de
 * modelo (que es lo que se tipea) y rellena con palabras clave. Nada de
 * "Ray-Ban · Ferrari Scuderia Ferrari..." que repite y se corta.  */
function armarTitulo(p, gancho) {
  const esFerrari = /ferrari/i.test(p.marca) || /ferrari/i.test(p.modelo);
  // el número de modelo es lo que la gente escribe en el buscador
  const codigo = (String(p.modelo).match(/\d{3,4}\s*[a-zA-Z]?/) || [''])[0].replace(/\s+/g, '').toLowerCase();
  const limpio = String(p.modelo)
    .replace(/scuderia\s+ferrari/ig, '')
    .replace(/\d{3,4}\s*[a-zA-Z]?/g, '')
    .replace(/\s+/g, ' ').trim();

  const base = esFerrari
    ? `Anteojos De Sol Rayban X Escudería Ferrari ${codigo}`
    : `Anteojos De Sol Rayban ${limpio} ${codigo}`.replace(/\s+/g, ' ');

  // agrega el gancho solo si entra entero: cortar a mitad de palabra queda feo
  const full = `${base} ${gancho}`.replace(/\s+/g, ' ').trim();
  if (full.length <= 60) return full;
  return base.length <= 60 ? base.slice(0, 60).trim() : base.slice(0, 60).replace(/\s\S*$/, '');
}

/* la escalera: multiplicador sobre el piso + el gancho que va en el título */
const ESCALERA = [
  { m: 1.28, sufijo: 'Gafas Rb',        stock: 3, listing: 'gold_special' },
  { m: 1.45, sufijo: 'Italy Rb',        stock: 5, listing: 'gold_special' },
  { m: 1.62, sufijo: 'Originales',      stock: 8, listing: 'gold_special' },
  { m: 1.82, sufijo: 'Con Estuche',     stock: 8, listing: 'gold_special' },
  { m: 2.05, sufijo: 'Uv400 Garantia',  stock: 5, listing: 'gold_pro' }
];

/* Ferrari primero: son los que vendieron. Se publican solo los que tengan
 * fotos_ok, o sea revisados foto por foto. */
const MODELOS = [
  'scuderia-ferrari-round-double-bridge-3674m',   // su #1 historico: 9 ventas
  'scuderia-ferrari-fibre-carbon-8313m',          // su #2: 3 ventas
  'scuderia-ferrari-4310m',
  'scuderia-ferrari-2217m',
  'scuderia-ferrari-4179m',
  'scuderia-ferrari-aviator-3460m',
  'erika-4171',                                   // 4 ventas historicas
  'aviador-classic-3025'
];

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const soloEscalon = args.includes('--escalon') ? Number(args[args.indexOf('--escalon') + 1]) : null;
const soloModelo = args.includes('--modelo') ? args[args.indexOf('--modelo') + 1] : null;

const productos = await (await fetch(`${BASE}/api/productos`)).json();

console.log(`\n═══ LANZADOR MELI ${dry ? '— SIMULACIÓN' : '— PUBLICANDO EN SERIO'}   (${BASE})\n`);

let ok = 0, fallos = 0, saltados = 0, facturacionPotencial = 0;
for (const id of (soloModelo ? [soloModelo] : MODELOS)) {
  const p = productos.find(x => x.id === id);
  if (!p) { console.log(`✗ ${id}: no está en el catálogo`); saltados++; continue; }
  if (!p.fotos_ok) { console.log(`⏭  ${p.modelo}: fotos sin revisar — se salta`); saltados++; continue; }

  const costo = costoDe(p);
  console.log(`━━ ${p.marca} ${p.modelo}   (costo ${plata(costo)} · stock proveedor ${p.stock})`);

  for (const [i, e] of ESCALERA.entries()) {
    if (soloEscalon && soloEscalon !== i + 1) continue;
    const precio = redondear(piso(costo) * e.m);
    const titulo = armarTitulo(p, e.sufijo);
    const g = bolsillo(precio, costo);
    facturacionPotencial += precio;

    console.log(`   #${i + 1} ${plata(precio).padStart(10)} · stock ${String(e.stock).padStart(2)} · ganás ${plata(g).padStart(9)}`);
    console.log(`      "${titulo}"`);
    if (dry) continue;

    try {
      const r = await fetch(`${BASE}/api/meli/publicar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, precio, titulo, stockMax: e.stock, listing: e.listing })
      });
      const j = await r.json();
      if (j.permalink) { console.log(`      ✅ ${j.permalink}`); ok++; }
      else { console.log(`      ❌ ${j.error || JSON.stringify(j).slice(0, 160)}`); fallos++; }
    } catch (err) { console.log(`      ❌ ${err.message}`); fallos++; }
  }
  console.log('');
}

if (dry) {
  console.log(`Simulación lista. ${saltados ? saltados + ' modelo(s) saltados por fotos sin revisar.' : ''}`);
  const medio = redondear(piso(61 * DOLAR) * 1.62);
  console.log(`Para $2.000.000: ${Math.ceil(2000000 / medio)} ventas al escalón 3 (${plata(medio)}).`);
} else {
  console.log(`Resultado: ${ok} publicadas · ${fallos} fallaron · ${saltados} saltadas.`);
}
