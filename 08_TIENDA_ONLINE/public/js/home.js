/* home.js — arma la home: header/footer, drops destacados, caja fuerte, 3D, chat */
import { cargarConfig, cargarProductos, montarHeader, montarFooter, montarFabs, conectarWA, activarReveals, plata, track } from './base.js';
import { montarGafas3D, activarTilt } from './efectos3d.js';
import { montarChat } from './chat.js';
import { cardProducto } from './card.js';

(async () => {
  montarHeader('home');
  const cfg = await cargarConfig();
  const productos = await cargarProductos();

  // drops = destacados que no son LUX (con foto real si existe)
  const drops = productos.filter(p => p.canal !== 'WEB' && p.estado !== 'proximamente').slice(0, 4);
  const vault = productos.filter(p => p.canal === 'WEB').slice(0, 8);

  document.getElementById('grid-drops').innerHTML = (await Promise.all(drops.map((p, i) => cardProducto(p, i, cfg)))).join('');
  document.getElementById('grid-vault').innerHTML = (await Promise.all(vault.map((p, i) => cardProducto(p, i, cfg)))).join('');

  montarFooter(cfg);
  const fabs = montarFabs(cfg);
  conectarWA(cfg);
  const chat = montarChat(cfg);
  fabs.querySelector('.fab-rich').addEventListener('click', chat.abrir);

  activarReveals();
  activarTilt();
  montarGafas3D('gafas3d');
  track('visita', 'home');
})();
