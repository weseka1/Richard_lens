/* Revisa la tienda como la ve un celular de verdad y dice qué se desborda.
 *
 * "Se desamolda", "se descentraliza", "se superpone": todo eso es un elemento
 * más ancho que la pantalla. A ojo no se encuentra; midiendo, sí. Acá se abre
 * cada pantalla en un iPhone emulado y se lista QUÉ elemento sobresale.
 *
 * Uso: node revisar_movil.mjs [ancho]     (por defecto 375, el iPhone SE)
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env.RL_URL || 'http://localhost:5250';
const ANCHO = Number(process.argv[2]) || 375;
const SALIDA = process.env.RL_CAPTURAS || path.join(process.env.TEMP || '.', 'capturas-rl');

const PANTALLAS = [
  ['home', '/'],
  ['catalogo', '/catalogo'],
  ['producto', null],   // se completa con un producto real
];

fs.mkdirSync(SALIDA, { recursive: true });

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});

const pagina = await navegador.newPage();
await pagina.setViewport({ width: ANCHO, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await pagina.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');

// un producto real para la ficha
try {
  const ps = await (await fetch(`${BASE}/api/productos`)).json();
  const p = ps.find(x => x.estado === 'disponible' && x.precio_web > 0) || ps[0];
  PANTALLAS[2][1] = '/producto/' + p.id;
} catch { PANTALLAS.pop(); }

const errores = [];
pagina.on('pageerror', e => errores.push(String(e).slice(0, 160)));
pagina.on('console', m => { if (m.type() === 'error') errores.push(m.text().slice(0, 160)); });

console.log(`\nRevisando a ${ANCHO}px de ancho\n`);

for (const [nombre, ruta] of PANTALLAS) {
  if (!ruta) continue;
  errores.length = 0;
  await pagina.goto(BASE + ruta, { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise(r => setTimeout(r, 2500));   // que terminen las animaciones de entrada

  const informe = await pagina.evaluate(w => {
    const doc = document.documentElement;
    const desbordan = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const est = getComputedStyle(el);
      if (est.position === 'fixed' && r.left >= w) continue;  // menús cerrados fuera de pantalla
      if (r.right > w + 1 || r.left < -1) {
        desbordan.push({
          tag: el.tagName.toLowerCase(),
          clase: (el.className && typeof el.className === 'string' ? el.className : '').slice(0, 60),
          izq: Math.round(r.left), der: Math.round(r.right), ancho: Math.round(r.width),
          texto: (el.textContent || '').trim().slice(0, 40),
        });
      }
    }
    // solo los de más afuera: si un padre desborda, los hijos también y ensucian
    const raiz = desbordan.filter(d => !desbordan.some(o => o !== d && o.izq <= d.izq && o.der >= d.der && o.ancho > d.ancho));
    return {
      anchoDocumento: doc.scrollWidth,
      scrollHorizontal: doc.scrollWidth > w,
      alto: doc.scrollHeight,
      desbordan: raiz.slice(0, 12),
      total: desbordan.length,
    };
  }, ANCHO);

  console.log(`── ${nombre}  (${ruta})`);
  console.log(`   documento: ${informe.anchoDocumento}px de ancho${informe.scrollHorizontal ? '  ⚠ SE VA PARA EL COSTADO' : '  ✓ entra'}`);
  if (informe.desbordan.length) {
    console.log(`   ${informe.total} elementos sobresalen; los de más afuera:`);
    for (const d of informe.desbordan) {
      console.log(`     ${String(d.izq).padStart(5)}→${String(d.der).padStart(5)}  ${d.tag}.${d.clase}  ${d.texto ? '«' + d.texto + '»' : ''}`);
    }
  }
  if (errores.length) console.log(`   errores de consola: ${[...new Set(errores)].slice(0, 4).join(' | ')}`);

  await pagina.screenshot({ path: path.join(SALIDA, `${nombre}-${ANCHO}.png`), fullPage: false });
  await pagina.screenshot({ path: path.join(SALIDA, `${nombre}-${ANCHO}-completa.png`), fullPage: true });
  console.log('');
}

await navegador.close();
console.log(`Capturas en ${SALIDA}\n`);
