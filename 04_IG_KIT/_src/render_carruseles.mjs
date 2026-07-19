// Renderer HTML→PNG por CDP — carruseles IG (basado en render.mjs, misma máquina)
// Requiere Chrome headless corriendo con --remote-debugging-port=9222 --remote-allow-origins=*
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const SRC = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(SRC, '..');

const JOBS = [
  { html: 'carrusel1_s1.html', out: 'carrusel1_s1.png', w: 1080, h: 1350 },
  { html: 'carrusel1_s2.html', out: 'carrusel1_s2.png', w: 1080, h: 1350 },
  { html: 'carrusel1_s3.html', out: 'carrusel1_s3.png', w: 1080, h: 1350 },
  { html: 'carrusel1_s4.html', out: 'carrusel1_s4.png', w: 1080, h: 1350 },
  { html: 'carrusel1_s5.html', out: 'carrusel1_s5.png', w: 1080, h: 1350 },
  { html: 'carrusel2_s1.html', out: 'carrusel2_s1.png', w: 1080, h: 1350 },
  { html: 'carrusel2_s2.html', out: 'carrusel2_s2.png', w: 1080, h: 1350 },
  { html: 'carrusel2_s3.html', out: 'carrusel2_s3.png', w: 1080, h: 1350 },
  { html: 'carrusel2_s4.html', out: 'carrusel2_s4.png', w: 1080, h: 1350 },
  { html: 'carrusel2_s5.html', out: 'carrusel2_s5.png', w: 1080, h: 1350 },
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
