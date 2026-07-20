import sharp from 'sharp';
const pares = [
  ['../../07_CATALOGO/imagenes/rb3025-l0205/01.jpg', '../app/public/img/tryon/rb3025-l0205.png'],
  ['../../07_CATALOGO/imagenes/rb2140-901/01.jpg', '../app/public/img/tryon/rb2140-901.png']
];
for (const [ent, sal] of pares) {
  const { data, info } = await sharp(ent).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const idx = (x, y) => (y * W + x) * 4;
  const esBlanco = i => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    return Math.max(r, g, b) - Math.min(r, g, b) < 14 && Math.min(r, g, b) > 232;
  };
  const visto = new Uint8Array(W * H);
  const cola = [];
  for (let x = 0; x < W; x++) cola.push([x, 0], [x, H - 1]);
  for (let y = 0; y < H; y++) cola.push([0, y], [W - 1, y]);
  while (cola.length) {
    const [x, y] = cola.pop();
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const p = y * W + x;
    if (visto[p]) continue;
    visto[p] = 1;
    const i = idx(x, y);
    if (!esBlanco(i)) continue;
    data[i + 3] = 0;
    cola.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  for (let paso = 0; paso < 2; paso++) {
    const marcar = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = idx(x, y);
      if (data[i + 3] === 0) continue;
      if ([idx(x+1,y),idx(x-1,y),idx(x,y+1),idx(x,y-1)].some(v => data[v + 3] === 0)) marcar.push(i);
    }
    for (const i of marcar) data[i + 3] = Math.min(data[i + 3], paso === 0 ? 90 : 180);
  }
  const buf = await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  await sharp(buf).trim({ threshold: 10 }).png().toFile(sal);
  console.log('OK', sal);
}
