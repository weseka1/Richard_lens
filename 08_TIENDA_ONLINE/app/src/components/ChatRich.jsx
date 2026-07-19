import React, { useEffect, useRef, useState } from 'react';
import { track } from '../lib/api.js';

/* RICH, el asistente. Habla con /api/ia (Claude si hay key en el server, cerebro local si no). */
export default function ChatRich({ cfg, abierto, onCerrar }) {
  const [msgs, setMsgs] = useState([]);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const fin = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (abierto && msgs.length === 0) {
      setMsgs([{ quien: 'ia', texto: 'Soy RICH. Preguntame por modelos, precios, envíos o si esto es original (spoiler: sí, con garantía doble).' }]);
      track('chat_abierto', location.pathname);
    }
    if (abierto) setTimeout(() => inputRef.current?.focus(), 50);
  }, [abierto]);

  useEffect(() => { fin.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, pensando]);

  async function enviar() {
    const t = texto.trim();
    if (!t || pensando) return;
    setTexto('');
    const historial = msgs.filter(m => m.quien !== 'error').map(m => ({ role: m.quien === 'ia' ? 'assistant' : 'user', content: m.texto }));
    setMsgs(m => [...m, { quien: 'user', texto: t }]);
    setPensando(true);
    try {
      const r = await fetch('/api/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: t, historial: historial.slice(-6) })
      });
      const data = await r.json();
      setMsgs(m => [...m, { quien: 'ia', texto: data.respuesta }]);
    } catch {
      setMsgs(m => [...m, { quien: 'ia', texto: `Se me cortó. Escribinos directo por WhatsApp ${cfg.whatsapp_display} y te respondemos ya.` }]);
    }
    setPensando(false);
  }

  return (
    <div className={'chat-panel' + (abierto ? ' abierto' : '')}>
      <div className="chat-head">
        <span>RICH · asistente</span>
        <button onClick={onCerrar} aria-label="Cerrar">×</button>
      </div>
      <div className="chat-msgs">
        {msgs.map((m, i) => (
          <div key={i} className={'msg ' + (m.quien === 'ia' ? 'msg-ia' : 'msg-user')}>{m.texto}</div>
        ))}
        {pensando && <div className="msg msg-ia">…</div>}
        <div ref={fin} />
      </div>
      <div className="chat-input">
        <input
          ref={inputRef}
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviar()}
          placeholder="Preguntame por precios, stock, envíos..."
          maxLength={300}
        />
        <button onClick={enviar}>→</button>
      </div>
    </div>
  );
}
