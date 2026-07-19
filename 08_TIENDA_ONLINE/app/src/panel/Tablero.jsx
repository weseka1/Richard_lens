import React, { useEffect, useState } from 'react';
import { api, plata } from '../lib/api.js';

export default function Tablero() {
  const [s, setS] = useState(null);

  useEffect(() => {
    const cargar = () => api('stats').then(setS).catch(() => {});
    cargar();
    const t = setInterval(cargar, 30000);
    return () => clearInterval(t);
  }, []);

  if (!s) return <h1>Tablero</h1>;
  const max = Math.max(...s.pares_por_dia.map(d => d.plata), 1);

  return (
    <section>
      <h1>Tablero</h1>
      <div className="kpis">
        <div className="kpi kpi-meta">
          <small>Facturación hoy</small>
          <div className="kpi-valor">{plata(s.facturacion_hoy)}</div>
          <div className="barra">
            <div className="barra-fill" style={{ width: Math.min(100, (s.facturacion_hoy / s.meta_facturacion_dia) * 100) + '%' }} />
          </div>
          <span className="kpi-nota">meta {plata(s.meta_facturacion_dia)}/día · 7 días: {plata(s.facturacion_7dias)}</span>
        </div>
        <div className="kpi">
          <small>Pares últimos 7 días</small>
          <div className="kpi-valor">{s.pares_7dias}</div>
          <span className="kpi-nota">meta {s.meta_dia}/día ({s.meta_dia * 7}/semana) · stock total: {s.stock_total}</span>
        </div>
        <div className="kpi">
          <small>Ventas por cerrar</small>
          <div className="kpi-valor">{s.pedidos_nuevos}</div>
          <span className="kpi-nota">pedidos en estado nuevo</span>
        </div>
        <div className="kpi">
          <small>Clicks a WhatsApp</small>
          <div className="kpi-valor">{s.clicks_whatsapp}</div>
          <span className="kpi-nota">{s.consultas_ia} consultas al asistente</span>
        </div>
      </div>
      <div className="tarjeta">
        <h2>Últimos 7 días</h2>
        <div className="grafico">
          {s.pares_por_dia.map((d, i) => (
            <div className="g-col" key={i}>
              <span className="g-valor">{d.pares ? d.pares + 'p' : ''}</span>
              <div className="g-barra" style={{ height: (d.plata / max) * 100 + '%' }} title={plata(d.plata)} />
              <span className="g-label">{d.dia}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
