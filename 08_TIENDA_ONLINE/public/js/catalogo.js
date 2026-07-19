/* catalogo.js — grid con filtros por marca, forma y estado. Lee ?canal=WEB para "La Caja Fuerte". */
import { cargarConfig, cargarProductos, montarHeader, montarFooter, montarFabs, conectarWA, activarReveals, track } from './base.js';
import { activarTilt } from './efectos3d.js';
import { montarChat } from './chat.js';
import { cardProducto } from './card.js';

const FORMAS = ['wayfarer', 'aviador', 'redondo', 'cuadrado', 'deportivo'];
const ESTADOS = [['disponible', 'Stock ya'], ['a_pedido', 'A pedido']];

(async () => {
  montarHeader('catalogo');
  const cfg = await cargarConfig();
  const todos = await cargarProductos();
  const params = new URLSearchParams(location.search);

  const filtro = { marca: params.get('marca') || null, forma: null, estado: null, canal: params.get('canal') || null };

  const marcas = [...new Set(todos.map(p => p.marca))];
  const elMarcas = document.getElementById('filtro-marcas');
  const elFormas = document.getElementById('filtro-formas');
  const elEstados = document.getElementById('filtro-estados');

  function chips(el, items, clave, labels = {}) {
    el.innerHTML = `<button class="chip ${!filtro[clave] ? 'activo' : ''}" data-v="">Todo</button>` +
      items.map(v => `<button class="chip ${filtro[clave] === v ? 'activo' : ''}" data-v="${v}">${labels[v] || v}</button>`).join('');
    el.querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => {
      filtro[clave] = b.dataset.v || null;
      if (clave === 'marca') filtro.canal = null; // elegir marca pisa el modo caja fuerte
      render();
    }));
  }

  async function render() {
    chips(elMarcas, marcas, 'marca');
    chips(elFormas, FORMAS, 'forma');
    chips(elEstados, ESTADOS.map(e => e[0]), 'estado', Object.fromEntries(ESTADOS));
    let lista = todos.filter(p =>
      (!filtro.marca || p.marca === filtro.marca) &&
      (!filtro.forma || p.forma === filtro.forma) &&
      (!filtro.estado || p.estado === filtro.estado) &&
      (!filtro.canal || p.canal === filtro.canal)
    );
    const grid = document.getElementById('grid');
    grid.innerHTML = lista.length
      ? (await Promise.all(lista.map((p, i) => cardProducto(p, i, cfg)))).join('')
      : `<p style="color:var(--hueso-60);grid-column:1/-1;padding:40px 0">No hay resultados con esos filtros. Lo que buscás seguro se consigue: <a href="#" data-wa data-wa-texto="Hola, busco un modelo que no está en la web." style="color:var(--oro)">preguntanos por WhatsApp</a>.</p>`;
    conectarWA(cfg);
    activarReveals();
    activarTilt();
  }

  await render();
  montarFooter(cfg);
  const fabs = montarFabs(cfg);
  conectarWA(cfg);
  const chat = montarChat(cfg);
  fabs.querySelector('.fab-rich').addEventListener('click', chat.abrir);
  track('visita', 'catalogo' + (filtro.canal ? ':cajafuerte' : ''));
})();
