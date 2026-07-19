/* Panel RICHARD LENS — tablero, productos, ventas, consultas, config. Sin frameworks. */

const $ = s => document.querySelector(s);
const plata = n => '$' + Number(n || 0).toLocaleString('es-AR');
const api = async (ruta, metodo = 'GET', datos) => {
  const r = await fetch('/api/' + ruta, {
    method: metodo,
    headers: datos ? { 'Content-Type': 'application/json' } : undefined,
    body: datos ? JSON.stringify(datos) : undefined
  });
  return r.json();
};

/* ---------- navegación ---------- */
document.querySelectorAll('.side-link').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.side-link').forEach(x => x.classList.remove('activo'));
  document.querySelectorAll('.vista').forEach(x => x.classList.remove('activa'));
  b.classList.add('activo');
  $('#vista-' + b.dataset.vista).classList.add('activa');
  CARGAS[b.dataset.vista]?.();
}));

/* ---------- modal genérico ---------- */
let modalOk = null;
function abrirModal(titulo, campos, alGuardar) {
  $('#modal-titulo').textContent = titulo;
  $('#modal-campos').innerHTML = campos.map(c => `
    <label class="${c.ancho ? 'ancho' : ''}">${c.label}
      ${c.tipo === 'select'
        ? `<select id="m-${c.id}">${c.opciones.map(o => `<option value="${o[0]}" ${o[0] == c.valor ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>`
        : `<input id="m-${c.id}" type="${c.tipo || 'text'}" value="${c.valor ?? ''}" ${c.step ? `step="${c.step}"` : ''}>`}
    </label>`).join('');
  modalOk = () => {
    const out = {};
    campos.forEach(c => {
      let v = $('#m-' + c.id).value;
      if (c.tipo === 'number') v = Number(v) || 0;
      out[c.id] = v;
    });
    alGuardar(out);
  };
  $('#modal').classList.add('abierto');
}
$('#modal-cancelar').addEventListener('click', () => $('#modal').classList.remove('abierto'));
$('#modal-ok').addEventListener('click', () => { modalOk?.(); $('#modal').classList.remove('abierto'); });

/* ---------- tablero ---------- */
async function cargarDashboard() {
  const s = await api('stats');
  $('#kpi-fact').textContent = plata(s.facturacion_hoy);
  $('#kpi-fact-meta').textContent = `meta ${plata(s.meta_facturacion_dia)}/día · 7 días: ${plata(s.facturacion_7dias)}`;
  $('#barra-fact').style.width = Math.min(100, (s.facturacion_hoy / s.meta_facturacion_dia) * 100) + '%';
  $('#kpi-pares').textContent = s.pares_7dias;
  $('#kpi-pares-meta').textContent = `meta ${s.meta_dia}/día (${s.meta_dia * 7}/semana) · stock total: ${s.stock_total}`;
  $('#kpi-nuevos').textContent = s.pedidos_nuevos;
  $('#kpi-wa').textContent = s.clicks_whatsapp;
  $('#kpi-ia').textContent = s.consultas_ia;
  const max = Math.max(...s.pares_por_dia.map(d => d.plata), 1);
  $('#grafico').innerHTML = s.pares_por_dia.map(d => `
    <div class="g-col">
      <span class="g-valor">${d.pares ? d.pares + 'p' : ''}</span>
      <div class="g-barra" style="height:${(d.plata / max) * 100}%" title="${plata(d.plata)}"></div>
      <span class="g-label">${d.dia}</span>
    </div>`).join('');
}

/* ---------- productos ---------- */
const CAMPOS_PROD = p => [
  { id: 'marca', label: 'Marca', valor: p?.marca },
  { id: 'modelo', label: 'Modelo', valor: p?.modelo },
  { id: 'codigo', label: 'Código/SKU', valor: p?.codigo },
  { id: 'color', label: 'Color', valor: p?.color },
  { id: 'cristal', label: 'Cristal', valor: p?.cristal },
  { id: 'forma', label: 'Forma', tipo: 'select', valor: p?.forma || 'cuadrado', opciones: [['wayfarer','Wayfarer'],['aviador','Aviador'],['redondo','Redondo'],['cuadrado','Cuadrado'],['deportivo','Deportivo']] },
  { id: 'precio_web', label: 'Precio web ($, 0=consultar)', tipo: 'number', valor: p?.precio_web ?? 0 },
  { id: 'precio_ml', label: 'Precio MELI ($)', tipo: 'number', valor: p?.precio_ml ?? 0 },
  { id: 'costo_usd', label: 'Costo (USD)', tipo: 'number', valor: p?.costo_usd ?? 0 },
  { id: 'stock', label: 'Stock', tipo: 'number', valor: p?.stock ?? 0 },
  { id: 'canal', label: 'Canal', tipo: 'select', valor: p?.canal || 'WEB', opciones: [['ML+WEB','MELI + Web'],['WEB','Solo web (LUX)']] },
  { id: 'estado', label: 'Estado', tipo: 'select', valor: p?.estado || 'a_pedido', opciones: [['disponible','Disponible'],['a_pedido','A pedido'],['proximamente','Próximamente'],['pausado','Pausado (no se muestra)']] },
  { id: 'destacado', label: 'Destacado en home', tipo: 'select', valor: String(p?.destacado ?? false), opciones: [['true','Sí'],['false','No']] },
  { id: 'descripcion', label: 'Descripción (1-2 frases)', valor: p?.descripcion, ancho: true }
];

async function cargarProductos() {
  const lista = await api('admin/productos');
  $('#tabla-productos').innerHTML = `
    <tr><th>Producto</th><th>Precio web</th><th>Precio MELI</th><th>Costo USD</th><th>Stock</th><th>Canal</th><th>Estado</th><th></th></tr>` +
    lista.map(p => `
    <tr>
      <td><b>${p.marca}</b> ${p.modelo}<br><span style="color:var(--hueso-35);font-size:.76rem">${p.codigo}</span></td>
      <td>${p.precio_web ? plata(p.precio_web) : '<span class="pill pill-warn">consultar</span>'}</td>
      <td>${p.precio_ml ? plata(p.precio_ml) : '—'}</td>
      <td>${p.costo_usd ? 'U$' + p.costo_usd : '—'}</td>
      <td>${p.stock}</td>
      <td>${p.canal}</td>
      <td><span class="pill ${p.estado === 'disponible' ? 'pill-ok' : p.estado === 'proximamente' ? 'pill-warn' : 'pill-gris'}">${p.estado}</span></td>
      <td style="white-space:nowrap">
        <button class="btn-mini" data-editar="${p.id}">Editar</button>
        <button class="btn-mini" data-borrar="${p.id}">×</button>
      </td>
    </tr>`).join('');

  document.querySelectorAll('[data-editar]').forEach(b => b.addEventListener('click', () => {
    const p = lista.find(x => x.id === b.dataset.editar);
    abrirModal(`Editar — ${p.marca} ${p.modelo}`, CAMPOS_PROD(p), async out => {
      out.destacado = out.destacado === 'true';
      await api('productos/' + p.id, 'PUT', out);
      cargarProductos();
    });
  }));
  document.querySelectorAll('[data-borrar]').forEach(b => b.addEventListener('click', async () => {
    if (confirm('¿Borrar este producto?')) { await api('productos/' + b.dataset.borrar, 'DELETE'); cargarProductos(); }
  }));
}
$('#btn-nuevo-prod').addEventListener('click', () =>
  abrirModal('Nuevo producto', CAMPOS_PROD(null), async out => {
    out.destacado = out.destacado === 'true';
    await api('productos', 'POST', out);
    cargarProductos();
  }));
$('#btn-sync').addEventListener('click', async () => {
  const r = await api('sync-csv', 'POST');
  alert(r.ok ? `Listo: ${r.nuevos} nuevos, ${r.actualizados} actualizados (${r.total} en total).` : 'Error: ' + r.error);
  cargarProductos();
});

/* ---------- ventas ---------- */
const ESTADOS_PEDIDO = [['nuevo','Nuevo'],['senado','Señado'],['pagado','Pagado'],['enviado','Enviado'],['entregado','Entregado'],['caido','Caído']];
async function cargarPedidos() {
  const [pedidos, productos] = await Promise.all([api('pedidos'), api('admin/productos')]);
  $('#tabla-pedidos').innerHTML = `
    <tr><th>Fecha</th><th>Producto</th><th>Cant.</th><th>Monto</th><th>Canal</th><th>Cliente</th><th>Estado</th><th></th></tr>` +
    pedidos.map(p => `
    <tr>
      <td>${new Date(p.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}</td>
      <td>${p.producto || '—'}</td>
      <td>${p.cantidad || 1}</td>
      <td><b>${plata(p.monto)}</b></td>
      <td>${p.canal || '—'}</td>
      <td>${p.cliente || '—'}</td>
      <td>
        <select data-estado="${p.id}" style="width:auto">
          ${ESTADOS_PEDIDO.map(e => `<option value="${e[0]}" ${p.estado === e[0] ? 'selected' : ''}>${e[1]}</option>`).join('')}
        </select>
      </td>
      <td><button class="btn-mini" data-borrar-p="${p.id}">×</button></td>
    </tr>`).join('');
  document.querySelectorAll('[data-estado]').forEach(s => s.addEventListener('change', async () => {
    await api('pedidos/' + s.dataset.estado, 'PUT', { estado: s.value });
    cargarDashboard();
  }));
  document.querySelectorAll('[data-borrar-p]').forEach(b => b.addEventListener('click', async () => {
    if (confirm('¿Borrar esta venta?')) { await api('pedidos/' + b.dataset.borrarP, 'DELETE'); cargarPedidos(); }
  }));

  $('#btn-nueva-venta').onclick = () =>
    abrirModal('Registrar venta', [
      { id: 'producto', label: 'Producto', tipo: 'select', valor: '', opciones: productos.map(x => [`${x.marca} ${x.modelo}`, `${x.marca} ${x.modelo}`]), ancho: true },
      { id: 'cantidad', label: 'Cantidad', tipo: 'number', valor: 1 },
      { id: 'monto', label: 'Monto total ($)', tipo: 'number', valor: '' },
      { id: 'canal', label: 'Canal', tipo: 'select', valor: 'whatsapp', opciones: [['whatsapp','WhatsApp'],['instagram','Instagram'],['meli','MercadoLibre'],['web','Web']] },
      { id: 'cliente', label: 'Cliente (nombre o tel)', valor: '' },
      { id: 'estado', label: 'Estado', tipo: 'select', valor: 'pagado', opciones: ESTADOS_PEDIDO }
    ], async out => { await api('pedidos', 'POST', out); cargarPedidos(); cargarDashboard(); });
}

/* ---------- consultas ---------- */
async function cargarEventos() {
  const eventos = await api('eventos');
  const NOMBRES = { whatsapp_click: 'Click WhatsApp', ia_consulta: 'Pregunta al asistente', chat_abierto: 'Abrió el chat', visita: 'Visita', visita_producto: 'Vio producto' };
  $('#tabla-eventos').innerHTML = `<tr><th>Cuándo</th><th>Qué</th><th>Detalle</th></tr>` +
    eventos.map(e => `
    <tr>
      <td style="white-space:nowrap">${new Date(e.fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
      <td><span class="pill ${e.tipo === 'whatsapp_click' ? 'pill-ok' : e.tipo === 'ia_consulta' ? 'pill-warn' : 'pill-gris'}">${NOMBRES[e.tipo] || e.tipo}</span></td>
      <td style="color:var(--hueso-60)">${(e.detalle || '').slice(0, 90)}</td>
    </tr>`).join('');
}

/* ---------- config ---------- */
async function cargarConfig() {
  const c = await api('config');
  $('#cfg-wa').value = c.whatsapp || '';
  $('#cfg-wa-disp').value = c.whatsapp_display || '';
  $('#cfg-ig').value = c.instagram || '';
  $('#cfg-cuotas').value = c.cuotas || 6;
  $('#cfg-transf').value = c.descuento_transferencia || 10;
  $('#cfg-meta-pares').value = c.meta_pares_dia || 4;
  $('#cfg-meta-fact').value = c.meta_facturacion_dia || 500000;
}
$('#btn-guardar-cfg').addEventListener('click', async () => {
  await api('config', 'POST', {
    whatsapp: $('#cfg-wa').value.trim(),
    whatsapp_display: $('#cfg-wa-disp').value.trim(),
    instagram: $('#cfg-ig').value.trim(),
    cuotas: Number($('#cfg-cuotas').value),
    descuento_transferencia: Number($('#cfg-transf').value),
    meta_pares_dia: Number($('#cfg-meta-pares').value),
    meta_facturacion_dia: Number($('#cfg-meta-fact').value)
  });
  $('#cfg-estado').textContent = 'Guardado. La tienda ya usa los valores nuevos.';
  setTimeout(() => $('#cfg-estado').textContent = '', 3000);
});

/* ---------- arranque ---------- */
const CARGAS = { dashboard: cargarDashboard, productos: cargarProductos, pedidos: cargarPedidos, consultas: cargarEventos, config: cargarConfig };
cargarDashboard();
setInterval(() => { if ($('#vista-dashboard').classList.contains('activa')) cargarDashboard(); }, 30000);
