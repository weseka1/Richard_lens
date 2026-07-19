// Scraper de imágenes de producto por SKU (Bing Images, sin browser)
// Uso: node scrape_imagenes.mjs [filtro-de-codigo]
import { readFileSync, mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BASE = resolve(HERE, '..');
const CSV = resolve(BASE, 'STOCK.csv');
const OUTROOT = resolve(BASE, 'imagenes');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const MAX_POR_MODELO = 6;
const MIN_BYTES = 40_000;

const filtro = process.argv[2]?.toLowerCase();
const rows = readFileSync(CSV, 'utf8').trim().split(/\r?\n/).slice(1)
  .map(l => l.split(';'))
  .filter(c => c.length >= 11 && !c[0].toLowerCase().includes('ejemplo'))
  .filter(c => !filtro || c[2].toLowerCase().includes(filtro));

const slug = s => s.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function buscarDDG(query) {
  const r1 = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
    { headers: { 'User-Agent': UA } });
  const vqd = ((await r1.text()).match(/vqd=([\d-]+)/) || [])[1];
  if (!vqd) return [];
  const r2 = await fetch(`https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}`,
    { headers: { 'User-Agent': UA, 'Referer': 'https://duckduckgo.com/' } });
  if (!r2.ok) return [];
  const j = await r2.json();
  return [...new Set((j.results || []).map(x => x.image).filter(u => /^https?:/.test(u)))].slice(0, 25);
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

for (const c of rows) {
  const [modelo, marca, codigo, , , , , , , , query] = c;
  const dir = resolve(OUTROOT, slug(codigo));
  mkdirSync(dir, { recursive: true });
  const yaTiene = readdirSync(dir).length;
  if (yaTiene >= 3) { console.log(`SKIP ${codigo} (ya tiene ${yaTiene} fotos)`); continue; }
  console.log(`Buscando: ${marca} ${modelo} [${query}]`);
  const urls = await buscarDDG(query);
  let ok = 0;
  for (const u of urls) {
    if (ok >= MAX_POR_MODELO) break;
    const ext = (u.match(/\.(jpe?g|png|webp)/i)?.[1] || 'jpg').toLowerCase().replace('jpeg', 'jpg');
    if (await descargar(u, resolve(dir, `${String(ok + 1).padStart(2, '0')}.${ext}`))) { ok++; process.stdout.write('.'); }
    await sleep(300);
  }
  console.log(` ${codigo}: ${ok} imágenes → imagenes/${slug(codigo)}/`);
  await sleep(1000);
}
console.log('SCRAPE COMPLETO. Revisar carpetas y borrar las fotos malas (quedarse con las 3 mejores).');
