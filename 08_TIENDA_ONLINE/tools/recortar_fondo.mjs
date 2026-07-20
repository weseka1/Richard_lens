// Recorta el fondo gris uniforme de una foto de estudio → PNG con transparencia.
// Flood-fill desde los bordes: solo borra el gris CONECTADO al borde (no toca grises del sujeto).
// Uso: node recortar_fondo.mjs [entrada] [salida]
import sharp from 'sharp';
import { resolve } from 'node:path';

const entrada = resolve(process.argv[2] || 'rich-hero-original.png');
const salida = resolve(process.argv[3] || '../app/public/img/rich-hero.png');

const { data, info } = await sharp(entrada).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;

const idx = (x, y) => (y * W + x) * 4;
const esFondo = i => {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return (max - min) < 26 && min > 120 && max < 250; // gris claro, poco saturado
};

// BFS desde todos los píxeles del borde
const visitado = new Uint8Array(W * H);
const cola = [];
for (let x = 0; x < W; x++) { cola.push([x, 0], [x, H - 1]); }
for (let y = 0; y < H; y++) { cola.push([0, y], [W - 1, y]); }
let borrados = 0;
while (cola.length) {
  const [x, y] = cola.pop();
  if (x < 0 || y < 0 || x >= W || y >= H) continue;
  const p = y * W + x;
  if (visitado[p]) continue;
  visitado[p] = 1;
  const i = idx(x, y);
  if (!esFondo(i)) continue;
  data[i + 3] = 0; borrados++;
  cola.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
}

// suavizado de borde: 2 pasadas de semitransparencia en la frontera
for (let paso = 0; paso < 2; paso++) {
  const marcar = [];
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = idx(x, y);
      if (data[i + 3] === 0) continue;
      const vecinos = [idx(x + 1, y), idx(x - 1, y), idx(x, y + 1), idx(x, y - 1)];
      if (vecinos.some(v => data[v + 3] === 0)) marcar.push(i);
    }
  }
  for (const i of marcar) data[i + 3] = Math.min(data[i + 3], paso === 0 ? 90 : 180);
}

await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toFile(salida);
console.log(`Recorte listo: ${borrados.toLocaleString()} px de fondo borrados (${Math.round(borrados / (W * H) * 100)}%) → ${salida}`);
