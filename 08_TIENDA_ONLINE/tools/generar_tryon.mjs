import sharp from 'sharp';
import { readdirSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const FOTOS = resolve('../../07_CATALOGO/imagenes');
const OUT = resolve('../app/public/img/tryon');
mkdirSync(OUT, { recursive: true });
let ok = 0, fail = 0, skip = 0;
for (const dir of readdirSync(FOTOS)) {
  const destino = resolve(OUT, dir + '.png');
  if (existsSync(destino)) { skip++; continue; }
  const archivos = readdirSync(resolve(FOTOS, dir)).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort();
  if (!archivos.length) continue;
  try {
    // achicar ANTES de procesar: 900px alcanza para try-on y no explota la memoria
    const { data, info } = await sharp(resolve(FOTOS, dir, archivos[0]))
      .resize({ width: 900, withoutEnlargement: true }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: W, height: H } = info;
    const esBlanco = i => Math.max(data[i], data[i+1], data[i+2]) - Math.min(data[i], data[i+1], data[i+2]) < 14 && Math.min(data[i], data[i+1], data[i+2]) > 230;
    const visto = new Uint8Array(W * H);
    const pila = new Int32Array(W * H);
    let tope = 0;
    const push = p => { if (!visto[p]) { visto[p] = 1; pila[tope++] = p; } };
    for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
    for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
    let borrados = 0;
    while (tope > 0) {
      const p = pila[--tope];
      const i = p * 4;
      if (!esBlanco(i)) continue;
      data[i + 3] = 0; borrados++;
      const x = p % W, y = (p / W) | 0;
      if (x + 1 < W) push(p + 1);
      if (x > 0) push(p - 1);
      if (y + 1 < H) push(p + W);
      if (y > 0) push(p - W);
    }
    if (borrados / (W * H) < 0.25) { fail++; continue; }
    const buf = await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
    await sharp(buf).trim({ threshold: 10 }).png().toFile(destino);
    ok++;
  } catch { fail++; }
}
console.log(`TRY-ON: ${ok} nuevos, ${skip} ya existian, ${fail} sin fondo blanco utilizable`);
