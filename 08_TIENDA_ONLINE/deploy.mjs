/* Deploy a Render con un comando.
 *
 * Buildea la app, commitea si hay cambios, pushea y dispara el hook de
 * Render. Antes había que entrar al panel de Render a mano cada vez.
 *
 * El hook es un secreto: sale de RENDER_DEPLOY_HOOK (variable de entorno) o
 * de data/render.json, que está gitignoreado igual que las credenciales.
 *
 * Uso:  node deploy.mjs "mensaje del commit"
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const RAIZ = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const mensaje = process.argv[2] || 'Actualizacion';

function hook() {
  if (process.env.RENDER_DEPLOY_HOOK) return process.env.RENDER_DEPLOY_HOOK;
  try { return JSON.parse(fs.readFileSync(path.join(RAIZ, 'data', 'render.json'), 'utf8')).hook; }
  catch { return null; }
}

const url = hook();
if (!url) {
  console.error('Falta el hook. Ponelo en 08_TIENDA_ONLINE/data/render.json como { "hook": "https://api.render.com/deploy/..." }');
  process.exit(1);
}

const correr = (cmd, cwd) => execSync(cmd, { cwd: cwd || RAIZ, stdio: 'inherit' });

console.log('\n1/4  Compilando la app…');
correr('npm run build', path.join(RAIZ, 'app'));

console.log('\n2/4  Guardando cambios…');
try {
  correr('git add -A', path.join(RAIZ, '..'));
  correr(`git commit -m "${mensaje.replace(/"/g, "'")}"`, path.join(RAIZ, '..'));
} catch { console.log('   (no había nada nuevo para guardar)'); }

console.log('\n3/4  Subiendo a GitHub…');
try { correr('git push', path.join(RAIZ, '..')); } catch { console.log('   (ya estaba al día)'); }

console.log('\n4/4  Disparando el deploy en Render…');
const r = await fetch(url, { method: 'POST' });
const j = await r.json().catch(() => ({}));
console.log(r.ok ? `   ✅ deploy ${j.deploy?.id || 'en marcha'}` : `   ❌ ${r.status}`);
console.log('\nTarda 2-4 minutos. Después: https://richardlens.onrender.com\n');
