/* Completa a 4 fotos los modelos que quedaron cortos.
 *
 * Después de que la auditoría descartó las fotos que no eran el modelo exacto,
 * 31 modelos quedaron con 2 o 3, y eso deja 150 publicaciones rankeando abajo.
 * El proveedor no las tiene y las de la competencia no se pueden usar.
 *
 * Así que se arman con lo que ya tenemos:
 *   90_detalle.jpg  recorte ampliado de la bisagra y el logo, sacado de una
 *                   foto que ya está publicada — es lo que el comprador busca
 *                   cuando quiere ver si el par es legítimo.
 *   91_ficha.jpg    qué incluye, protección, garantía y envío.
 *
 * La foto principal (00_) no se toca nunca: MELI la quiere producto puro sobre
 * blanco, sin texto ni marcos.
 *
 * Uso:  node completar_fotos.mjs [--dry] [carpeta1 carpeta2 ...]
 *       sin carpetas, procesa las que tengan menos de 4 fotos usables
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const RAIZ = path.join(import.meta.dirname, '..', '..');
const FOTOS = path.join(RAIZ, '07_CATALOGO', 'imagenes');
const PRODUCTOS = path.join(RAIZ, '08_TIENDA_ONLINE', 'data', 'productos.json');
const LADO = 1200;
const BLANCO = { r: 255, g: 255, b: 255 };

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const carpetas = args.filter(a => !a.startsWith('--'));

const usables = dir => {
  try {
    return fs.readdirSync(dir).filter(f => /\.(jpe?g|png|webp)$/i.test(f) && !f.startsWith('_'));
  } catch { return []; }
};

const escapar = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* "Standard (51-21-140)" → las medidas que el comprador necesita para saber
 * si le entran. Si no las tenemos, la ficha va sin esa línea. */
function medidas(producto) {
  for (const v of producto.variantes || []) {
    const m = /\((\d{2})\s*[-–]\s*(\d{2})(?:\s*[-–]\s*(\d{2,3}))?\s*\)/.exec(String(v.talle || ''));
    if (m) return `Lente ${m[1]} mm · Puente ${m[2]} mm${m[3] ? ` · Varilla ${m[3]} mm` : ''}`;
  }
  return null;
}

/* Recorte ampliado: primero se le saca el blanco de alrededor para saber dónde
 * está realmente la gafa, y después se agranda la zona de la bisagra. */
async function detalle(origen, destino) {
  const rec = await sharp(origen).trim({ threshold: 12 }).toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = rec.info;
  if (W < 200 || H < 120) throw new Error('foto demasiado chica para ampliar');

  const w = Math.round(W * 0.62);
  const h = Math.round(H * 0.92);
  const recorte = await sharp(rec.data)
    .extract({ left: Math.round(W * 0.02), top: Math.round((H - h) / 2), width: w, height: h })
    // el producto va con aire alrededor: pegado al borde MELI lo ve como recorte
    .resize(Math.round(LADO * 0.82), Math.round(LADO * 0.82), { fit: 'inside', background: BLANCO })
    .sharpen({ sigma: 0.8 })
    .toBuffer({ resolveWithObject: true });

  const { width: rw, height: rh } = recorte.info;
  await sharp(recorte.data)
    .extend({
      top: Math.floor((LADO - rh) / 2), bottom: Math.ceil((LADO - rh) / 2),
      left: Math.floor((LADO - rw) / 2), right: Math.ceil((LADO - rw) / 2),
      background: BLANCO
    })
    .flatten({ background: BLANCO })
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(destino);
}

async function ficha(producto, destino) {
  const marca = String(producto.marca || '').split(' · ')[0];
  const med = medidas(producto);
  const puntos = [
    'Estuche rígido y paño incluidos',
    'Protección UV400',
    'Garantía 30 días',
    'Envío a todo el país',
  ];
  if (med) puntos.unshift(med);

  // el tilde va dibujado, no como emoji: en la vidriera de MELI se ve prolijo
  // la lista arranca bien debajo del modelo: pegada, el primer tilde lo pisaba
  const fila = (txt, i) => `
    <path d="M 150 ${466 + i * 108} l 26 26 l 46 -54" fill="none" stroke="#111" stroke-width="9"
          stroke-linecap="round" stroke-linejoin="round"/>
    <text x="258" y="${484 + i * 108}" font-family="Arial, Helvetica, sans-serif"
          font-size="${txt.length > 34 ? 34 : 42}" fill="#111">${escapar(txt)}</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${LADO}" height="${LADO}">
    <rect width="${LADO}" height="${LADO}" fill="#fff"/>
    <text x="150" y="175" font-family="Arial, Helvetica, sans-serif" font-size="34"
          letter-spacing="10" fill="#111">RICHARD LENS</text>
    <line x1="150" y1="215" x2="1050" y2="215" stroke="#111" stroke-width="3"/>
    <text x="150" y="290" font-family="Arial, Helvetica, sans-serif" font-size="56"
          font-weight="bold" fill="#111">${escapar(marca)}</text>
    <text x="150" y="345" font-family="Arial, Helvetica, sans-serif" font-size="38"
          fill="#555">${escapar(producto.modelo || '')}</text>
    ${puntos.map(fila).join('')}
    <line x1="150" y1="990" x2="1050" y2="990" stroke="#ddd" stroke-width="2"/>
    <text x="150" y="1050" font-family="Arial, Helvetica, sans-serif" font-size="30"
          fill="#777">Producto nuevo · Factura A o B</text>
  </svg>`;

  await sharp(Buffer.from(svg)).jpeg({ quality: 92, mozjpeg: true }).toFile(destino);
}

const productos = JSON.parse(fs.readFileSync(PRODUCTOS, 'utf8'));
const objetivo = carpetas.length
  ? productos.filter(p => carpetas.includes(p.foto_codigo))
  : productos.filter(p => p.foto_codigo && usables(path.join(FOTOS, p.foto_codigo)).length > 0
    && usables(path.join(FOTOS, p.foto_codigo)).length < 4);

console.log(`\n${objetivo.length} modelos para completar${dry ? ' (SIMULACIÓN)' : ''}\n`);

let hechas = 0, fallos = 0;
for (const p of objetivo) {
  const dir = path.join(FOTOS, p.foto_codigo);
  const files = usables(dir).sort();
  // para el detalle conviene una foto que no sea la principal: así el comprador
  // ve un ángulo nuevo y no el mismo recorte de la portada
  const fuente = files.find(f => !f.startsWith('00_')) || files[0];

  if (dry) { console.log(`  ${p.foto_codigo}: ${files.length} fotos → detalle desde ${fuente} + ficha`); hechas++; continue; }

  try {
    await detalle(path.join(dir, fuente), path.join(dir, '90_detalle.jpg'));
    await ficha(p, path.join(dir, '91_ficha.jpg'));
    hechas++;
    console.log(`  ✓ ${p.foto_codigo}: ${files.length} → ${files.length + 2} fotos`);
  } catch (e) {
    fallos++;
    console.log(`  ✗ ${p.foto_codigo}: ${e.message}`);
  }
}

console.log(`\n${hechas} completados · ${fallos} fallaron.`);
if (!dry) console.log('Ahora: node preparar_fotos_meli.mjs   y después   node ../../07_CATALOGO/fotos_meli.mjs\n');
