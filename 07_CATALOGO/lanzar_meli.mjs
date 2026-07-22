/* Lanzador masivo MELI — el método de Juani a escala.
 *
 * Sale de sus 80 publicaciones anteriores: varias publicaciones del MISMO
 * modelo a precios escalonados. Vendió en tres escalones distintos a la vez,
 * así que no es duplicar por duplicar: es cubrir toda la banda de búsqueda.
 * Cada publicación lleva título y foto de portada distintos.
 *
 * Toma TODOS los productos con fotos_ok — no hay lista que mantener a mano:
 * marcás el producto como revisado en el panel y entra solo en la próxima corrida.
 *
 * Uso:  node lanzar_meli.mjs --dry              simula
 *       node lanzar_meli.mjs --marca Dior       solo una marca
 *       node lanzar_meli.mjs --escalon 3        solo un escalón
 *       node lanzar_meli.mjs --limite 20        corta después de N publicaciones
 *       node lanzar_meli.mjs                    dispara todo
 */

const BASE = process.env.RL_URL || 'http://localhost:5250';
const DOLAR = 1545;
const IIBB = 0.035, IVA = 0.21, ENVIO = 7000;

/* comisión real por tipo de publicación: la Premium cobra bastante más
 * pero habilita las cuotas sin interés, que es lo que sube el ticket */
const COMISION = { gold_special: 0.155, gold_pro: 0.28 };

const costoDe = p => (
  p.canal === 'WEB' ? 110 :                                        // lujo
  String(p.marca).includes('Ferrari') || /polariz/i.test(p.modelo) ? 61 :
  58
) * DOLAR;

const piso = (costo, com) => (costo + ENVIO) / (1 - com - IIBB - IVA / (1 + IVA));
const bolsillo = (precio, costo, com) =>
  precio - precio * com - ENVIO - (precio - precio / (1 + IVA)) - precio * IIBB - costo;
const plata = n => '$' + Math.round(n).toLocaleString('es-AR');
const redondear = n => Math.round(n / 1000) * 1000 - 100;

/* La escalera. Los cuatro primeros son Clásica (comisión baja, sin cuotas);
 * el quinto es Premium: cuesta más comisión pero va con cuotas sin interés,
 * que es lo que convence al que compra caro. */
const ESCALERA = [
  { m: 1.28, gancho: 'Originales',        stock: 3, listing: 'gold_special' },
  { m: 1.45, gancho: 'Importados Uv400',  stock: 5, listing: 'gold_special' },
  { m: 1.62, gancho: 'Con Estuche',       stock: 8, listing: 'gold_special' },
  { m: 1.82, gancho: 'Envio Gratis',      stock: 8, listing: 'gold_special' },
  { m: 1.55, gancho: 'Cuotas Sin Interes', stock: 5, listing: 'gold_pro' }
];

function armarTitulo(p, gancho) {
  const marca = String(p.marca).split(' · ')[0];
  const esFerrari = /ferrari/i.test(p.marca) || /ferrari/i.test(p.modelo);
  const codigo = (String(p.modelo).match(/\d{3,4}\s*[a-zA-Z]?/) || [''])[0].replace(/\s+/g, '').toLowerCase();
  const limpio = String(p.modelo).replace(/scuderia\s+ferrari/ig, '').replace(/\d{3,4}\s*[a-zA-Z]?/g, '').replace(/\s+/g, ' ').trim();

  const base = esFerrari
    ? `Anteojos De Sol Rayban X Escudería Ferrari ${codigo}`
    : /ray-?ban/i.test(marca)
      ? `Anteojos De Sol Rayban ${limpio} ${codigo}`.replace(/\s+/g, ' ').trim()
      : `Lentes De Sol ${marca} ${p.modelo}`.replace(/\s+/g, ' ').trim();

  const full = `${base} ${gancho}`.replace(/\s+/g, ' ').trim();
  if (full.length <= 60) return full;
  return base.length <= 60 ? base : base.slice(0, 60).replace(/\s\S*$/, '');
}

const args = process.argv.slice(2);
const val = f => args.includes(f) ? args[args.indexOf(f) + 1] : null;
const dry = args.includes('--dry');
const soloMarca = val('--marca');
const soloEscalon = val('--escalon') ? Number(val('--escalon')) : null;
const limite = val('--limite') ? Number(val('--limite')) : Infinity;

const productos = await (await fetch(`${BASE}/api/productos`)).json();

/* Los títulos que YA están en MELI. Hay que preguntárselo a MELI y no al
 * espejo local: Supabase reescribe productos.json cada 5 minutos y se lleva
 * puesto el registro de lo publicado. Sin esto se duplican publicaciones. */
const yaEnMeli = new Set();
try {
  const { items } = await (await fetch(`${BASE}/api/meli/mis-items`)).json();
  (items || []).forEach(i => yaEnMeli.add(i.titulo));
  console.log(`(${yaEnMeli.size} publicaciones ya existentes en la cuenta)`);
} catch { console.log('(no pude leer las publicaciones existentes — cuidado con duplicados)'); }

const aptos = productos.filter(p =>
  p.fotos_ok && p.estado === 'disponible' &&
  (!soloMarca || String(p.marca).toLowerCase().includes(soloMarca.toLowerCase()))
);

console.log(`\n═══ LANZADOR MELI ${dry ? '— SIMULACIÓN' : '— PUBLICANDO'}   ${aptos.length} modelos aptos\n`);

let ok = 0, fallos = 0, yaEstaba = 0, potencial = 0;
for (const p of aptos) {
  const costo = costoDe(p);
  const yaPublicadas = new Set((p.meli_items || []).map(x => x.titulo));
  const lineas = [];

  for (const [i, e] of ESCALERA.entries()) {
    if (soloEscalon && soloEscalon !== i + 1) continue;
    if (ok + fallos >= limite) break;

    const com = COMISION[e.listing];
    const precio = redondear(piso(costo, com) * e.m);
    const titulo = armarTitulo(p, e.gancho);
    const g = bolsillo(precio, costo, com);
    potencial += precio;

    if (yaPublicadas.has(titulo) || yaEnMeli.has(titulo)) { yaEstaba++; continue; }

    lineas.push(`   #${i + 1} ${plata(precio).padStart(10)} · ${e.listing === 'gold_pro' ? 'PREMIUM' : 'clásica'} · ganás ${plata(g).padStart(9)}  "${titulo}"`);
    if (dry) continue;

    try {
      const r = await fetch(`${BASE}/api/meli/publicar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, precio, titulo, stockMax: e.stock, listing: e.listing, permitirLujo: true })
      });
      const j = await r.json();
      if (j.permalink) { lineas.push(`        ✅ ${j.permalink}`); ok++; }
      else { lineas.push(`        ❌ ${(j.error || '').slice(0, 120)}`); fallos++; }
    } catch (err) { lineas.push(`        ❌ ${err.message}`); fallos++; }
  }

  if (lineas.length) {
    console.log(`━━ ${p.marca} ${p.modelo}  (costo ${plata(costo)})`);
    lineas.forEach(l => console.log(l));
    console.log('');
  }
}

console.log(dry
  ? `Simulación: ${aptos.length} modelos × ${soloEscalon ? 1 : ESCALERA.length} escalones. ${yaEstaba} ya publicadas.`
  : `Resultado: ${ok} publicadas · ${fallos} fallaron · ${yaEstaba} ya estaban.`);
