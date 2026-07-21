/* Deja las fotos listas para MercadoLibre.
 *
 * MELI pide 1200x1200 como mínimo para habilitar el zoom, y las fotos del
 * proveedor vienen de cualquier tamaño y muchas apaisadas. Acá las llevamos
 * a un cuadrado de 1200x1200 sobre fondo blanco SIN deformarlas: la gafa
 * mantiene su proporción y el resto se rellena de blanco, que es el estándar
 * de vidriera. Los originales no se tocan: la salida va a <carpeta>/meli/.
 *
 * Uso:  node preparar_fotos_meli.mjs [carpeta1 carpeta2 ...]
 *       sin argumentos procesa TODAS las carpetas marcadas fotos_ok
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const RAIZ = path.join(process.cwd(), '..', '..');
const FOTOS = path.join(RAIZ, '07_CATALOGO', 'imagenes');
const PRODUCTOS = path.join(RAIZ, '08_TIENDA_ONLINE', 'data', 'productos.json');
const LADO = 1200;

let objetivo = process.argv.slice(2);
if (!objetivo.length) {
  const prods = JSON.parse(fs.readFileSync(PRODUCTOS, 'utf8'));
  objetivo = [...new Set(prods.filter(p => p.fotos_ok && p.canal !== 'WEB').map(p => p.foto_codigo))];
  if (!objetivo.length) {
    console.log('No hay productos con fotos_ok. Marcalos en el panel o pasá carpetas por argumento.');
    process.exit(0);
  }
}

let hechas = 0, saltadas = 0;
for (const codigo of objetivo) {
  const dir = path.join(FOTOS, codigo);
  if (!fs.existsSync(dir)) { console.log(`  ${codigo}: no existe`); continue; }
  const salida = path.join(dir, 'meli');
  fs.mkdirSync(salida, { recursive: true });

  const files = fs.readdirSync(dir)
    .filter(f => /\.(jpe?g|png|webp)$/i.test(f) && !f.startsWith('_'))
    .sort();

  for (const f of files) {
    const destino = path.join(salida, f.replace(/\.(png|webp)$/i, '.jpg'));
    if (fs.existsSync(destino)) { saltadas++; continue; }
    try {
      await sharp(path.join(dir, f))
        .resize(LADO, LADO, {
          fit: 'contain',                              // nunca recorta ni deforma
          background: { r: 255, g: 255, b: 255 },      // vidriera blanca
          withoutEnlargement: false                    // las chicas se agrandan
        })
        .flatten({ background: { r: 255, g: 255, b: 255 } })  // PNG transparente → blanco
        .sharpen({ sigma: 0.6 })
        .jpeg({ quality: 90, mozjpeg: true })
        .toFile(destino);
      hechas++;
    } catch (e) {
      console.log(`  ${codigo}/${f}: ${e.message}`);
    }
  }
  console.log(`  ${codigo}: ${files.length} fotos`);
}

console.log(`\nListo: ${hechas} fotos generadas, ${saltadas} ya estaban.`);
console.log('Quedaron en 07_CATALOGO/imagenes/<modelo>/meli/ — la publicación las usa desde ahí.');
