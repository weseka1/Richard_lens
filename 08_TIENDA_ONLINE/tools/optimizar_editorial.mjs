import sharp from 'sharp';
const B = 'C:/Users/46094/Desktop/WESEKA_IA_STRUCTURE/E-commerce/RICHARD LENS/drive-download-20260720T191953Z-1-001/';
await sharp(B + 'IMG_5304.PNG').resize({ width: 1200 }).jpeg({ quality: 84 }).toFile('../app/public/img/hero-editorial.jpg');
await sharp(B + 'IMG_5304.PNG').resize({ width: 800 }).jpeg({ quality: 82 }).toFile('../app/public/img/cat-hombre.jpg');
await sharp(B + 'IMG_5299.PNG').resize({ width: 800 }).jpeg({ quality: 82 }).toFile('../app/public/img/cat-mujer.jpg');
console.log('OK 3 imagenes optimizadas');
