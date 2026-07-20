import React, { useEffect, useState } from 'react';
import { api, plata } from '../lib/api.js';

/* Conector MercadoLibre: conectar cuenta, publicar catálogo, responder preguntas con RICH,
 * importar órdenes al tablero. Solo Ray-Ban/Oakley/collabs — el lujo jamás pisa MELI. */

export default function Meli() {
  const [estado, setEstado] = useState(null);
  const [appId, setAppId] = useState('');
  const [secret, setSecret] = useState('');
  const [publicables, setPublicables] = useState([]);
  const [preguntas, setPreguntas] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [ocupado, setOcupado] = useState('');
  const [error, setError] = useState('');

  const cargarEstado = () => api('meli/estado').then(setEstado).catch(() => setEstado({ configurada: false }));
  useEffect(() => { cargarEstado(); }, []);

  useEffect(() => {
    if (!estado?.conectada) return;
    api('meli/publicables').then(setPublicables).catch(e => setError(String(e.message)));
    api('meli/preguntas').then(setPreguntas).catch(() => {});
    api('meli/ordenes').then(setOrdenes).catch(() => {});
  }, [estado?.conectada]);

  async function guardarConfig() {
    await api('meli/config', 'POST', { app_id: appId, secret });
    cargarEstado();
  }

  async function publicarUno(id) {
    setOcupado(id); setError('');
    try {
      const r = await api('meli/publicar', 'POST', { id });
      setPublicables(ps => ps.map(x => x.id === id ? { ...x, publicado: r.id, permalink: r.permalink } : x));
    } catch (e) { setError(`${id}: ${e.message}`); }
    setOcupado('');
  }

  async function sugerir(q) {
    const r = await api('ia', 'POST', {
      mensaje: `Sos el vendedor respondiendo una pregunta de MercadoLibre sobre "${q.item}". Pregunta del comprador: "${q.texto}". Respondé corto, profesional y vendedor. Sin pedir datos de contacto (MELI lo prohíbe), sin links.`
    });
    setRespuestas(rs => ({ ...rs, [q.id]: r.respuesta }));
  }

  async function responder(q) {
    const texto = respuestas[q.id];
    if (!texto) return;
    await api('meli/responder', 'POST', { question_id: q.id, texto });
    setPreguntas(ps => ps.filter(x => x.id !== q.id));
  }

  async function importarOrden(o) {
    try { await api('meli/importar-orden', 'POST', o); setOrdenes(os => os.map(x => x.id === o.id ? { ...x, importada: true } : x)); }
    catch { setOrdenes(os => os.map(x => x.id === o.id ? { ...x, importada: true } : x)); }
  }

  if (!estado) return <h1>MercadoLibre</h1>;

  // paso 1: credenciales de la app
  if (!estado.configurada) return (
    <section>
      <h1>MercadoLibre</h1>
      <div className="tarjeta form-config">
        <p className="ayuda" style={{ marginBottom: 4 }}>
          Paso único (5 min): entrá a <code>developers.mercadolibre.com.ar</code> logueado con tu cuenta
          de vendedor → "Crear aplicación" → nombre: Richard Lens → Redirect URI (exacta):
          <code> http://localhost:5250/api/meli/callback</code> → permisos: read, write, offline_access.
          Copiá acá el App ID y la Secret Key.
        </p>
        <label>App ID<input value={appId} onChange={e => setAppId(e.target.value)} placeholder="123456789..." /></label>
        <label>Secret Key<input type="password" value={secret} onChange={e => setSecret(e.target.value)} /></label>
        <button className="btn-oro" onClick={guardarConfig}>Guardar</button>
      </div>
    </section>
  );

  // paso 2: OAuth
  if (!estado.conectada) return (
    <section>
      <h1>MercadoLibre</h1>
      <div className="tarjeta" style={{ maxWidth: 460 }}>
        <p className="ayuda">App configurada. Falta autorizar con tu cuenta de MercadoLibre (una sola vez).</p>
        <a className="btn-oro" style={{ textDecoration: 'none', display: 'inline-block' }} href="/api/meli/conectar">Conectar mi cuenta →</a>
        <p className="ayuda" style={{ marginTop: 14 }}>Si cambiaste App ID/Secret: <button className="btn-mini" onClick={() => { setEstado({ configurada: false }); }}>editar credenciales</button></p>
      </div>
    </section>
  );

  // conectado
  return (
    <section>
      <div className="vista-head">
        <h1>MercadoLibre</h1>
        <span className="pill pill-ok">Conectado: {estado.user}</span>
      </div>
      <p className="ayuda">
        ⚠️ Publicá de a poco (5-10 por día) y con la factura del proveedor a mano — EssilorLuxottica
        denuncia vía Brand Protection y la única defensa es el papel. El lujo (LV/Dior/Gucci...) NUNCA aparece acá.
      </p>
      {error && <p className="ayuda" style={{ color: '#FF9C92' }}>{error}</p>}

      <div className="tarjeta" style={{ marginBottom: 20 }}>
        <h2>Publicar catálogo ({publicables.filter(x => !x.publicado).length} listos, {publicables.filter(x => x.publicado).length} publicados)</h2>
        <table>
          <thead><tr><th>Producto</th><th>Precio MELI</th><th>Variantes c/stock</th><th>Fotos</th><th></th></tr></thead>
          <tbody>
            {publicables.slice(0, 40).map(x => (
              <tr key={x.id}>
                <td><b>{x.marca}</b> {x.modelo}</td>
                <td>{plata(x.precio_ml)}</td>
                <td>{x.stock}</td>
                <td>{x.fotos ? '✓' : <span className="pill pill-warn">sin fotos</span>}</td>
                <td>
                  {x.publicado
                    ? <a className="btn-mini" href={x.permalink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>Ver publicación ↗</a>
                    : <button className="btn-oro" disabled={!x.fotos || ocupado === x.id} onClick={() => publicarUno(x.id)} style={{ padding: '6px 14px', fontSize: '.78rem' }}>
                        {ocupado === x.id ? 'Publicando…' : 'Publicar'}
                      </button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="tarjeta" style={{ marginBottom: 20 }}>
        <h2>Preguntas sin responder ({preguntas.length})</h2>
        {preguntas.length === 0 && <p className="ayuda">Nada pendiente. Las preguntas nuevas aparecen acá.</p>}
        {preguntas.map(q => (
          <div key={q.id} style={{ borderBottom: '1px solid rgba(250,247,242,.08)', padding: '14px 0' }}>
            <p style={{ fontSize: '.8rem', color: 'rgba(250,247,242,.45)' }}>{q.item}</p>
            <p style={{ fontWeight: 600, margin: '4px 0 10px' }}>"{q.texto}"</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                style={{ flex: 1, minWidth: 240 }}
                value={respuestas[q.id] || ''}
                onChange={e => setRespuestas(rs => ({ ...rs, [q.id]: e.target.value }))}
                placeholder="Tu respuesta…"
              />
              <button className="btn-sec" onClick={() => sugerir(q)}>Sugerir con RICH</button>
              <button className="btn-oro" onClick={() => responder(q)} disabled={!respuestas[q.id]}>Responder</button>
            </div>
          </div>
        ))}
      </div>

      <div className="tarjeta">
        <h2>Órdenes recientes</h2>
        <table>
          <thead><tr><th>Fecha</th><th>Producto</th><th>Total</th><th>Comprador</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {ordenes.map(o => (
              <tr key={o.id}>
                <td>{new Date(o.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}</td>
                <td>{o.item}</td>
                <td><b>{plata(o.total)}</b></td>
                <td>{o.comprador}</td>
                <td><span className={'pill ' + (o.estado === 'paid' ? 'pill-ok' : 'pill-gris')}>{o.estado}</span></td>
                <td>
                  {o.importada
                    ? <span className="pill pill-gris">en tablero</span>
                    : <button className="btn-mini" onClick={() => importarOrden(o)}>Pasar al tablero</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
