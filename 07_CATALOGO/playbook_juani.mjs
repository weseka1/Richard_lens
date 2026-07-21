/* El playbook de Juani, sacado de sus propias 80 publicaciones anteriores.
 *
 * Lo que enseñan sus 22 ventas reales:
 *   1. FERRARI manda: 17 de 22 ventas (77%) con solo 23 publicaciones.
 *      Wayfarer y Round vendieron CERO. Eso contradice la intuición
 *      "publicá los clásicos" — los datos mandan.
 *   2. Escalera de 5 precios por modelo: vendió en varios escalones a la vez.
 *      No es duplicar por duplicar, es cubrir toda la banda de búsqueda.
 *   3. Stock declarado alto (promedio 27), no conservador.
 *
 * Lo que hay que corregir: sus precios ganadores fueron $130k-$170k, y HOY
 * ese rango está por debajo de su costo. La inflación se los comió. La
 * estructura se replica, los números se actualizan.
 */

const DOLAR = 1545;
const COSTO = { clasico: 58 * DOLAR, ferrari: 61 * DOLAR };
const MELI = 0.155, IIBB = 0.035, IVA = 0.21, ENVIO = 7000;

const plata = n => '$' + Math.round(n).toLocaleString('es-AR');
const bolsillo = (p, costo) => p - p * MELI - ENVIO - (p - p / (1 + IVA)) - p * IIBB - costo;
const piso = costo => (costo + ENVIO) / (1 - MELI - IIBB - IVA / (1 + IVA));

/* La escalera: 5 precios por modelo, como hacía él. El más bajo apenas
 * arriba del piso (gana la búsqueda por precio), el más alto para el que
 * compra por confianza. */
const ESCALERA = [1.28, 1.45, 1.62, 1.82, 2.05];   // multiplicadores sobre el piso

const SUFIJOS = [
  'Originales Italy',
  'Con Estuche Original',
  'Garantia Oficial',
  'Envio Gratis',
  'Polarizados Uv400'
];

console.log('\n═══ PLAYBOOK RICHARD LENS — replicando lo que YA te funcionó\n');

for (const [tipo, costo] of Object.entries(COSTO)) {
  const pisoReal = piso(costo);
  console.log(`━━ ${tipo.toUpperCase()}  (costo ${plata(costo)} · piso ${plata(pisoReal)})`);
  ESCALERA.forEach((m, i) => {
    const precio = Math.round(pisoReal * m / 1000) * 1000 - 100;
    const g = bolsillo(precio, costo);
    console.log(`   #${i + 1} ${plata(precio).padStart(10)} → bolsillo ${plata(g).padStart(9)}   "${SUFIJOS[i]}"`);
  });
  console.log('');
}

console.log('═══ COMPARACIÓN CON TUS PRECIOS DE ANTES');
console.log('   Vendías a $130.000-$170.000 y funcionaba.');
console.log(`   Hoy tu piso Ferrari es ${plata(piso(COSTO.ferrari))}: a $150.000 PERDÉS ${plata(-bolsillo(150000, COSTO.ferrari))} por venta.`);
console.log('   Misma estrategia, números actualizados.\n');

const pisoF = piso(COSTO.ferrari);
const medio = Math.round(pisoF * 1.62 / 1000) * 1000 - 100;
const gMedio = bolsillo(medio, COSTO.ferrari);
console.log('═══ CAMINO A $2.000.000 DE FACTURACIÓN');
console.log(`   ${Math.ceil(2000000 / medio)} ventas al escalón medio (${plata(medio)}) → ${plata(Math.ceil(2000000 / medio) * gMedio)} en el bolsillo`);
console.log(`   Con 6 modelos Ferrari × 5 publicaciones = 30 publicaciones cubriendo toda la banda.\n`);
