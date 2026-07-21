/* Lanzador de publicaciones en MercadoLibre — la estrategia de 3 escalones.
 *
 * Por cada modelo dispara TRES publicaciones con precio, título y foto de
 * portada distintos. No son duplicados: MELI castiga la publicación idéntica,
 * no que un vendedor tenga varias entradas con distinto ángulo comercial.
 *
 *   BAJO   → gana el filtro "menor precio". Margen flaco a propósito: las
 *            primeras ventas se compran, sirven para levantar reputación.
 *   MEDIO  → el que convierte de verdad. Acá está el volumen.
 *   ALTO   → cuotas sin interés, para el que compra por confianza.
 *
 * Uso:  node lanzar_meli.mjs --dry            (muestra qué haría, no publica)
 *       node lanzar_meli.mjs --escalon bajo   (publica solo un escalón)
 *       node lanzar_meli.mjs                  (publica los tres)
 */

const BASE = process.env.RL_URL || 'https://richardlens.onrender.com';
const DOLAR = 1545, COSTO_USD = 58;
const MELI_COM = 0.155, IIBB = 0.035, IVA = 0.21, ENVIO = 7000;

const ESCALONES = {
  bajo:  { precio: 169900, stock: 3, listing: 'gold_special', sufijo: 'Con Estuche' },
  medio: { precio: 229900, stock: 5, listing: 'gold_special', sufijo: 'Originales' },
  alto:  { precio: 289900, stock: 5, listing: 'gold_pro',     sufijo: 'Garantia Oficial' }
};

/* Solo modelos cuya carpeta de fotos es realmente de ESE modelo.
 * Las variantes espejado/rareprint comparten carpeta con la clásica:
 * publicarlas mostraría el producto equivocado y eso en MELI se paga caro. */
const MODELOS = ['aviador-classic-3025', 'wayfarer-classic-2140', 'erika-4171', 'round-metal-classic-3447'];

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const soloEscalon = args.includes('--escalon') ? args[args.indexOf('--escalon') + 1] : null;

const plata = n => '$' + Math.round(n).toLocaleString('es-AR');
const bolsillo = p => {
  const costo = COSTO_USD * DOLAR;
  return p - p * MELI_COM - ENVIO - (p - p / (1 + IVA)) - p * IIBB - costo;
};

const productos = await (await fetch(`${BASE}/api/productos`)).json();

console.log(`\n═══ LANZADOR MELI ${dry ? '(SIMULACIÓN — no publica nada)' : '— PUBLICANDO EN SERIO'}\n`);

let ok = 0, fallos = 0;
for (const id of MODELOS) {
  const p = productos.find(x => x.id === id);
  if (!p) { console.log(`✗ ${id}: no está en el catálogo`); fallos++; continue; }
  if (!p.fotos_ok) { console.log(`✗ ${p.modelo}: fotos SIN VERIFICAR — no se publica`); fallos++; continue; }

  console.log(`━━ ${p.marca} ${p.modelo}  (stock proveedor: ${p.stock})`);
  for (const [nombre, e] of Object.entries(ESCALONES)) {
    if (soloEscalon && soloEscalon !== nombre) continue;
    const titulo = `Anteojos De Sol ${p.marca} ${p.modelo} ${e.sufijo}`.slice(0, 60);
    console.log(`   ${nombre.toUpperCase().padEnd(6)} ${plata(e.precio).padStart(10)} · stock ${e.stock} · ganás ${plata(bolsillo(e.precio))}`);
    console.log(`          "${titulo}"`);

    if (dry) continue;
    try {
      const r = await fetch(`${BASE}/api/meli/publicar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, precio: e.precio, titulo, stockMax: e.stock, listing: e.listing })
      });
      const j = await r.json();
      if (j.permalink) { console.log(`          ✅ ${j.permalink}`); ok++; }
      else { console.log(`          ❌ ${j.error || JSON.stringify(j)}`); fallos++; }
    } catch (err) { console.log(`          ❌ ${err.message}`); fallos++; }
  }
  console.log('');
}

const total = MODELOS.length * (soloEscalon ? 1 : 3);
console.log(dry
  ? `Simulación: ${total} publicaciones listas para disparar.`
  : `Resultado: ${ok} publicadas, ${fallos} fallaron.`);

if (dry) {
  const medio = ESCALONES.medio.precio;
  console.log(`\nPara facturar $2.000.000: ${Math.ceil(2000000 / medio)} ventas al escalón medio` +
    ` → ${plata(Math.ceil(2000000 / medio) * bolsillo(medio))} en el bolsillo.`);
}
