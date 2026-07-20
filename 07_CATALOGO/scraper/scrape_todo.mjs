// Scrapeo MASIVO: fotos para TODOS los productos de la tienda (productos.json).
// Mismo motor DDG que scrape_imagenes.mjs; corre horas en background y es re-ejecutable
// (saltea lo que ya tiene ≥3 fotos). Las fotos quedan en imagenes/<id>/ — el mismo
// almacén que usa la web (/fotos/...) y el publicador de MercadoLibre.
import { readFileSync, mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUTROOT = resolve(HERE, '..', 'imagenes');
const PRODUCTOS = resolve(HERE, '..', '..', '08_TIENDA_ONLINE', 'data', 'productos.json');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const MAX = 6, MIN_BYTES = 40_000;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const productos = JSON.parse(readFileSync(PRODUCTOS, 'utf8'))
  .filter(p => p.marca !== 'RICH');

async function buscarDDG(query) {
  try {
    const r1 = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`, { headers: { 'User-Agent': UA } });
    const vqd = ((await r1.text()).match(/vqd=([\d-]+)/) || [])[1];
    if (!vqd) return [];
    const r2 = await fetch(`https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}`,
      { headers: { 'User-Agent': UA, 'Referer': 'https://duckduckgo.com/' } });
    if (!r2.ok) return [];
    const j = await r2.json();
    return [...new Set((j.results || []).map(x => x.image).filter(u => /^https?:/.test(u)))].slice(0, 25);
  } catch { return []; }
}

async function descargar(u, destino) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(u, { headers: { 'User-Agent': UA }, signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < MIN_BYTES) return false;
    writeFileSync(destino, buf);
    return true;
  } catch { return false; }
}

let hechos = 0, salteados = 0, sinFotos = [];
for (const p of productos) {
  const dir = resolve(OUTROOT, p.id);
  mkdirSync(dir, { recursive: true });
  if (readdirSync(dir).length >= 3) { salteados++; continue; }
  const marca = p.marca.split(' · ')[0];
  const query = `${marca} ${p.modelo} sunglasses`;
  const urls = await buscarDDG(query);
  let ok = 0;
  for (const u of urls) {
    if (ok >= MAX) break;
    const ext = (u.match(/\.(jpe?g|png|webp)/i)?.[1] || 'jpg').toLowerCase().replace('jpeg', 'jpg');
    if (await descargar(u, resolve(dir, `${String(ok + 1).padStart(2, '0')}.${ext}`))) ok++;
    await sleep(300);
  }
  if (ok === 0) sinFotos.push(p.id);
  hechos++;
  console.log(`[${hechos + salteados}/${productos.length}] ${p.marca} ${p.modelo}: ${ok} fotos`);
  await sleep(1200);
}
console.log(`\nCOMPLETO. Nuevos: ${hechos} · Ya tenían: ${salteados} · Sin resultados: ${sinFotos.length}`);
if (sinFotos.length) console.log('Sin fotos:', sinFotos.join(', '));
