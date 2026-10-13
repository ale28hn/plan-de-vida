// Phone-width screenshots via Chrome DevTools Protocol. Usage: node --experimental-websocket scripts/shot.js PORT
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
const port = process.argv[2] || '8790', dbg = 9333 + Math.floor(Math.random() * 500);
const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${dbg}`, `--user-data-dir=/tmp/pdv-cdp-${Date.now()}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets; for (let i = 0; i < 50; i++) { try { targets = await (await fetch(`http://127.0.0.1:${dbg}/json`)).json(); break; } catch { await sleep(200); } }
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = {}; const errors = [];
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending[d.id]) { pending[d.id](d.result); delete pending[d.id]; } if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description); };
const send = (method, params = {}) => new Promise((r) => { pending[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
mkdirSync('screenshots', { recursive: true });
for (const [shot, file] of [['flow', 'hoy-manana-flujo.png'], ['counter', 'oracion-de-jesus-contador.png'], ['', 'hoy.png']]) {
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/index.html${shot ? '?shot=' + shot : ''}` }); await sleep(1500);
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`screenshots/${file}`, Buffer.from(data, 'base64')); console.log('saved screenshots/' + file);
}
console.log(errors.length ? 'JS errors: ' + errors.join(' | ') : 'no JS errors'); ws.close(); chrome.kill(); process.exit(errors.length ? 1 : 0);
