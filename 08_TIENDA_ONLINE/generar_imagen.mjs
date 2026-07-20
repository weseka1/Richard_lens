// Generador de imágenes con nano-banana (Gemini image API) — assets de marca RICHARD LENS.
//
// Setup (1 vez): key GRATIS en https://aistudio.google.com/apikey
//   $env:GEMINI_API_KEY = "AIza..."
//
// Uso:
//   node generar_imagen.mjs                        → genera el modelo RICH del hero (rich-hero.png)
//   node generar_imagen.mjs "tu prompt" salida.png → genera lo que quieras
//
// Después del hero: cd app && npm run build (para que entre al dist).
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const KEY = process.env.GEMINI_API_KEY;
if (!KEY) {
  console.error('Falta GEMINI_API_KEY. Sacala gratis en https://aistudio.google.com/apikey y corré:\n  $env:GEMINI_API_KEY = "AIza..."');
  process.exit(1);
}

const PROMPT_HERO = `Fashion editorial photo, waist-up portrait of an original fictional young Argentine trap artist
(NOT any real celebrity), pointing his index finger directly at the camera with confident attitude,
wearing large black wraparound sunglasses (eyes fully covered), one gold tooth visible in a slight open smile,
braided hair, small diamond earrings, thick gold cuban chain, dark pinstripe suit over bare chest.
Plain solid light-grey studio background for easy cutout, dramatic studio lighting, sharp focus,
shot on 85mm lens, high fashion magazine quality. No brand logos anywhere.`;

const prompt = process.argv[2] || PROMPT_HERO;
const salida = resolve(HERE, process.argv[3] || 'app/public/img/rich-hero.png');

const MODELOS = ['gemini-2.5-flash-image', 'gemini-2.0-flash-preview-image-generation'];

let listo = false;
for (const modelo of MODELOS) {
  console.log(`Generando con ${modelo}…`);
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
    })
  });
  const j = await r.json();
  if (!r.ok) { console.log(`  ${modelo}: ${j.error?.message || r.status}`); continue; }
  const img = j.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData;
  if (!img) { console.log(`  ${modelo}: respondió sin imagen`); continue; }
  writeFileSync(salida, Buffer.from(img.data, 'base64'));
  console.log(`LISTO → ${salida}`);
  listo = true;
  break;
}
if (!listo) {
  console.error('Ningún modelo devolvió imagen. Probá de nuevo en unos minutos o revisá la key.');
  process.exit(1);
}
console.log('Siguiente paso: cd app && npm run build  (y refrescar la tienda)');
