// Headless smoke test: loads ?smoke in Chrome, which exercises every view (ES+EN), sheets, examen, editor and ICS.
import { execFileSync } from 'node:child_process';
const port = process.argv[2] || '8790';
const dom = execFileSync('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--virtual-time-budget=5000',
  `--user-data-dir=/tmp/pdv-smoke-${Date.now()}`, '--dump-dom', `http://127.0.0.1:${port}/index.html?smoke`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const m = dom.match(/data-smoke="([^"]*)"/);
if (!m) { console.error('✗ smoke marker missing (app likely threw on load)'); process.exit(1); }
const res = JSON.parse(m[1].replace(/&quot;/g, '"'));
res.forEach((r) => console.log((r.startsWith('ok') ? '✓ ' : '✗ ') + r));
const bad = res.filter((r) => !r.startsWith('ok'));
console.log(`\n${res.length - bad.length} ok, ${bad.length} errors`); process.exit(bad.length ? 1 : 0);
