/* Rentabilidad real de dropshipper — la cuenta que importa.
 *
 * Un dropshipper no vive del margen por unidad sino de la ROTACIÓN: cuánto
 * capital inmoviliza, cuántas veces lo da vuelta por mes y cuánto le deja
 * cada vuelta. Un producto de 27% de margen que rota 8 veces por mes hace
 * más plata que uno de 100% que rota una vez.
 *
 * Uso: node rentabilidad_dropshipper.mjs
 */

const DOLAR = 1545;
const IIBB = 0.035, IVA = 0.21, ENVIO = 7000;
const COM = { clasica: 0.155, premium: 0.28 };

const plata = n => '$' + Math.round(n).toLocaleString('es-AR');
const pct = n => n.toFixed(0) + '%';
const neto = (precio, costo, com) =>
  precio - precio * com - ENVIO - (precio - precio / (1 + IVA)) - precio * IIBB - costo;

/* Volumen estimado de búsqueda en MELI: Ray-Ban y Oakley son los que
 * mueven la aguja; el lujo vende poco pero deja mucho por unidad. */
const LINEAS = [
  { nombre: 'Ray-Ban clásico',  usd: 58,  precio: 245900, ventasMes: 25, nota: 'el más buscado, hoy BLOQUEADO' },
  { nombre: 'Ray-Ban Ferrari',  usd: 61,  precio: 257900, ventasMes: 12, nota: 'tu mejor histórico: 17 de 22 ventas' },
  { nombre: 'Oakley',           usd: 58,  precio: 245900, ventasMes: 15, nota: 'deportivo, mucha búsqueda, habilitado' },
  { nombre: 'Lujo (Versace…)',  usd: 110, precio: 449900, ventasMes: 4,  nota: 'poco volumen, mucho margen' }
];

console.log(`\n═══ RENTABILIDAD DE DROPSHIPPER — dólar ${plata(DOLAR)}\n`);
console.log('línea                 costo      precio     deja/venta   margen  ventas/mes   GANANCIA MES   capital inmovilizado');
console.log('─'.repeat(118));

let totalGanancia = 0, totalCapital = 0;
for (const l of LINEAS) {
  const costo = l.usd * DOLAR;
  const g = neto(l.precio, costo, COM.clasica);
  const gananciaMes = g * l.ventasMes;
  /* el dropshipper no stockea: solo inmoviliza mientras el proveedor
   * despacha, más o menos una semana por pedido */
  const capital = costo * Math.ceil(l.ventasMes / 4);
  totalGanancia += gananciaMes;
  totalCapital += capital;
  console.log(
    l.nombre.padEnd(20) +
    plata(costo).padStart(10) +
    plata(l.precio).padStart(11) +
    plata(g).padStart(13) +
    pct(g / l.precio * 100).padStart(9) +
    String(l.ventasMes).padStart(11) +
    plata(gananciaMes).padStart(16) +
    plata(capital).padStart(20)
  );
}
console.log('─'.repeat(118));
console.log(`${'TOTAL'.padEnd(20)}${''.padStart(43)}${''.padStart(11)}${plata(totalGanancia).padStart(16)}${plata(totalCapital).padStart(20)}`);

console.log(`\n═══ LO QUE IMPORTA DE VERDAD`);
const vueltas = totalGanancia / totalCapital;
console.log(`   Ganancia mensual:        ${plata(totalGanancia)}`);
console.log(`   Capital que necesitás:   ${plata(totalCapital)}`);
console.log(`   Retorno sobre capital:   ${pct(vueltas * 100)} POR MES`);
console.log(`   Tu plata se da vuelta:   ${(totalGanancia / totalCapital + 1).toFixed(1)} veces al mes\n`);

console.log('═══ EL COSTO DE TENER RAY-BAN BLOQUEADO');
const rb = LINEAS[0], rbf = LINEAS[1];
const perdido = neto(rb.precio, rb.usd * DOLAR, COM.clasica) * rb.ventasMes
              + neto(rbf.precio, rbf.usd * DOLAR, COM.clasica) * rbf.ventasMes;
console.log(`   Ray-Ban + Ferrari serían ${plata(perdido)} por mes.`);
console.log(`   Es ${pct(perdido / totalGanancia * 100)} de tu ganancia potencial, parada por el denylist.\n`);

console.log('═══ CUÁNTO NECESITÁS PARA $500.000 LIMPIOS POR DÍA');
for (const l of LINEAS) {
  const g = neto(l.precio, l.usd * DOLAR, COM.clasica);
  console.log(`   solo con ${l.nombre.padEnd(18)} → ${Math.ceil(500000 / g)} ventas por día (${plata(Math.ceil(500000 / g) * l.precio)} facturados)`);
}
console.log('');
