import sharp from 'sharp';

const src = 'c:/Users/46094/Desktop/WESEKA_IA_STRUCTURE/E-commerce/RICHARD LENS/GAFAS DISEÑADOR.jpeg';
const out = 'c:/Users/46094/Desktop/WESEKA_IA_STRUCTURE/E-commerce/RICHARD LENS/08_TIENDA_ONLINE/app/public/img/cat-disenador.jpg';

await sharp(src)
  .resize({ width: 900, withoutEnlargement: true })
  .sharpen({ sigma: 0.8 })
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(out);

console.log('cat-disenador.jpg listo');
