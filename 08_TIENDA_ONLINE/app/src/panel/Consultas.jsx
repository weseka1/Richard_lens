import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const NOMBRES = {
  whatsapp_click: 'Click WhatsApp',
  ia_consulta: 'Pregunta al asistente',
  chat_abierto: 'Abrió el chat',
  visita: 'Visita',
  visita_producto: 'Vio producto'
};

export default function Consultas() {
  const [eventos, setEventos] = useState([]);
  useEffect(() => { api('eventos').then(setEventos).catch(() => {}); }, []);

  return (
    <section>
      <h1>Consultas y actividad</h1>
      <p className="ayuda">Todo lo que pasa en la tienda: clicks a WhatsApp, preguntas al asistente, visitas a productos.</p>
      <div className="tarjeta">
        <table>
          <thead><tr><th>Cuándo</th><th>Qué</th><th>Detalle</th></tr></thead>
          <tbody>
            {eventos.map((e, i) => (
              <tr key={i}>
                <td style={{ whiteSpace: 'nowrap' }}>{new Date(e.fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                <td><span className={'pill ' + (e.tipo === 'whatsapp_click' ? 'pill-ok' : e.tipo === 'ia_consulta' ? 'pill-warn' : 'pill-gris')}>{NOMBRES[e.tipo] || e.tipo}</span></td>
                <td style={{ color: 'var(--hueso-60)' }}>{(e.detalle || '').slice(0, 90)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
