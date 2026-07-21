/* Radiografía de la competencia en MercadoLibre — desde el listado público.
 *
 * La API de búsqueda ahora exige token de usuario, así que leemos el listado
 * público (el mismo que ve cualquiera) y sacamos los precios del JSON que
 * MELI embebe en la página.
 *
 * Lo que importa no es el precio más bajo publicado — siempre hay alguien
 * que publica regalado y nunca vendió — sino dónde está el grueso del mercado.
 *
 * Uso: node espiar_mercado.mjs
 */

const DOLAR = 1545;
const COSTO_USD = 58;                 // clásicos; los Ferrari/polarizados van a 61
const MELI_COM = 0.155, IIBB = 0.035, IVA = 0.21, ENVIO = 7000;

const MODELOS = [
  ['Aviador Classic 3025', 'ray-ban-aviator-3025'],
  ['Wayfarer Classic 2140', 'ray-ban-wayfarer-2140'],
  ['Erika 4171', 'ray-ban-erika-4171'],
  ['Round Metal 3447', 'ray-ban-round-metal-3447'],
  ['Clubmaster 3016', 'ray-ban-clubmaster-3016'],
  ['Justin 4165', 'ray-ban-justin-4165'],
  ['New Wayfarer 2132', 'ray-ban-new-wayfarer-2132'],
  ['Hexagonal 3548', 'ray-ban-hexagonal-3548']
];

const plata = n => '$' + Math.round(n).toLocaleString('es-AR');
const bolsillo = (precio, costo = COSTO_USD * DOLAR) =>
  precio - precio * MELI_COM - ENVIO - (precio - precio / (1 + IVA)) - precio * IIBB - costo;

async function precios(slug) {
  const r = await fetch(`https://listado.mercadolibre.com.ar/${slug}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
      'Accept-Language': 'es-AR,es;q=0.9'
    }
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const html = await r.text();

  // MELI embebe los precios como "price":123456 dentro del estado de la página
  const crudos = [...html.matchAll(/"price"\s*:\s*(\d{4,9})(?:\.\d+)?/g)].map(m => Number(m[1]));
  // y también los muestra en el markup del precio
  const visibles = [...html.matchAll(/andes-money-amount__fraction[^>]*>([\d.]+)</g)]
    .map(m => Number(m[1].replace(/\./g, '')));

  const todos = [...crudos, ...visibles].filter(p => p >= 50000 && p <= 2000000);
  return [...new Set(todos)].sort((a, b) => a - b);
}

const costo = COSTO_USD * DOLAR;
console.log(`\n═══ MERCADO RAY-BAN EN MELI — tu costo ${COSTO_USD} USD × ${plata(DOLAR)} = ${plata(costo)}\n`);

const resumen = [];
for (const [nombre, slug] of MODELOS) {
  let ps;
  try { ps = await precios(slug); } catch (e) { console.log(`${nombre}: ${e.message}`); continue; }
  if (ps.length < 4) { console.log(`${nombre}: pocos datos (${ps.length})`); continue; }

  const q = f => ps[Math.min(ps.length - 1, Math.floor(ps.length * f))];
  const fila = { nombre, n: ps.length, min: ps[0], p25: q(0.25), med: q(0.5), p75: q(0.75), max: ps[ps.length - 1] };
  resumen.push(fila);

  console.log(`━━ ${nombre}   (${ps.length} precios leídos)`);
  console.log(`   más barato ${plata(fila.min).padStart(11)}   →  te quedan ${plata(bolsillo(fila.min))}`);
  console.log(`   25%        ${plata(fila.p25).padStart(11)}   →  te quedan ${plata(bolsillo(fila.p25))}`);
  console.log(`   MEDIANA    ${plata(fila.med).padStart(11)}   →  te quedan ${plata(bolsillo(fila.med))}`);
  console.log(`   75%        ${plata(fila.p75).padStart(11)}   →  te quedan ${plata(bolsillo(fila.p75))}`);
  console.log(`   más caro   ${plata(fila.max).padStart(11)}`);
  console.log('');
}

if (resumen.length) {
  const prom = k => resumen.reduce((a, f) => a + f[k], 0) / resumen.length;
  console.log('═══ RESUMEN DEL MERCADO (promedio de los modelos)');
  console.log(`   piso  ${plata(prom('min'))} · 25% ${plata(prom('p25'))} · mediana ${plata(prom('med'))} · 75% ${plata(prom('p75'))}\n`);

  console.log('═══ TU ESTRATEGIA DE 3 ESCALONES');
  const bajo = Math.round(prom('p25') / 1000) * 1000 - 100;
  const medio = Math.round(prom('med') / 1000) * 1000 - 100;
  const alto = Math.round(prom('p75') / 1000) * 1000 - 100;
  for (const [n, p] of [['BAJO (pelea)', bajo], ['MEDIO (volumen)', medio], ['ALTO (cuotas)', alto]]) {
    const g = bolsillo(p);
    console.log(`   ${n.padEnd(18)} ${plata(p).padStart(11)}  →  ${plata(g).padStart(10)} por venta` +
      (g < 20000 ? '   ⚠ margen flaco' : ''));
  }
  console.log('');
  const gMedio = bolsillo(medio);
  if (gMedio > 0) {
    console.log(`═══ META $2.000.000 DE FACTURACIÓN`);
    console.log(`   al escalón MEDIO son ${Math.ceil(2000000 / medio)} ventas · te quedarían ${plata(Math.ceil(2000000 / medio) * gMedio)}\n`);
  }
}
