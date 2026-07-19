/* chat.js — RICH, el asistente. Habla con /api/ia (Claude si hay key, cerebro local si no). */
import { track } from './base.js';

export function montarChat(cfg) {
  const panel = document.createElement('div');
  panel.className = 'chat-panel';
  panel.innerHTML = `
    <div class="chat-head"><span>RICH · asistente</span><button aria-label="Cerrar">×</button></div>
    <div class="chat-msgs"></div>
    <div class="chat-input">
      <input type="text" placeholder="Preguntame por precios, stock, envíos..." maxlength="300">
      <button>→</button>
    </div>`;
  document.body.appendChild(panel);

  const msgs = panel.querySelector('.chat-msgs');
  const input = panel.querySelector('input');
  const historial = [];

  function agregar(texto, quien) {
    const d = document.createElement('div');
    d.className = 'msg ' + (quien === 'ia' ? 'msg-ia' : 'msg-user');
    d.textContent = texto;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  async function enviar() {
    const texto = input.value.trim();
    if (!texto) return;
    input.value = '';
    agregar(texto, 'user');
    historial.push({ role: 'user', content: texto });
    const espera = document.createElement('div');
    espera.className = 'msg msg-ia'; espera.textContent = '…';
    msgs.appendChild(espera);
    try {
      const r = await fetch('/api/ia', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: texto, historial: historial.slice(0, -1) })
      });
      const data = await r.json();
      espera.remove();
      agregar(data.respuesta, 'ia');
      historial.push({ role: 'assistant', content: data.respuesta });
    } catch {
      espera.remove();
      agregar(`Se me cortó. Escribinos directo por WhatsApp ${cfg.whatsapp_display} y te respondemos ya.`, 'ia');
    }
  }
  panel.querySelector('.chat-input button').addEventListener('click', enviar);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') enviar(); });
  panel.querySelector('.chat-head button').addEventListener('click', () => panel.classList.remove('abierto'));

  return {
    abrir() {
      panel.classList.add('abierto');
      if (!msgs.children.length) {
        agregar('Soy RICH. Preguntame por modelos, precios, envíos o si esto es original (spoiler: sí, con garantía doble).', 'ia');
        track('chat_abierto', location.pathname);
      }
      input.focus();
    }
  };
}
