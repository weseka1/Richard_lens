/* carrito.js — carrito en localStorage con suscripción para React.
 * El checkout es por WhatsApp: un solo mensaje con todo el pedido. */
import { useEffect, useState } from 'react';

let items = [];
try { items = JSON.parse(localStorage.getItem('carrito') || '[]'); } catch {}
const subs = new Set();
const emitir = () => {
  try { localStorage.setItem('carrito', JSON.stringify(items)); } catch {}
  subs.forEach(f => f());
};

export function agregar(item) {
  const k = item.id + '|' + (item.sku || '');
  const ex = items.find(x => x.k === k);
  if (ex) ex.cant++;
  else items.push({ ...item, k, cant: 1 });
  emitir();
}
export function quitar(k) { items = items.filter(x => x.k !== k); emitir(); }
export function cambiar(k, delta) {
  const it = items.find(x => x.k === k);
  if (!it) return;
  it.cant = Math.max(1, it.cant + delta);
  emitir();
}
export function vaciar() { items = []; emitir(); }
export const total = () => items.reduce((a, x) => a + x.precio * x.cant, 0);
export const cantidad = () => items.reduce((a, x) => a + x.cant, 0);

export function useCarrito() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const f = () => setTick(t => t + 1);
    subs.add(f);
    return () => subs.delete(f);
  }, []);
  return { items, total: total(), cantidad: cantidad() };
}

/* precio de lista (el tachado): +20% redondeado a .900 — el ancla visual del descuento */
export function precioLista(precio) {
  return Math.round((precio * 1.2) / 1000) * 1000 - 100;
}
