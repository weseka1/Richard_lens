/* Cuánto se puede ganar SIN Ray-Ban.
 *
 * No modela "cuántas ventas quiero" sino algo que se puede medir y ajustar:
 * cuántas ventas produce cada publicación por mes. Con 500 publicaciones
 * arriba, mover ese número dos décimas cambia todo el negocio.
 *
 * Referencia de la industria en MELI: una publicación de ticket alto sin
 * reputación arranca en 0,05-0,10 ventas/mes, y con reputación consolidada
 * llega a 0,30-0,50. Por eso los tres escenarios.
 *
 * Uso: node escenario_sin_rayban.mjs
 */

const DOLAR = 1545;
const IIBB = 0.035, IVA = 0.21, ENVIO = 7000, COM = 0.155;

const plata = n => '$' + Math.round(n).toLocaleString('es-AR');
const neto = (precio, costo) =>
  precio - precio * COM - ENVIO - (precio - precio / (1 + IVA)) - precio * IIBB - costo;

/* publicaciones activas hoy, por marca (dato real de la cuenta) */
const LINEAS = [
  { marca: 'Dior',          pubs: 154, precio: 449900, usd: 110 },
  { marca: 'Louis Vuitton', pubs: 50,  precio: 449900, usd: 110 },
  { marca: 'Versace',       pubs: 49,  precio: 449900, usd: 110 },
  { marca: 'Balenciaga',    pubs: 46,  precio: 449900, usd: 110 },
  { marca: 'Prada',         pubs: 45,  precio: 449900, usd: 110 },
  { marca: 'Gucci',         pubs: 35,  precio: 449900, usd: 110 },
  { marca: 'Celine',        pubs: 33,  precio: 449900, usd: 110 },
  { marca: 'Off-White',     pubs: 31,  precio: 449900, usd: 110 },
  { marca: 'Fendi',         pubs: 28,  precio: 449900, usd: 110 },
  { marca: 'Oakley',        pubs: 27,  precio: 245900, usd: 58  }
];

const ESCENARIOS = [
  { nombre: 'ARRANQUE   (sin reputación, primeras semanas)', tasa: 0.05 },
  { nombre: 'RODANDO    (con las primeras ventas hechas)',   tasa: 0.12 },
  { nombre: 'CONSOLIDADO(reputación verde, MELI te muestra)', tasa: 0.30 }
];

const totalPubs = LINEAS.reduce((a, l) => a + l.pubs, 0);
console.log(`\n═══ ESCENARIO SIN RAY-BAN — ${totalPubs} publicaciones activas\n`);

for (const e of ESCENARIOS) {
  let ventas = 0, facturado = 0, ganancia = 0;
  for (const l of LINEAS) {
    const v = l.pubs * e.tasa;
    ventas += v;
    facturado += v * l.precio;
    ganancia += v * neto(l.precio, l.usd * DOLAR);
  }
  console.log(`━━ ${e.nombre}   (${e.tasa} ventas por publicación al mes)`);
  console.log(`   ${ventas.toFixed(0)} ventas/mes  ·  facturás ${plata(facturado)}  ·  GANÁS ${plata(ganancia)}`);
  console.log(`   por día: ${(ventas / 30).toFixed(1)} ventas · ${plata(ganancia / 30)} en el bolsillo\n`);
}

/* ¿qué hace falta para los $500.000 diarios que quiere? */
const OBJETIVO_DIA = 500000;
const netoLujo = neto(449900, 110 * DOLAR);
const ventasNecesarias = (OBJETIVO_DIA * 30) / netoLujo;
console.log('═══ PARA $500.000 LIMPIOS POR DÍA (sin Ray-Ban)');
console.log(`   Necesitás ${Math.ceil(ventasNecesarias)} ventas de lujo por mes = ${(ventasNecesarias / 30).toFixed(1)} por día`);
console.log(`   Con ${totalPubs} publicaciones, eso es ${(ventasNecesarias / totalPubs).toFixed(2)} ventas por publicación al mes.`);
console.log(`   ${ventasNecesarias / totalPubs <= 0.30 ? '✅ ALCANZABLE con reputación consolidada' : '⚠ hace falta más catálogo o más canal'}\n`);

/* y la meta corta */
console.log('═══ LA META DE $2.000.000 FACTURADOS');
const ventas2M = 2000000 / 449900;
console.log(`   ${Math.ceil(ventas2M)} ventas de lujo · te quedan ${plata(Math.ceil(ventas2M) * netoLujo)} limpios`);
console.log(`   Con 500 publicaciones activas son ${(ventas2M / totalPubs).toFixed(3)} ventas por publicación. Es poco: entra.\n`);

console.log('═══ LAS TRES PALANCAS, ORDENADAS POR IMPACTO');
console.log('   1. Destrabar Ray-Ban          → +$2.252.037/mes (63% de lo que hoy no cobrás)');
console.log('   2. Más modelos Oakley         → hoy tenés 8; con 30 serían +$1.700.000/mes');
console.log('   3. Tráfico propio a MELI      → IG y WhatsApp empujan la tasa de 0,05 a 0,12 sin gastar un peso\n');
