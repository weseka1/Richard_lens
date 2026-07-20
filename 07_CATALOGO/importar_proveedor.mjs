// Importador del stock REAL del proveedor (sun-bh, dropshipping) → tienda.
// Flujo: bajar el xlsx del proveedor → convertirlo a proveedor_stock.csv → node importar_proveedor.mjs
// Agrupa los ~1900 SKUs de anteojos por MODELO con variantes (color/talle/estado)
// y regenera 08_TIENDA_ONLINE/data/productos.json SIN pisar precios/destacados ya cargados.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CSV = resolve(HERE, 'proveedor_stock.csv');
const FOTOS = resolve(HERE, 'imagenes');
const PRODUCTOS = resolve(HERE, '..', '08_TIENDA_ONLINE', 'data', 'productos.json');

const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// marca según categoría/modelo (el mayorista es Ray-Ban-céntrico)
function marcaDe(categoria, modelo) {
  const m = modelo.toLowerCase(), c = categoria.toUpperCase();
  if (c === 'MIU' || m.includes('miu')) return 'Miu Miu';
  if (c === 'LV' || m.startsWith('lv') || m.includes('vuitton') || m.includes('millonaire') || m.includes('millionaire')) return 'Louis Vuitton';
  if (c === 'OW' || m === 'ow' || m.includes('off-white') || m.includes('off white')) return 'Off-White';
  if (c === 'OS') return 'Oscar Wylee';
  if (c === 'SCUDERIA FERRARI') return 'Ray-Ban · Ferrari';
  return 'Ray-Ban';
}

const FORMA = {
  WAYFARER: 'wayfarer', AVIADOR: 'aviador', ROUND: 'redondo', SQUARE: 'cuadrado',
  CLUBMASTER: 'clubmaster', ERIKA: 'erika', CATS: 'cats', HEXAGONAL: 'hexagonal',
  HIGHSTREET: 'highstreet', BLAZE: 'blaze', OPTICAL: 'armazón recetado',
  'SCUDERIA FERRARI': 'ferrari', JUSTIN: 'justin', OLYMPIAN: 'olympian'
};

const filas = readFileSync(CSV, 'utf8').trim().split(/\r?\n/).slice(1)
  .map(l => l.split(';').map(x => x.trim()))
  .filter(c => c.length >= 8 && c[0])
  .map(([modelo, codigo, color, sku, talle, stock, categoria, producto]) =>
    ({ modelo, codigo, color, sku, talle, stock: stock.toUpperCase(), categoria, producto: producto.toUpperCase() }));

const anteojos = filas.filter(f => f.producto === 'ANTEOJOS');
console.log(`SKUs anteojos: ${anteojos.length} de ${filas.length} filas (indumentaria/relojes quedan fuera de la tienda)`);

// carpetas de fotos existentes, para matchear por número de modelo (ej "2140")
const carpetas = existsSync(FOTOS) ? readdirSync(FOTOS) : [];
function fotoPara(id, modelo) {
  if (carpetas.includes(id)) return id;
  const nums = modelo.match(/\d{4}/g) || [];
  for (const n of nums) {
    const hit = carpetas.find(c => c.includes(n.toLowerCase()));
    if (hit) return hit;
  }
  return id;
}

// productos existentes: conservar precio/destacado/descripcion que ya haya tocado Juani
const previos = existsSync(PRODUCTOS) ? JSON.parse(readFileSync(PRODUCTOS, 'utf8')) : [];
const previosPorId = Object.fromEntries(previos.map(p => [p.id, p]));

const grupos = new Map();
for (const f of anteojos) {
  const key = f.modelo;
  if (!grupos.has(key)) grupos.set(key, []);
  grupos.get(key).push(f);
}

const RANK = { 'STOCK': 0, 'POCO STOCK': 1, 'POR ENTRAR': 2, 'CONSULTAR': 3 };
const productos = [];
for (const [modelo, vars] of grupos) {
  const id = slug(modelo);
  const cat = vars[0].categoria;
  const marca = marcaDe(cat, modelo);
  const conStock = vars.filter(v => v.stock === 'STOCK' || v.stock === 'POCO STOCK');
  const previo = previosPorId[id] || {};
  const variantes = vars
    .sort((a, b) => (RANK[a.stock] ?? 9) - (RANK[b.stock] ?? 9))
    .map(v => ({ sku: v.sku, codigo: v.codigo, color: v.color, talle: v.talle, stock: v.stock }));
  productos.push({
    id,
    marca,
    modelo,
    codigo: vars[0].codigo,
    color: `${new Set(vars.map(v => v.color)).size} colores`,
    cristal: 'según variante',
    forma: FORMA[cat.toUpperCase()] || cat.toLowerCase(),
    material: previo.material || 'acetato/metal',
    genero: 'unisex',
    precio_web: previo.precio_web || 0,
    precio_ml: previo.precio_ml || 0,
    stock: conStock.length,
    costo_usd: previo.costo_usd || 0,
    canal: ['Louis Vuitton', 'Miu Miu', 'Off-White'].includes(marca) ? 'WEB' : (previo.canal || 'ML+WEB'),
    estado: conStock.length ? 'disponible' : 'a_pedido',
    destacado: previo.destacado || false,
    descripcion: previo.descripcion && !previo.descripcion.includes('Original, con garantía')
      ? previo.descripcion
      : `${marca} ${modelo}. ${new Set(vars.map(v => v.color)).size} combinaciones de color, 100% original con garantía doble.`,
    foto_codigo: fotoPara(id, modelo),
    variantes
  });
}

// los destacados de la home: los clásicos con más stock
const ORDEN_DESTAQUE = ['wayfarer classic', 'aviador classic', 'wayfarer espejado', 'round metal classic', 'erika 4171', 'clubmaster'];
productos.sort((a, b) => {
  const ia = ORDEN_DESTAQUE.findIndex(x => a.modelo.toLowerCase().includes(x));
  const ib = ORDEN_DESTAQUE.findIndex(x => b.modelo.toLowerCase().includes(x));
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || b.stock - a.stock;
});
productos.slice(0, 6).forEach(p => { p.destacado = true; });

// RICH 001 (línea propia) siempre al final, próximamente
productos.push(previosPorId['drop-001'] || {
  id: 'drop-001', marca: 'RICH', modelo: 'RICH 001', codigo: 'DROP 001', color: 'Negro humo',
  cristal: 'Polarizado UV400', forma: 'wayfarer', material: 'acetato', genero: 'unisex',
  precio_web: 0, precio_ml: 0, stock: 0, costo_usd: 0, canal: 'WEB', estado: 'proximamente',
  destacado: true, descripcion: 'La línea propia. Drop 001, edición numerada. El rich estaba en el nombre.',
  foto_codigo: 'drop-001', variantes: []
});

writeFileSync(PRODUCTOS, JSON.stringify(productos, null, 2), 'utf8');
const resumen = {};
for (const p of productos) resumen[p.marca] = (resumen[p.marca] || 0) + 1;
console.log(`LISTO: ${productos.length} productos → productos.json`);
console.log('Por marca:', JSON.stringify(resumen, null, 1));
console.log(`Con stock YA: ${productos.filter(p => p.estado === 'disponible').length} · A pedido: ${productos.filter(p => p.estado === 'a_pedido').length}`);
console.log(`Sin fotos todavía: ${productos.filter(p => !carpetas.includes(p.foto_codigo)).length} (muestran tile de marca hasta scrapear)`);
