/* Calculadora REAL de rentabilidad MELI — plata que entra al bolsillo.
 *
 * Descuenta TODO: costo del producto, comisión MELI, envío, IVA e Ingresos Brutos.
 * Ojo con el IVA: si el producto entra sin factura (dropshipping informal) NO hay
 * crédito fiscal, así que el IVA se paga sobre la venta ENTERA, no sobre el margen.
 * Ese es el agujero más caro del negocio — está modelado abajo en los dos escenarios.
 *
 * Uso: node calculadora_meli.mjs [dolar] [objetivoNetoDiario]
 */

const DOLAR = Number(process.argv[2]) || 1540;
const OBJETIVO = Number(process.argv[3]) || 500000;

const MELI = 0.155;     // comisión que cobra MELI
const IIBB = 0.035;     // Ingresos Brutos Buenos Aires (retención + saldo)
const IVA = 0.21;
const ENVIO = 7000;     // envío gratis que absorbe el vendedor

const plata = n => '$' + Math.round(n).toLocaleString('es-AR');
const redondear = n => Math.round(n / 1000) * 1000 - 100;

/* Sin crédito fiscal: el IVA débito se paga completo sobre la venta.
 * Con crédito fiscal (importás con factura): solo pagás IVA sobre el valor agregado. */
function neto(precio, costoArs, conCredito) {
  const ivaDebito = precio - precio / (1 + IVA);
  const ivaCredito = conCredito ? costoArs - costoArs / (1 + IVA) : 0;
  const ivaPagar = ivaDebito - ivaCredito;
  return precio - precio * MELI - ENVIO - ivaPagar - precio * IIBB - costoArs;
}

const MODELOS = [
  { tipo: 'Clásicos', usd: 58 },
  { tipo: 'Ferrari / Polarizados', usd: 63 }
];
const ESCALONES = [
  { nombre: 'BAJO ', mult: 1.85 },
  { nombre: 'MEDIO', mult: 2.55 },
  { nombre: 'ALTO ', mult: 3.20 }
];

console.log(`\n═══ Dólar ${plata(DOLAR)} · MELI ${MELI * 100}% · IIBB ${IIBB * 100}% · IVA ${IVA * 100}% · envío ${plata(ENVIO)}`);
console.log(`═══ Objetivo: ${plata(OBJETIVO)} POR DÍA en el bolsillo\n`);

for (const m of MODELOS) {
  const costoArs = m.usd * DOLAR;
  console.log(`━━━ ${m.tipo} — ${m.usd} USD = ${plata(costoArs)}`);
  for (const e of ESCALONES) {
    const precio = redondear(costoArs * e.mult);
    const sinCred = neto(precio, costoArs, false);
    const conCred = neto(precio, costoArs, true);
    const ventas = sinCred > 0 ? Math.ceil(OBJETIVO / sinCred) : Infinity;
    console.log(
      `  ${e.nombre} ${plata(precio).padStart(9)} → bolsillo ${plata(sinCred).padStart(9)}` +
      `  (con factura: ${plata(conCred)})` +
      `  ${ventas === Infinity ? 'PIERDE PLATA' : `necesitás ${ventas} ventas/día`}`
    );
  }
  // piso real: abajo de esto trabajás gratis
  const piso = (costoArs + ENVIO) / (1 - MELI - IIBB - IVA / (1 + IVA));
  console.log(`  ⚠ PISO REAL con impuestos: ${plata(piso)}\n`);
}

/* cuánto hay que facturar para meterse OBJETIVO en el bolsillo */
console.log('─── Para llevarte ' + plata(OBJETIVO) + ' por día:');
for (const e of ESCALONES) {
  const costoArs = 58 * DOLAR;
  const precio = redondear(costoArs * e.mult);
  const g = neto(precio, costoArs, false);
  if (g <= 0) continue;
  const n = OBJETIVO / g;
  console.log(`  ${e.nombre} → ${n.toFixed(1)} ventas/día · facturás ${plata(n * precio)}/día · ${plata(n * precio * 30)}/mes`);
}

console.log('\n─── Escenario 72 h (facturación bruta, que es lo alcanzable de entrada):');
const costoArs = 58 * DOLAR;
const medio = redondear(costoArs * 2.55);
for (const bruto of [500000, 1000000]) {
  const n = bruto / medio;
  console.log(`  ${plata(bruto)} brutos/día = ${n.toFixed(1)} ventas · bolsillo real ${plata(n * neto(medio, costoArs, false))}/día`);
}
console.log('');
