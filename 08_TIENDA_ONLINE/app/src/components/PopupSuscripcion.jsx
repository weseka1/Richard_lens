import React, { useEffect, useState } from 'react';
import { api, track } from '../lib/api.js';

/* Popup de suscripción estilo Nike ("Enterate antes que nadie"), en glass iPhone.
 * Aparece una vez a los 9s; no vuelve a molestar si lo cerrás o te suscribís. */
export default function PopupSuscripcion() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('news_popup_visto')) return;
    const t = setTimeout(() => setVisible(true), 9000);
    return () => clearTimeout(t);
  }, []);

  function cerrar() {
    localStorage.setItem('news_popup_visto', '1');
    setVisible(false);
  }

  async function suscribir(e) {
    e.preventDefault();
    try {
      await api('suscriptores', 'POST', { email });
      track('newsletter_alta', email + ' (popup)');
      setListo(true);
      localStorage.setItem('news_popup_visto', '1');
      setTimeout(() => setVisible(false), 1800);
    } catch {}
  }

  if (!visible) return null;

  return (
    <div className="probador-fondo" onClick={e => e.target === e.currentTarget && cerrar()}>
      <div className="popup-news">
        <button className="popup-cerrar" onClick={cerrar} aria-label="Cerrar">×</button>
        <img src="/img/logo-drip.png" alt="Richard Lens" className="popup-logo" />
        <h3>Enterate antes que nadie</h3>
        <p>Drops, llegadas y precios exclusivos de la casa, primero en tu casilla. Sin spam.</p>
        {listo ? (
          <p className="news-ok" style={{ textAlign: 'center' }}>Adentro. Bienvenido a la lista.</p>
        ) : (
          <form onSubmit={suscribir}>
            <input type="email" required placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            <button className="btn-brush" type="submit">Suscribite</button>
          </form>
        )}
      </div>
    </div>
  );
}
