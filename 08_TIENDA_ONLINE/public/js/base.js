/* base.js — config compartida, helpers y componentes comunes (header, footer, botones flotantes) */

export const state = { config: null, productos: null };

export async function cargarConfig() {
  if (!state.config) state.config = await (await fetch('/api/config')).json();
  return state.config;
}
export async function cargarProductos() {
  if (!state.productos) state.productos = await (await fetch('/api/productos')).json();
  return state.productos;
}

export const plata = n => '$' + Number(n).toLocaleString('es-AR');

export function linkWA(cfg, texto) {
  return `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(texto)}`;
}

export function track(tipo, detalle) {
  fetch('/api/eventos', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo, detalle })
  }).catch(() => {});
}

/* ---------- componentes comunes ---------- */
export function montarHeader(activa) {
  const el = document.createElement('header');
  el.innerHTML = `
    <div class="header-in">
      <a href="/" class="logo-text"><b>RICH</b>ARD LENS</a>
      <button class="menu-btn" aria-label="Menú">☰</button>
      <nav>
        <a href="/" ${activa === 'home' ? 'class="activa"' : ''}>Inicio</a>
        <a href="/catalogo" ${activa === 'catalogo' ? 'class="activa"' : ''}>Catálogo</a>
        <a href="/catalogo?canal=WEB">La Caja Fuerte</a>
        <a href="/#por-que">Por qué nosotros</a>
        <a href="#" class="btn-wa-mini" data-wa>WhatsApp</a>
      </nav>
    </div>`;
  document.body.prepend(el);
  el.querySelector('.menu-btn').addEventListener('click', () =>
    el.querySelector('nav').classList.toggle('abierta'));
}

export function montarFabs(cfg) {
  const stack = document.createElement('div');
  stack.className = 'fab-stack';
  stack.innerHTML = `
    <button class="fab fab-rich" title="Hablar con RICH (IA)" aria-label="Asistente">R</button>
    <a class="fab fab-wa" data-wa title="WhatsApp" aria-label="WhatsApp">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5a.6.6 0 0 0 0-.5c0-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5 5 0 0 0 1 2.7 11.4 11.4 0 0 0 4.4 3.9 15 15 0 0 0 1.5.5 3.6 3.6 0 0 0 1.6.1 2.7 2.7 0 0 0 1.7-1.2 2.2 2.2 0 0 0 .2-1.2c-.1-.1-.2-.2-.4-.3Z"/></svg>
    </a>`;
  document.body.appendChild(stack);
  return stack;
}

export function conectarWA(cfg, textoDefault) {
  document.querySelectorAll('[data-wa]').forEach(a => {
    a.href = linkWA(cfg, a.dataset.waTexto || textoDefault || 'Hola, vengo de la web de Richard Lens.');
    a.target = '_blank'; a.rel = 'noopener';
    a.addEventListener('click', () => track('whatsapp_click', location.pathname + ' → ' + (a.dataset.waTexto || 'general')));
  });
}

export function montarFooter(cfg) {
  const f = document.createElement('footer');
  f.innerHTML = `
    <div class="wrap footer-in">
      <div>
        <div class="logo-text" style="margin-bottom:8px"><b>RICH</b>ARD LENS</div>
        <p>Anteojos 100% originales · Envíos a todo el país<br>${cfg.textos.garantia}</p>
      </div>
      <div class="footer-links">
        <a href="/catalogo">Catálogo</a>
        <a href="https://instagram.com/${cfg.instagram}" target="_blank" rel="noopener">Instagram</a>
        <a href="#" data-wa>WhatsApp ${cfg.whatsapp_display}</a>
      </div>
    </div>`;
  document.body.appendChild(f);
}

/* reveals on-scroll para .reveal y .card */
export function activarReveals() {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
  }), { threshold: .12 });
  document.querySelectorAll('.reveal, .card').forEach(el => io.observe(el));
}
