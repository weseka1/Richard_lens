// Renderer HTML→PNG por CDP (patrón máquina WSK_INSTAGRAM)
// Requiere Chrome headless corriendo con --remote-debugging-port=9222 --remote-allow-origins=*
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const SRC = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(SRC, '..');
const fileUrl = (name, query = '') =>
  'file:///' + resolve(SRC, name).replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/').replace(/^file:%2F%2F%2F/, '') + query;

const JOBS = [
  { html: 'post01.html', out: 'ig_post_01_relanzamiento.png', w: 1080, h: 1350 },
  { html: 'post02.html', out: 'ig_post_02_wayfarer.png', w: 1080, h: 1350 },
  { html: 'post03.html', out: 'ig_post_03_tag.png', w: 1080, h: 1350 },
  { html: 'story01.html', out: 'ig_story_relanzamiento.png', w: 1080, h: 1920 },
  { html: 'cover.html', q: '?t=DROPS', out: 'cover_drops.png', w: 1080, h: 1920 },
  { html: 'cover.html', q: '?t=RAY-BAN', out: 'cover_rayban.png', w: 1080, h: 1920 },
  { html: 'cover.html', q: '?t=CUOTAS', out: 'cover_cuotas.png', w: 1080, h: 1920 },
  { html: 'cover.html', q: '?t=ENV%C3%8DOS', out: 'cover_envios.png', w: 1080, h: 1920 },
  { html: 'cover.html', q: '?t=LA%20BANDA', out: 'cover_labanda.png', w: 1080, h: 1920 },
  { html: 'logo.html', out: 'logo_v2_drip.png', w: 2000, h: 2000, transparent: true },
];

const BASE = 'http://127.0.0.1:9222';

async function renderJob(job) {
  const url = 'file:///' + resolve(SRC, job.html).replace(/\\/g, '/').replace(/ /g, '%20') + (job.q || '');
  const res = await fetch(`${BASE}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  const target = await res.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((ok, err) => { ws.onopen = ok; ws.onerror = err; });
  let id = 0; const pending = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (method, params = {}) => new Promise((ok) => { const i = ++id; pending.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: job.w, height: job.h, deviceScaleFactor: 1, mobile: false });
  if (job.transparent) await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  await new Promise(r => setTimeout(r, 1500));
  await send('Runtime.enable');
  await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(()=>1)', awaitPromise: true });
  await new Promise(r => setTimeout(r, 800));
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(resolve(OUT, job.out), Buffer.from(shot.result.data, 'base64'));
  console.log('OK', job.out);
  await send('Target.closeTarget', { targetId: target.id });
  ws.close();
}

const filter = process.argv[2];
const jobs = filter ? JOBS.filter(j => j.out.includes(filter)) : JOBS;
for (const job of jobs) await renderJob(job);
console.log('RENDER COMPLETO:', jobs.length, 'piezas');
