import React from 'react';
import { useCarrito, quitar, cambiar, vaciar } from '../lib/carrito.js';
import { plata, linkWA, track } from '../lib/api.js';

/* El carrito: drawer lateral. El "checkout" arma UN mensaje de WhatsApp con todo el pedido. */
export default function CartDrawer({ cfg, abierto, onCerrar }) {
  const { items, total } = useCarrito();

  function pedirPorWA() {
    if (!items.length || !cfg) return;
    const lineas = items.map(x =>
      `• ${x.cant}x ${x.marca} ${x.modelo}${x.color ? ` (${x.color}${x.codigo ? ', ' + x.codigo : ''})` : ''} — ${plata(x.precio * x.cant)}`
    ).join('\n');
    const msg = `¡Hola! Pedido desde la web 👑\n${lineas}\nTOTAL: ${plata(total)}\n¿Cómo seguimos?`;
    track('carrito_pedido', `${items.length} items · ${plata(total)}`);
    window.open(linkWA(cfg, msg), '_blank', 'noopener');
  }

  return (
    <div className={'cart-drawer' + (abierto ? ' abierto' : '')}>
      <div className="cart-head">
        <span>Tu pedido ({items.length})</span>
        <button onClick={onCerrar} aria-label="Cerrar">×</button>
      </div>
      <div className="cart-items">
        {items.length === 0 && <p className="cart-vacio">Todavía no agregaste nada.<br />El que quiere, puede. 👑</p>}
        {items.map(x => (
          <div className="cart-item" key={x.k}>
            <div style={{ flex: 1 }}>
              <b>{x.marca} {x.modelo}</b>
              {x.color && <div className="cart-var">{x.color}{x.talle ? ` · ${x.talle}` : ''}</div>}
              <div className="cart-precio">{plata(x.precio)} c/u</div>
            </div>
            <div className="cart-cant">
              <button onClick={() => cambiar(x.k, -1)}>−</button>
              <span>{x.cant}</span>
              <button onClick={() => cambiar(x.k, 1)}>+</button>
            </div>
            <button className="cart-quitar" onClick={() => quitar(x.k)} aria-label="Quitar">×</button>
          </div>
        ))}
      </div>
      {items.length > 0 && (
        <div className="cart-pie">
          <div className="cart-total"><span>Total</span><b>{plata(total)}</b></div>
          <p className="cart-nota">{cfg?.cuotas} cuotas con tarjeta · {cfg?.descuento_transferencia}% off por transferencia</p>
          <button className="btn-brush brush-rosa cart-cerrar" onClick={pedirPorWA}>Cerrar pedido por WhatsApp</button>
          <button className="cart-vaciar" onClick={vaciar}>Vaciar carrito</button>
        </div>
      )}
    </div>
  );
}
