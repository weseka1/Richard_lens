// STOCK.csv → 02_DEMO_WEB/catalogo.js (+ copia fotos a 02_DEMO_WEB/assets/catalogo/<slug>/)
// Uso: node build_catalogo.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const IMGROOT = resolve(HERE, 'imagenes');
const WEB = resolve(HERE, '..', '02_DEMO_WEB');
const WEBIMG = resolve(WEB, 'assets', 'catalogo');
const MAX_FOTOS = 3;

const slug = s => s.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
const precio = v => { const n = parseInt(v, 10); return isNaN(n) || n <= 0 ? null : n; };

const rows = readFileSync(resolve(HERE, 'STOCK.csv'), 'utf8').trim().split(/\r?\n/).slice(1)
  .map(l => l.split(';'))
  .filter(c => c.length >= 11 && !c[0].toLowerCase().includes('ejemplo'));

const catalogo = [];
for (const c of rows) {
  const [modelo, marca, codigo, color, cristal, cantidad, costo_usd, precio_ml, precio_web, canal] = c.map(x => x.trim());
  const s = slug(codigo);
  const srcDir = resolve(IMGROOT, s);
  const fotos = [];
  if (existsSync(srcDir)) {
    const files = readdirSync(srcDir).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort().slice(0, MAX_FOTOS);
    if (files.length) {
      mkdirSync(resolve(WEBIMG, s), { recursive: true });
      for (const f of files) {
        copyFileSync(resolve(srcDir, f), resolve(WEBIMG, s, f));
        fotos.push(`assets/catalogo/${s}/${f}`);
      }
    }
  }
  catalogo.push({
    modelo, marca, codigo, color, cristal,
    stock: parseInt(cantidad, 10) || 0,
    precioWeb: precio(precio_web),
    lux: canal.toUpperCase() === 'WEB' && marca.toLowerCase() !== 'ray-ban' && marca.toLowerCase() !== 'rich',
    fotos,
  });
}

writeFileSync(resolve(WEB, 'catalogo.js'),
  '// Generado por 07_CATALOGO/build_catalogo.mjs — NO editar a mano\n' +
  'window.CATALOGO = ' + JSON.stringify(catalogo, null, 2) + ';\n');
console.log(`catalogo.js generado: ${catalogo.length} modelos, ${catalogo.reduce((a, p) => a + p.fotos.length, 0)} fotos copiadas`);
