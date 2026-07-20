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
      <div className="kpis">
        <div className="kpi">
          <small>Facturación del mes</small>
          <div className="kpi-valor">{plata(s.facturacion_mes)}</div>
          <span className="kpi-nota">{s.pares_mes} pares vendidos este mes</span>
        </div>
        <div className="kpi">
          <small>Ticket promedio</small>
          <div className="kpi-valor">{plata(s.ticket_promedio)}</div>
          <span className="kpi-nota">por venta cerrada</span>
        </div>
        <div className="kpi">
          <small>La lista (suscriptores)</small>
          <div className="kpi-valor">{s.suscriptores}</div>
          <span className="kpi-nota">mails capturados para campañas</span>
        </div>
        <div className="kpi">
          <small>Hoy en la tienda</small>
          <div className="kpi-valor">{s.visitas_hoy}</div>
          <span className="kpi-nota">visitas · {s.carritos_hoy} agregados al carrito · nube {s.nube ? '🟢 sincronizada' : '🔴 off'}</span>
        </div>
      </div>

      <div className="tarjeta" style={{ marginBottom: 20 }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
        <div className="tarjeta">
          <h2>Productos calientes 🔥</h2>
          {s.top_productos?.length ? (
            <table>
              <thead><tr><th>Producto</th><th>Vistas</th><th>Al carrito</th></tr></thead>
              <tbody>
                {s.top_productos.map(t => (
                  <tr key={t.nombre}><td>{t.nombre}</td><td>{t.vistas}</td><td><b>{t.carrito}</b></td></tr>
                ))}
              </tbody>
            </table>
          ) : <p className="ayuda">Cuando entre tráfico, acá ves qué modelos calientan (vistas y carritos).</p>}
        </div>
        <div className="tarjeta">
          <h2>Facturación por canal</h2>
          {Object.keys(s.por_canal || {}).length ? (
            <table>
              <tbody>
                {Object.entries(s.por_canal).sort((a, b) => b[1] - a[1]).map(([c, m]) => (
                  <tr key={c}><td style={{ textTransform: 'capitalize' }}>{c}</td><td style={{ textAlign: 'right' }}><b>{plata(m)}</b></td></tr>
                ))}
              </tbody>
            </table>
          ) : <p className="ayuda">Se completa con cada venta registrada (WhatsApp, Instagram, MELI, web).</p>}
        </div>
      </div>
    </section>
  );
}
