import sharp from 'sharp';
const ent = 'C:/Users/46094/Downloads/Gemini_Generated_Image_bwvs92bwvs92bwvs.png';
const m = await sharp(ent).metadata();
const alto = m.height;
const ancho = Math.round(alto * 0.84);            // el aspect del tile
const centro = Math.round(m.width * 0.56);        // la modelo está apenas a la derecha del centro
const left = Math.max(0, Math.min(m.width - ancho, centro - Math.round(ancho / 2)));
await sharp(ent).extract({ left, top: 0, width: ancho, height: alto })
  .resize({ width: 800 }).jpeg({ quality: 84 })
  .toFile('../app/public/img/cat-mujer-estudio.jpg');
console.log('OK cat-mujer-estudio.jpg ' + ancho + 'x' + alto + ' desde x=' + left);
