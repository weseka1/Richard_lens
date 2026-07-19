/* lib/api.js — helpers compartidos: API, plata, WhatsApp, tracking */

export const plata = n => '$' + Number(n || 0).toLocaleString('es-AR');

export async function api(ruta, metodo = 'GET', datos) {
  const r = await fetch('/api/' + ruta, {
    method: metodo,
    headers: datos ? { 'Content-Type': 'application/json' } : undefined,
    body: datos ? JSON.stringify(datos) : undefined
  });
  if (!r.ok) throw new Error(`API ${ruta} → ${r.status}`);
  return r.json();
}

export function track(tipo, detalle) {
  fetch('/api/eventos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo, detalle })
  }).catch(() => {});
}

export function linkWA(cfg, texto) {
  return `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(texto || 'Hola, vengo de la web de Richard Lens.')}`;
}

/* caches simples de módulo (una carga por sesión) */
let _config = null, _productos = null;
const _fotos = new Map();

export async function getConfig() {
  if (!_config) _config = api('config');
  return _config;
}
export async function getProductos() {
  if (!_productos) _productos = api('productos');
  return _productos;
}
export async function getFotos(codigo) {
  if (!_fotos.has(codigo)) _fotos.set(codigo, api('fotos/' + codigo).catch(() => []));
  return _fotos.get(codigo);
}
export function invalidarProductos() { _productos = null; }
