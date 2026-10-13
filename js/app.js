import * as D from './dates.js';
import { STR, ITEMS } from './i18n.js';
import { PRAYERS, PRAYER_ORDER, PRAYER_ORDER_SERAFIN } from './prayers.js';
import * as R from './rule.js';
import * as Store from './store.js';
import { buildIcs } from './ics.js';

const VERSION = '0.2.0';
let S = Store.load();
let tab = 'today';
const $ = (s, r = document) => r.querySelector(s);
const h = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const T = () => STR[S.settings.lang] || STR.es;
const L = () => S.settings.lang;
const persist = () => Store.save(S);
const today = () => new Date();
const SLOTS = ['morning', 'day', 'noon', 'afternoon', 'night', 'any'];
const SOURCE_URL = 'https://www.orthodoxchurchsheffield.com/post/prayer-rule-of-st-seraphim-for-daily-use';

// ---------- item helpers ----------
const isRC = (it, d) => it.key === 'angelus' && D.isEasterSeason(d);
function itemName(it, d = today()) {
  if (it.name) return it.name;
  const k = isRC(it, d) ? 'reginacoeli' : it.key;
  return ITEMS[L()][k]?.[0] || it.key;
}
function itemDesc(it, d = today()) {
  if (it.desc != null) return it.desc;
  const k = isRC(it, d) ? 'reginacoeli' : it.key;
  return ITEMS[L()][k]?.[1] || '';
}
const itemPrayer = (it, d = today()) => (it.prayer === 'angelus' && D.isEasterSeason(d) ? 'reginacoeli' : it.prayer);
const entry = (date, id) => S.log[date]?.[id];
const doneFn = (id) => (date) => !!S.log[date]?.[id]?.done;
function todaysItems(d = today()) {
  return S.items.filter((it) => it.enabled && D.showOn(it.freq, d, doneFn(it.id)));
}
function currentSlots(d = today()) {
  const m = d.getHours() * 60 + d.getMinutes();
  if (m < 9 * 60) return ['morning'];
  if (m < 19 * 60) return ['day', m < 14 * 60 ? 'noon' : 'afternoon'];
  return ['night'];
}
function nextItem(list) {
  const pending = list.filter((it) => !entry(D.ymd(today()), it.id)?.done);
  if (!pending.length) return null;
  // Current slot first, then 'any', then earlier (missed) slots, then later ones.
  const cur = currentSlots(), first = SLOTS.indexOf(cur[0]);
  const rank = (it) => { const i = SLOTS.indexOf(it.slot); return cur.includes(it.slot) ? i : it.slot === 'any' ? 10 : i < first ? 20 + i : 30 + i; };
  return pending.slice().sort((a, b) => rank(a) - rank(b) || (a.time || '99').localeCompare(b.time || '99'))[0];
}
function freqLabel(f) {
  const t = T();
  if (f.type === 'daily') return t.fDaily;
  if (f.type === 'weekdays') return (f.days || []).map((d) => t.weekdays[d].slice(0, 3)).join(' · ');
  if (f.type === 'weekly') return `${f.every > 1 ? `${t.every} ${f.every} ${t.weeks}` : t.fWeekly}${f.day != null ? ' · ' + t.weekdays[f.day] : ''}`;
  if (f.type === 'monthly') return `${t.fMonthly}${f.day ? ' · ' + f.day : ''}`;
  return '';
}

// ---------- theme ----------
function applyTheme() {
  const dark = S.settings.theme === 'dark' || (S.settings.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'pdv-dark' : 'pdv-light';
  document.documentElement.dataset.accent = S.settings.accent;
  document.documentElement.lang = L();
  document.title = T().appName;
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);

// ---------- toast + undo ----------
let toastTimer;
function toast(msg, undoFn) {
  const el = $('#toast');
  el.innerHTML = `<div class="alert rounded-2xl shadow-lg bg-neutral text-neutral-content border-0 py-3 px-4 flex gap-4"><span>${h(msg)}</span>${undoFn ? `<button class="btn btn-sm btn-ghost text-primary-content/90 underline" id="undo">${h(T().undo)}</button>` : ''}</div>`;
  if (undoFn) $('#undo').onclick = () => { undoFn(); el.innerHTML = ''; };
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (el.innerHTML = ''), 6000);
}
function setEntry(date, id, val, msg) {
  const prev = S.log[date]?.[id] ? { ...S.log[date][id] } : undefined;
  S.log[date] ||= {};
  if (val === undefined) delete S.log[date][id]; else S.log[date][id] = val;
  persist(); render();
  toast(msg, () => { S.log[date] ||= {}; if (prev === undefined) delete S.log[date][id]; else S.log[date][id] = prev; persist(); render(); });
}
function toggle(id) {
  const d = D.ymd(today()), e = entry(d, id), it = S.items.find((x) => x.id === id);
  if (e?.done) setEntry(d, id, { ...e, done: false }, T().unmarked);
  else { setEntry(d, id, { ...(e || {}), done: true, minutes: e?.minutes ?? it.minutes ?? null, at: Date.now() }, T().markedDone); if (navigator.vibrate) navigator.vibrate(8); }
}

// ---------- chime (WebAudio, no files) ----------
let actx;
function chime() {
  try {
    actx ||= new (window.AudioContext || window.webkitAudioContext)();
    const t0 = actx.currentTime;
    [[528, 0], [792, 0.02], [1056, 0.04], [528, 1.6]].forEach(([f, dt], i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + dt); g.gain.exponentialRampToValueAtTime(i === 3 ? 0.18 : 0.22 / (i + 1), t0 + dt + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 3.2);
      o.connect(g).connect(actx.destination); o.start(t0 + dt); o.stop(t0 + dt + 3.3);
    });
  } catch {}
}

// ---------- timer ----------
const timer = { id: null, total: 0, left: 0, endAt: 0, running: false, iv: null };
function timerTick() {
  if (!timer.running) return;
  timer.left = Math.max(0, Math.round((timer.endAt - Date.now()) / 1000));
  const el = $('#timer-display'); if (el) el.textContent = fmt(timer.left);
  const ring = $('#timer-ring'); if (ring) ring.style.strokeDashoffset = String(ringLen(54) * (timer.left / timer.total));
  if (timer.left <= 0) {
    timer.running = false; clearInterval(timer.iv); chime(); if (navigator.vibrate) navigator.vibrate([60, 80, 60]);
    const inp = $('#f-min'); if (inp) inp.value = Math.round(timer.total / 60);
    const lbl = $('#timer-state'); if (lbl) lbl.textContent = T().timerDone;
    renderTimerButtons();
  }
}
const fmt = (s) => `${D.pad(Math.floor(s / 60))}:${D.pad(s % 60)}`;
const ringLen = (r) => 2 * Math.PI * r;
function timerStart() { timer.endAt = Date.now() + timer.left * 1000; timer.running = true; clearInterval(timer.iv); timer.iv = setInterval(timerTick, 250); actx ||= new (window.AudioContext || window.webkitAudioContext)(); actx.resume?.(); renderTimerButtons(); }
function timerPause() { timerTick(); timer.running = false; clearInterval(timer.iv); renderTimerButtons(); }
function timerReset() { timerPause(); timer.left = timer.total; timerTick(); const el = $('#timer-display'); if (el) el.textContent = fmt(timer.left); const ring = $('#timer-ring'); if (ring) ring.style.strokeDashoffset = '0'; renderTimerButtons(); }
function renderTimerButtons() {
  const b = $('#timer-btns'); if (!b) return; const t = T();
  b.innerHTML = timer.running
    ? `<button class="btn btn-primary rounded-full px-8" data-t="pause">${t.pause}</button>`
    : `<button class="btn btn-primary rounded-full px-8" data-t="start" ${timer.left <= 0 ? 'disabled' : ''}>${timer.left < timer.total ? t.resume : t.start}</button><button class="btn btn-ghost rounded-full" data-t="reset">${t.reset}</button>`;
  b.querySelectorAll('[data-t]').forEach((x) => (x.onclick = () => ({ start: timerStart, pause: timerPause, reset: timerReset })[x.dataset.t]()));
}

// ---------- sheet ----------
const sheet = () => $('#sheet');
function openSheet(html, bind) { $('#sheet-body').innerHTML = html; bind?.($('#sheet-body')); if (!sheet().open) sheet().showModal(); }
function closeSheet() { sheet().close(); }

function srcHtml(src) {
  if (!src) return '';
  if (typeof src === 'string') return `<p class="text-xs opacity-50 mt-4">${h(src)}</p>`;
  return `<p class="text-xs opacity-55 mt-4 leading-snug">${h(T().source)}: <a class="underline" href="${h(src.url)}" target="_blank" rel="noopener">${h(src.label)}</a></p>`;
}
function openPrayer(pid) {
  const p = PRAYERS[pid]?.[L()]; if (!p) return;
  openSheet(`<h2 class="text-2xl font-semibold tracking-tight mb-4">${h(p.t)}</h2>
    <div class="whitespace-pre-line text-[1.05rem] leading-relaxed font-serif">${h(p.b)}</div>
    ${p.alt ? `<p class="text-sm opacity-70 mt-4">${h(p.alt)}</p>` : ''}${srcHtml(p.src)}
    <div class="modal-action"><button class="btn btn-ghost rounded-full" data-close>${T().close}</button></div>`,
  (r) => (r.querySelector('[data-close]').onclick = closeSheet));
}

function openItem(id) {
  const it = S.items.find((x) => x.id === id); if (!it) return;
  if (it.examen) return openExamen();
  if (it.kind === 'flow') return openFlow(it);
  if (it.kind === 'counter') return openCounter(it);
  const t = T(), d = D.ymd(today()), e = entry(d, id) || {}, pid = itemPrayer(it);
  if (it.minutes && timer.id !== id) { timerPause(); Object.assign(timer, { id, total: it.minutes * 60, left: it.minutes * 60 }); }
  const C = ringLen(54);
  openSheet(`
    <p class="text-sm opacity-60">${h(t.slots[it.slot])}${it.minutes ? ` · ${it.minutes} ${t.minutes}` : ''}</p>
    <h2 class="text-2xl font-semibold tracking-tight mt-1">${h(itemName(it))}</h2>
    <p class="opacity-70 mt-1">${h(itemDesc(it))}</p>
    ${pid ? `<button class="btn btn-ghost btn-sm rounded-full mt-3 -ml-2 text-primary" data-prayer="${pid}">${t.viewPrayer} →</button>` : ''}
    ${it.minutes ? `<div class="flex flex-col items-center my-6">
      <div class="relative w-40 h-40"><svg viewBox="0 0 120 120" class="w-40 h-40 -rotate-90"><circle cx="60" cy="60" r="54" class="fill-none stroke-base-300" stroke-width="6"/>
      <circle id="timer-ring" cx="60" cy="60" r="54" class="fill-none stroke-primary transition-[stroke-dashoffset] duration-300" stroke-width="6" stroke-linecap="round" stroke-dasharray="${C}" style="stroke-dashoffset:${C * (timer.left / timer.total)}"/></svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center"><span id="timer-display" class="text-4xl font-light tabular-nums">${fmt(timer.left)}</span><span id="timer-state" class="text-xs opacity-60">${t.timer}</span></div></div>
      <div id="timer-btns" class="flex gap-2 mt-4"></div></div>` : ''}
    <div class="space-y-3 mt-4">
      ${it.minutes ? `<label class="block"><span class="text-sm opacity-70">${t.minutesDone}</span><input id="f-min" type="number" inputmode="numeric" min="0" max="600" class="input input-lg w-full rounded-2xl mt-1" value="${h(e.minutes ?? '')}" placeholder="${it.minutes}"></label>` : ''}
      <label class="block"><span class="text-sm opacity-70">${t.note}</span><textarea id="f-note" rows="2" class="textarea w-full rounded-2xl mt-1 text-base">${h(e.note || '')}</textarea></label>
    </div>
    <div class="modal-action flex-wrap">
      <button class="btn btn-ghost rounded-full" data-close>${t.close}</button>
      ${e.done ? `<button class="btn btn-ghost rounded-full" data-unmark>${t.unmark}</button><button class="btn btn-primary rounded-full px-6" data-save>${t.save}</button>`
               : `<button class="btn btn-primary rounded-full px-8" data-done>${t.markDone}</button>`}
    </div>`, (r) => {
    renderTimerButtons();
    r.querySelector('[data-close]').onclick = closeSheet;
    r.querySelector('[data-prayer]')?.addEventListener('click', () => openPrayer(pid));
    const vals = () => { const m = r.querySelector('#f-min')?.value; return { minutes: m === '' || m == null ? (it.minutes ?? null) : Math.max(0, +m), note: r.querySelector('#f-note').value.trim() }; };
    r.querySelector('[data-done]')?.addEventListener('click', () => { closeSheet(); setEntry(d, id, { ...e, ...vals(), done: true, at: Date.now() }, t.markedDone); });
    r.querySelector('[data-save]')?.addEventListener('click', () => { closeSheet(); setEntry(d, id, { ...e, ...vals() }, t.noteSaved); });
    r.querySelector('[data-unmark]')?.addEventListener('click', () => { closeSheet(); setEntry(d, id, { ...e, ...vals(), done: false }, t.unmarked); });
  });
}

// ---------- step-by-step flow (Regla de San Serafín) ----------
const flowState = {};
const haptic = (kind) => {
  if (!navigator.vibrate || S.settings.haptic === 'off') return;
  if (kind === 'mark') navigator.vibrate(30); else if (kind === 'target' || kind === 'step') navigator.vibrate([40, 70, 40]);
};
function markDoneQuiet(id, extra = {}) {
  const d = D.ymd(today()); S.log[d] ||= {};
  S.log[d][id] = { ...(S.log[d][id] || {}), ...extra, done: true, at: Date.now() }; persist();
}
function openFlow(it) {
  const t = T(), d = D.ymd(today()), key = d + it.id, steps = it.steps || R.SERAFIN_RULE;
  if (entry(d, it.id)?.done && !flowState[key]) flowState[key] = { step: steps.length - 1, n: steps[steps.length - 1].count, finished: true };
  flowState[key] ||= { step: 0, n: 0 };
  let busy = false;
  const draw = () => {
    const st = flowState[key], cur = steps[st.step], p = PRAYERS[cur.prayer][L()];
    const total = R.flowTotal(steps), doneN = R.flowDoneCount(steps, st);
    openSheet(`
      <div class="flex items-center justify-between gap-2 mb-4">
        <div class="flex gap-1.5 flex-1">${steps.map((s, i) => `<span class="h-1 flex-1 rounded-full ${i < st.step || st.finished ? 'bg-primary' : i === st.step ? 'bg-primary/40' : 'bg-base-300'}"></span>`).join('')}</div>
        <span class="text-xs opacity-50 tabular-nums">${doneN}/${total}</span></div>
      <p class="text-sm opacity-60">${h(itemName(it))} · ${st.step + 1}/${steps.length}</p>
      ${st.finished ? `<div class="py-10 text-center"><p class="text-2xl font-semibold">${t.ruleDone}</p>${it.crossNote ? `<p class="mt-3 text-lg opacity-70">☩ ${t.crossNote}</p>` : ''}</div>
        <div class="modal-action"><button class="btn btn-ghost rounded-full" data-restart>${t.reset}</button><button class="btn btn-primary rounded-full px-8" data-close>${t.close}</button></div>` : `
      <h2 class="text-3xl font-semibold tracking-tight mt-1">${h(p.t)}</h2>
      <button id="flow-tap" class="outline-none block w-full text-left mt-4 rounded-3xl bg-base-200 active:bg-base-300 transition px-5 py-5 select-none" aria-label="${t.tapToCount}">
        <span class="block whitespace-pre-line font-serif ${p.b.length > 400 ? 'text-[1.15rem] leading-relaxed' : 'text-[1.5rem] leading-snug'}">${h(p.b)}</span></button>
      <div class="flex items-center justify-center gap-3 mt-5" aria-live="polite">
        ${Array.from({ length: cur.count }, (_, i) => `<span class="w-4 h-4 rounded-full border-2 border-primary ${i < st.n ? 'bg-primary' : ''}"></span>`).join('')}
        <span class="ml-2 text-xl font-semibold tabular-nums">${st.n}/${cur.count}</span></div>
      <p class="text-center text-xs opacity-50 mt-2">${t.tapAnywhere}</p>
      ${srcHtml(p.src)}
      <div class="modal-action"><button class="btn btn-ghost rounded-full" data-back>${t.back}</button><button class="btn btn-ghost rounded-full" data-close>${t.close}</button>
        <button class="btn btn-primary rounded-full px-8" data-count>+1</button></div>`}`, (r) => {
      r.querySelectorAll('[data-close]').forEach((b) => (b.onclick = () => { closeSheet(); render(); }));
      r.querySelector('[data-restart]')?.addEventListener('click', () => { flowState[key] = { step: 0, n: 0 }; draw(); });
      r.querySelector('[data-back]')?.addEventListener('click', () => { flowState[key] = R.flowBack(steps, st); draw(); });
      const tap = () => {
        if (busy) return;
        const nx = R.flowTap(steps, st);
        if (nx.done) { flowState[key] = { ...nx, finished: true }; markDoneQuiet(it.id, { count: R.flowTotal(steps) }); haptic('target'); return draw(); }
        if (nx.advance) { flowState[key] = { step: st.step, n: cur.count }; draw(); haptic('step'); busy = true; setTimeout(() => { busy = false; flowState[key] = { step: nx.step, n: nx.n }; draw(); $('#sheet-body')?.scrollTo?.(0, 0); }, 650); return; }
        flowState[key] = { step: nx.step, n: nx.n }; draw();
      };
      r.querySelector('#flow-tap')?.addEventListener('click', tap);
      r.querySelector('[data-count]')?.addEventListener('click', tap);
    });
  };
  draw();
}

// ---------- prayer-rope counter (chotki / komboskini) ----------
function openCounter(it) {
  const t = T(), d = D.ymd(today()), pr = PRAYERS[it.counterPrayer || it.prayer][L()], target = it.target || 100, C = ringLen(54);
  const count = () => entry(d, it.id)?.count || 0;
  const setCount = (n) => { S.log[d] ||= {}; const e = S.log[d][it.id] || {}; S.log[d][it.id] = { ...e, count: Math.max(0, n), done: e.done || n >= target, at: e.at || Date.now() }; persist(); };
  openSheet(`
    <p class="text-sm opacity-60">${h(t.slots[it.slot])}</p>
    <h2 class="text-2xl font-semibold tracking-tight mt-1">${h(itemName(it))}</h2>
    <p class="mt-3 font-serif text-[1.35rem] leading-snug">${h(pr.b)}</p>
    ${pr.alt ? `<p class="text-sm opacity-60 mt-2">${h(pr.alt)}</p>` : ''}
    <div class="flex flex-col items-center my-6">
      <button id="bead" class="relative w-56 h-56 rounded-full select-none outline-none focus-visible:ring-2 ring-primary/40 active:scale-[.97] transition-transform" aria-label="${t.tapToCount}">
        <svg viewBox="0 0 120 120" class="w-56 h-56 -rotate-90"><circle cx="60" cy="60" r="54" class="fill-base-200 stroke-base-300" stroke-width="5"/>
        <circle id="bead-ring" cx="60" cy="60" r="54" class="fill-none stroke-primary transition-[stroke-dashoffset] duration-200" stroke-width="5" stroke-linecap="round" stroke-dasharray="${C}" style="stroke-dashoffset:${C * (1 - Math.min(1, count() / target))}"/></svg>
        <span class="absolute inset-0 flex flex-col items-center justify-center"><span id="bead-n" class="text-6xl font-light tabular-nums">${count()}</span><span class="text-sm opacity-55">${t.of} ${target}</span></span>
      </button>
      <p class="text-xs opacity-50 mt-3">${t.tapToCount}</p>
    </div>
    ${srcHtml(pr.src)}
    <div class="modal-action flex-wrap"><button class="btn btn-ghost rounded-full" data-minus>−1</button><button class="btn btn-ghost rounded-full" data-zero>${t.reset}</button>
      <button class="btn btn-primary rounded-full px-8" data-close>${t.finish2}</button></div>`, (r) => {
    const upd = () => { r.querySelector('#bead-n').textContent = count(); r.querySelector('#bead-ring').style.strokeDashoffset = String(C * (1 - Math.min(1, count() / target))); };
    r.querySelector('#bead').onclick = () => { const n = count() + 1; setCount(n); const fb = R.beadFeedback(n, S.settings.haptic, target); if (fb !== 'bead') haptic(fb); upd(); };
    r.querySelector('[data-minus]').onclick = () => { setCount(count() - 1); upd(); };
    r.querySelector('[data-zero]').onclick = () => { const prev = entry(d, it.id) ? { ...entry(d, it.id) } : undefined; S.log[d][it.id] = { count: 0, done: false }; persist(); upd(); toast(t.reset, () => { S.log[d][it.id] = prev; persist(); upd(); }); };
    r.querySelector('[data-close]').onclick = () => { if (count() > 0) markDoneQuiet(it.id); closeSheet(); render(); };
  });
}

// ---------- examen ----------
function openExamen() {
  const t = T(), d = D.ymd(today());
  const draft = { ...(S.examen[d] || {}) }; let step = 0;
  const keys = ['thanks', 'light', 'review', 'contrition', 'proposito'];
  const draw = () => {
    const s = t.examenSteps[step], last = step === keys.length - 1;
    openSheet(`
      <div class="flex gap-1.5 mb-6">${keys.map((_, i) => `<span class="h-1 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-base-300'}"></span>`).join('')}</div>
      <p class="text-sm opacity-60">${t.examenTitle} · ${step + 1}/${keys.length}</p>
      <h2 class="text-3xl font-semibold tracking-tight mt-1">${h(s.t)}</h2>
      <p class="mt-3 text-lg leading-relaxed opacity-80">${h(s.p)}</p>
      ${s.ph || last ? `<textarea id="ex-in" rows="3" class="textarea w-full rounded-2xl mt-5 text-base" placeholder="${h(s.ph)}">${h(draft[keys[step]] || '')}</textarea>` : '<div class="h-10"></div>'}
      <div class="modal-action">
        <button class="btn btn-ghost rounded-full" data-back>${step ? t.back : t.cancel}</button>
        <button class="btn btn-primary rounded-full px-8" data-next>${last ? t.finish : t.continue}</button>
      </div>`, (r) => {
      const grab = () => { const v = r.querySelector('#ex-in'); if (v) draft[keys[step]] = v.value.trim(); };
      r.querySelector('[data-back]').onclick = () => { grab(); if (step) { step--; draw(); } else closeSheet(); };
      r.querySelector('[data-next]').onclick = () => {
        grab();
        if (!last) { step++; return draw(); }
        S.examen[d] = { ...draft, at: Date.now() }; closeSheet();
        const it = S.items.find((x) => x.examen);
        if (it && !entry(d, it.id)?.done) setEntry(d, it.id, { done: true, at: Date.now() }, t.examenSaved);
        else { persist(); render(); toast(t.examenSaved); }
      };
    });
  };
  draw();
}

// ---------- views ----------
function ring(done, total, size = 132) {
  const r = 52, C = ringLen(r), frac = total ? done / total : 0;
  return `<svg viewBox="0 0 120 120" width="${size}" height="${size}" class="-rotate-90" aria-hidden="true">
    <circle cx="60" cy="60" r="${r}" class="fill-none stroke-base-300" stroke-width="7"/>
    <circle cx="60" cy="60" r="${r}" class="fill-none stroke-primary transition-all duration-700" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - frac)}"/></svg>`;
}
function introCard(open = false) {
  const t = T();
  return `<details class="rounded-3xl bg-base-100 px-5 py-4 mb-6" ${open ? 'open' : ''}><summary class="cursor-pointer font-semibold text-primary list-none flex justify-between items-center">☩ ${t.introTitle}<span class="opacity-50 text-sm">ⓘ</span></summary>
    <p class="mt-3 leading-relaxed opacity-80">${t.intro}</p>
    <p class="text-xs opacity-55 mt-3">${t.introSrc}: <a class="underline" href="${SOURCE_URL}" target="_blank" rel="noopener">orthodoxchurchsheffield.com</a></p></details>`;
}
function viewToday() {
  const t = T(), now = today(), d = D.ymd(now), list = todaysItems(now);
  const doneN = list.filter((it) => entry(d, it.id)?.done).length;
  const y = S.examen[D.ymd(D.addDays(now, -1))]?.proposito;
  const nx = nextItem(list);
  const groups = SLOTS.map((s) => [s, list.filter((it) => it.slot === s).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'))]).filter(([, l]) => l.length);
  const row = (it) => {
    const e = entry(d, it.id), done = !!e?.done, flex = D.isFlexible(it.freq);
    const meta = [it.time, it.kind === 'counter' && e?.count ? `${e.count}/${it.target || 100}` : null, it.kind === 'flow' && it.steps ? it.steps.map((x) => x.count).join('·') : null, it.minutes && (done && e.minutes != null ? t.minutesOf(e.minutes, it.minutes) : `${it.minutes} ${t.minutes}`), flex && !done && (it.freq.type === 'weekly' ? t.pendingWeek : t.pendingMonth), e?.note && '✎'].filter(Boolean).join(' · ');
    return `<li class="flex items-center gap-3 bg-base-100 rounded-2xl px-3 py-2 shadow-[0_1px_0_rgba(0,0,0,.03)]">
      <button class="check shrink-0 w-12 h-12 grid place-items-center rounded-full" data-toggle="${it.id}" aria-pressed="${done}" aria-label="${h(itemName(it))}">
        <span class="w-7 h-7 rounded-full border-2 grid place-items-center transition ${done ? 'bg-primary border-primary text-primary-content' : 'border-base-content/25'}">${done ? '<svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : ''}</span></button>
      <button class="flex-1 text-left py-2 min-h-12" data-open="${it.id}">
        <span class="block text-[1.07rem] font-medium leading-snug ${done ? 'opacity-45' : ''}">${h(itemName(it, now))}</span>
        ${meta ? `<span class="block text-sm opacity-55 mt-0.5">${h(meta)}</span>` : ''}</button></li>`;
  };
  const dateStr = L() === 'es' ? `${t.weekdays[now.getDay()]}, ${now.getDate()} de ${t.months[now.getMonth()]}` : `${t.weekdays[now.getDay()]}, ${t.months[now.getMonth()]} ${now.getDate()}`;
  return `
    <header class="mb-6"><p class="text-sm opacity-55 uppercase tracking-wider">${h(dateStr)}</p><h1 class="text-4xl font-bold tracking-tight mt-1">${t.tabToday}</h1></header>
    ${y ? `<section class="rounded-3xl bg-primary/8 border border-primary/15 px-5 py-4 mb-6"><p class="text-xs uppercase tracking-wider text-primary font-semibold">${t.yesterdayProposito}</p><p class="mt-1 text-lg leading-snug">${h(y)}</p></section>` : ''}
    ${S.template === 'serafin' ? introCard() : ''}
    <section class="flex items-center gap-6 mb-6">
      <div class="relative shrink-0">${ring(doneN, list.length)}<div class="absolute inset-0 grid place-items-center text-center"><div><div class="text-3xl font-semibold tabular-nums">${doneN}<span class="opacity-40 text-xl">/${list.length}</span></div></div></div></div>
      <div class="flex-1 min-w-0">${nx
        ? `<p class="text-sm opacity-55">${t.next}</p><button class="btn btn-primary btn-lg rounded-2xl w-full mt-2 h-auto min-h-14 py-3 justify-start text-left normal-case" data-open="${nx.id}"><span class="block"><span class="block text-lg leading-tight">${h(itemName(nx, now))}</span>${nx.minutes ? `<span class="block text-sm font-normal opacity-80">${nx.minutes} ${t.minutes}</span>` : ''}</span></button>`
        : `<p class="text-xl font-medium leading-snug">${t.allDone}</p><p class="opacity-55 mt-1">${t.allDoneSub}</p>`}</div>
    </section>
    ${groups.map(([s, l]) => `<section class="mb-5"><h2 class="text-sm font-semibold opacity-50 uppercase tracking-wider mb-2 px-1">${t.slots[s]}</h2><ul class="space-y-2">${l.map(row).join('')}</ul>
      ${s === 'night' ? `<button class="btn btn-ghost rounded-full mt-2 text-primary" data-examen>☾ ${t.examenBtn}</button>` : ''}</section>`).join('')}
    ${!groups.some(([s]) => s === 'night') ? `<button class="btn btn-ghost rounded-full text-primary" data-examen>☾ ${t.examenBtn}</button>` : ''}`;
}

function viewWeek() {
  const t = T(), now = today(), enabled = S.items.filter((i) => i.enabled);
  // heatmap: 12 weeks ending this week (Mon-start columns)
  const start = D.addDays(D.mondayOf(now), -7 * 11);
  const cell = (x) => {
    if (x > now) return '<span class="w-full aspect-square rounded-[5px]"></span>';
    const ds = D.ymd(x); let due = 0, dn = 0;
    for (const it of enabled) if (D.isScheduled(it.freq, x) && !D.isFlexible(it.freq)) { due++; if (S.log[ds]?.[it.id]?.done) dn++; }
    const f = due ? dn / due : 0, lvl = f === 0 ? 0 : f < 0.34 ? 1 : f < 0.67 ? 2 : f < 1 ? 3 : 4;
    const cls = ['bg-base-300', 'bg-primary/25', 'bg-primary/50', 'bg-primary/75', 'bg-primary'][lvl];
    return `<span title="${ds}: ${dn}/${due}" class="w-full aspect-square rounded-[5px] ${cls} ${ds === D.ymd(now) ? 'ring-2 ring-primary/40 ring-offset-1 ring-offset-base-100' : ''}"></span>`;
  };
  let cols = '';
  for (let w = 0; w < 12; w++) { cols += '<div class="grid grid-rows-7 gap-1">'; for (let i = 0; i < 7; i++) cols += cell(D.addDays(start, w * 7 + i)); cols += '</div>'; }
  const rows = enabled.map((it) => {
    const span = Math.max(1, Math.min(7, D.dayDiff(D.parseYmd(S.createdAt || D.ymd(now)), now) + 1)); // only count days since first use
    const c = D.consistency(it.freq, now, doneFn(it.id), span); if (!c.due) return '';
    const flex = D.isFlexible(it.freq), sk = D.streak(it.freq, now, doneFn(it.id));
    const txt = flex ? `${c.done ? t.flexDone : t.flexPending} ${it.freq.type === 'weekly' ? t.thisWeek : t.thisMonth}` : t.consistency(c.done, c.due);
    return `<li class="flex items-center justify-between gap-3 py-3"><span class="min-w-0"><span class="block font-medium truncate">${h(itemName(it, now))}</span>${sk >= 3 ? `<span class="text-xs opacity-50">${t.streakDays(sk)}</span>` : ''}</span>
      <span class="shrink-0 text-sm tabular-nums ${c.done ? 'text-primary' : 'opacity-50'}">${txt}</span></li>`;
  }).join('');
  const days = Object.keys(S.examen).sort().reverse().slice(0, 14);
  const enc = t.encourage[now.getDate() % t.encourage.length];
  return `
    <header class="mb-6"><h1 class="text-4xl font-bold tracking-tight">${t.weekTitle}</h1><p class="opacity-60 mt-1">${h(enc)}</p></header>
    <section class="bg-base-100 rounded-3xl p-5 mb-5"><h2 class="text-sm font-semibold opacity-50 uppercase tracking-wider mb-3">${t.last12}</h2>
      <div class="flex gap-2"><div class="grid grid-rows-7 gap-1 text-[10px] opacity-40 w-3">${[1, 2, 3, 4, 5, 6, 0].map((i) => `<span class="leading-none flex items-center">${t.weekdaysShort[i]}</span>`).join('')}</div>
      <div class="grid grid-cols-12 gap-1 flex-1">${cols}</div></div></section>
    <section class="bg-base-100 rounded-3xl px-5 py-3 mb-5"><h2 class="text-sm font-semibold opacity-50 uppercase tracking-wider mt-2">${t.perPractice}</h2><ul class="divide-y divide-base-300">${rows}</ul></section>
    <section class="bg-base-100 rounded-3xl px-5 py-4"><h2 class="text-sm font-semibold opacity-50 uppercase tracking-wider mb-2">${t.journal}</h2>
      ${days.length ? `<ul class="space-y-3">${days.map((k) => `<li><p class="text-xs opacity-50">${k}</p>${S.examen[k].proposito ? `<p class="font-medium">${h(S.examen[k].proposito)}</p>` : ''}${S.examen[k].thanks ? `<p class="text-sm opacity-60">♡ ${h(S.examen[k].thanks)}</p>` : ''}</li>`).join('')}</ul>` : `<p class="opacity-50">${t.noJournal}</p>`}</section>`;
}

function viewPrayers() {
  const t = T(), rc = D.isEasterSeason(today());
  return `<header class="mb-6"><h1 class="text-4xl font-bold tracking-tight">${t.prayersTitle}</h1></header>
    ${S.template === 'serafin' ? introCard(true) : ''}
    <ul class="bg-base-100 rounded-3xl divide-y divide-base-300 overflow-hidden">${(S.template === 'serafin' ? PRAYER_ORDER_SERAFIN : PRAYER_ORDER).map((p) => `<li><button class="w-full text-left px-5 py-4 flex justify-between items-center active:bg-base-200" data-prayer="${p}">
      <span class="text-[1.07rem] font-medium">${h(PRAYERS[p][L()].t)}</span><span class="opacity-40 text-sm">${(p === 'reginacoeli' && rc) || (p === 'angelus' && !rc) ? '● ' : ''}›</span></button></li>`).join('')}</ul>`;
}

function seg(name, opts, cur) {
  return `<div class="join w-full">${opts.map(([v, l]) => `<button class="join-item btn btn-sm flex-1 ${v === cur ? 'btn-primary' : 'btn-ghost bg-base-200'}" data-set="${name}" data-v="${v}">${h(l)}</button>`).join('')}</div>`;
}
function viewSettings() {
  const t = T(), st = S.settings;
  const perm = !('Notification' in window) ? t.notifUnsupported : Notification.permission === 'denied' ? t.notifDenied : st.notif && Notification.permission === 'granted' ? t.notifOn : '';
  const card = (title, body) => `<section class="bg-base-100 rounded-3xl px-5 py-4 mb-4"><h2 class="text-sm font-semibold opacity-50 uppercase tracking-wider mb-3">${title}</h2>${body}</section>`;
  return `<header class="mb-6"><h1 class="text-4xl font-bold tracking-tight">${t.settingsTitle}</h1></header>
    ${card(t.language, seg('lang', [['es', 'Español'], ['en', 'English']], st.lang))}
    ${card(t.theme, seg('theme', [['auto', t.themeAuto], ['light', t.themeLight], ['dark', t.themeDark]], st.theme) + '<div class="h-3"></div>' + seg('accent', [['burgundy', t.accentBurgundy], ['gold', t.accentGold], ['blue', t.accentBlue]], st.accent))}
    ${card(t.template, `<div class="flex flex-col gap-2">${[['serafin', t.tplSerafin], ['catolico', t.tplCatolico]].map(([k, l]) => `<button class="btn rounded-full ${S.template === k ? 'btn-primary' : 'btn-ghost bg-base-200'}" data-tpl="${k}">${S.template === k ? '✓ ' : ''}${h(l)}</button>`).join('')}</div>`)}
    ${card(t.haptic, seg('haptic', [['off', t.hapticOff], ['10', t.hapticEvery(10)], ['33', t.hapticEvery(33)], ['100', t.hapticEvery(100)]], st.haptic || '33') + `<p class="text-xs opacity-50 mt-2">${t.hapticNote}</p>`)}
    ${card(t.plan, `<ul class="divide-y divide-base-300 -mx-1">${S.items.map((it) => `<li class="flex items-center gap-3 py-2.5 px-1">
        <input type="checkbox" class="toggle toggle-primary toggle-sm" data-enable="${it.id}" ${it.enabled ? 'checked' : ''} aria-label="${t.active}">
        <button class="flex-1 text-left min-w-0" data-edit="${it.id}"><span class="block font-medium truncate ${it.enabled ? '' : 'opacity-40'}">${h(itemName(it))}</span><span class="block text-xs opacity-50">${h(t.slots[it.slot])} · ${h(freqLabel(it.freq))}${it.time ? ' · ' + it.time : ''}${it.minutes ? ` · ${it.minutes} ${t.minutes}` : ''}</span></button><span class="opacity-30">›</span></li>`).join('')}</ul>
      <button class="btn btn-ghost rounded-full text-primary mt-2 -ml-3" data-add>+ ${t.addItem}</button>`)}
    ${card(t.reminders, `<p class="text-sm opacity-70 leading-relaxed">${t.remindersHonest}</p>
      <div class="flex flex-col gap-2 mt-3"><button class="btn btn-primary rounded-full" data-ics>${t.exportIcs}</button><p class="text-xs opacity-50">${t.icsNote}</p>
      <button class="btn btn-ghost bg-base-200 rounded-full" data-notif ${'Notification' in window ? '' : 'disabled'}>${t.enableNotif}</button>${perm ? `<p class="text-xs opacity-60 text-center">${perm}</p>` : ''}</div>`)}
    ${card(t.backup, `<div class="flex flex-col gap-2"><button class="btn btn-ghost bg-base-200 rounded-full" data-export>${t.exportJson}</button>
      <label class="btn btn-ghost bg-base-200 rounded-full">${t.importJson}<input type="file" accept="application/json,.json" class="hidden" data-import></label></div>`)}
    ${card(t.privacy, `<p class="text-sm opacity-70 leading-relaxed">🔒 ${t.privacyText}</p>`)}
    ${card(t.install, `<p class="text-sm opacity-70 leading-relaxed">${t.installText}</p>`)}
    <button class="btn btn-ghost text-error rounded-full w-full mt-2" data-reset>${t.resetAll}</button>
    <p class="text-center text-xs opacity-40 mt-6">${t.appName} · ${t.version} ${VERSION}</p>`;
}

function openEditor(id) {
  const t = T(), isNew = !id;
  const it = isNew ? { id: 'c' + Date.now().toString(36), key: null, name: '', desc: '', slot: 'any', time: null, minutes: null, freq: { type: 'daily' }, enabled: true, prayer: null }
    : JSON.parse(JSON.stringify(S.items.find((x) => x.id === id)));
  const f = it.freq;
  const opt = (v, l, cur) => `<option value="${v}" ${String(v) === String(cur) ? 'selected' : ''}>${h(l)}</option>`;
  const lab = (l, inner) => `<label class="block"><span class="text-sm opacity-70">${l}</span>${inner}</label>`;
  openSheet(`<h2 class="text-2xl font-semibold tracking-tight mb-4">${isNew ? t.addItem : t.editItem}</h2>
    <div class="space-y-3">
      ${lab(t.name, `<input id="e-name" class="input w-full rounded-xl mt-1" value="${h(itemName(it))}">`)}
      ${lab(t.description, `<input id="e-desc" class="input w-full rounded-xl mt-1" value="${h(itemDesc(it))}">`)}
      <div class="grid grid-cols-2 gap-3">
        ${lab(t.slot, `<select id="e-slot" class="select w-full rounded-xl mt-1">${SLOTS.map((s) => opt(s, t.slots[s], it.slot)).join('')}</select>`)}
        ${lab(t.targetMin, `<input id="e-min" type="number" min="0" inputmode="numeric" class="input w-full rounded-xl mt-1" value="${h(it.minutes ?? '')}">`)}
      </div>
      ${it.kind === 'counter' ? lab(t.repsTarget, `<input id="e-target" type="number" min="1" inputmode="numeric" class="input w-full rounded-xl mt-1" value="${h(it.target || 100)}">`) : ''}
      ${it.kind === 'flow' ? `<p class="text-sm opacity-70">${t.steps}: ${(it.steps || []).map((x) => `${h(PRAYERS[x.prayer][L()].t)} ×${x.count}`).join(' · ')}</p>` : ''}
      ${lab(t.time, `<input id="e-time" type="time" class="input w-full rounded-xl mt-1" value="${h(it.time || '')}">`)}
      ${lab(t.frequency, `<select id="e-ftype" class="select w-full rounded-xl mt-1">${[['daily', t.fDaily], ['weekdays', t.fWeekdays], ['weekly', t.fWeekly], ['monthly', t.fMonthly]].map(([v, l]) => opt(v, l, f.type)).join('')}</select>`)}
      <div id="e-fx"></div>
      ${lab(t.prayerLink, `<select id="e-prayer" class="select w-full rounded-xl mt-1">${opt('', '—', it.prayer || '')}${[...PRAYER_ORDER_SERAFIN, ...PRAYER_ORDER.filter((x) => x !== 'examen')].map((p) => opt(p, PRAYERS[p][L()].t, it.prayer || '')).join('')}</select>`)}
    </div>
    <div class="modal-action">${!isNew ? `<button class="btn btn-ghost text-error rounded-full mr-auto" data-del>${t.deleteItem}</button>` : ''}
      <button class="btn btn-ghost rounded-full" data-close>${t.cancel}</button><button class="btn btn-primary rounded-full px-6" data-save>${t.save}</button></div>`, (r) => {
    const fx = r.querySelector('#e-fx');
    const drawFx = () => {
      const ty = r.querySelector('#e-ftype').value;
      if (ty === 'weekdays') { const days = f.days || []; fx.innerHTML = `<div class="flex gap-1 justify-between">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<label class="flex-1"><input type="checkbox" class="peer hidden" data-wd="${d}" ${days.includes(d) ? 'checked' : ''}><span class="btn btn-sm w-full peer-checked:btn-primary">${t.weekdaysShort[d]}</span></label>`).join('')}</div>`; }
      else if (ty === 'weekly') fx.innerHTML = `<div class="grid grid-cols-2 gap-3">${lab(t.every, `<select id="e-every" class="select w-full rounded-xl mt-1">${[1, 2, 3, 4].map((n) => opt(n, n === 1 ? t.fWeekly : `${n} ${t.weeks}`, f.every || 1)).join('')}</select>`)}
        ${lab('&nbsp;', `<select id="e-wday" class="select w-full rounded-xl mt-1">${opt('', t.anyDay, f.day ?? '')}${[1, 2, 3, 4, 5, 6, 0].map((d) => opt(d, t.weekdays[d], f.day ?? '')).join('')}</select>`)}</div>`;
      else if (ty === 'monthly') fx.innerHTML = lab(t.dayOfMonth, `<select id="e-mday" class="select w-full rounded-xl mt-1">${opt('', t.anyDay, f.day ?? '')}${Array.from({ length: 31 }, (_, i) => opt(i + 1, i + 1, f.day ?? '')).join('')}</select>`);
      else fx.innerHTML = '';
    };
    r.querySelector('#e-ftype').onchange = drawFx; drawFx();
    r.querySelector('[data-close]').onclick = closeSheet;
    r.querySelector('[data-del]')?.addEventListener('click', () => {
      const idx = S.items.findIndex((x) => x.id === it.id), removed = S.items[idx];
      S.items.splice(idx, 1); persist(); closeSheet(); render();
      toast(t.deleteItem + ' ✓', () => { S.items.splice(idx, 0, removed); persist(); render(); });
    });
    r.querySelector('[data-save]').onclick = () => {
      const g = (s) => r.querySelector(s)?.value;
      const nm = g('#e-name').trim(), ds = g('#e-desc').trim(); if (!nm) return r.querySelector('#e-name').focus();
      if (!it.key || nm !== itemName({ ...it, name: null })) it.name = nm;
      if (!it.key || ds !== itemDesc({ ...it, desc: null })) it.desc = ds;
      it.slot = g('#e-slot'); it.time = g('#e-time') || null; it.minutes = +g('#e-min') || null; it.prayer = g('#e-prayer') || null; if (it.kind === 'counter') it.target = Math.max(1, +g('#e-target') || 100);
      const ty = g('#e-ftype');
      if (ty === 'daily') it.freq = { type: 'daily' };
      if (ty === 'weekdays') { const days = [...r.querySelectorAll('[data-wd]:checked')].map((x) => +x.dataset.wd); it.freq = days.length ? { type: 'weekdays', days } : { type: 'daily' }; }
      if (ty === 'weekly') it.freq = { type: 'weekly', every: +g('#e-every') || 1, day: g('#e-wday') === '' ? null : +g('#e-wday'), anchor: f.anchor || D.ymd(D.mondayOf(today())) };
      if (ty === 'monthly') it.freq = { type: 'monthly', day: g('#e-mday') === '' ? null : +g('#e-mday') };
      if (isNew) S.items.push(it); else S.items[S.items.findIndex((x) => x.id === it.id)] = it;
      persist(); closeSheet(); render();
    };
  });
}

function download(name, text, type) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

// ---------- render ----------
function renderTabs() {
  const t = T(), icons = {
    today: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 2"/>', week: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    prayers: '<path d="M6 4h9a3 3 0 0 1 3 3v13H9a3 3 0 0 1-3-3z"/><path d="M12 8v6M9.5 10.5h5"/>', settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>' };
  $('#tabs > div').innerHTML = [['today', t.tabToday], ['week', t.tabWeek], ['prayers', t.tabPrayers], ['settings', t.tabSettings]].map(([k, l]) =>
    `<button class="flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${tab === k ? 'text-primary font-semibold' : 'opacity-55'}" data-tab="${k}" aria-current="${tab === k}">
      <svg viewBox="0 0 24 24" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[k]}</svg>${l}</button>`).join('');
}
function render() {
  applyTheme(); renderTabs();
  const v = $('#view');
  v.innerHTML = { today: viewToday, week: viewWeek, prayers: viewPrayers, settings: viewSettings }[tab]();
}
document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-tpl],[data-tab],[data-toggle],[data-open],[data-examen],[data-prayer],[data-set],[data-edit],[data-add],[data-ics],[data-export],[data-notif],[data-reset]');
  if (!el || el.closest('#sheet-body')) return;
  const ds = el.dataset, t = T();
  if (ds.tpl) {
    if (ds.tpl === S.template) return;
    const name = ds.tpl === 'serafin' ? t.tplSerafin : t.tplCatolico;
    if (!(window.__smokeConfirm || confirm(t.tplConfirm(name)))) return;
    S = R.switchTemplate(S, ds.tpl, Store.SEEDS); persist(); render(); toast(t.tplSwitched);
  } else if (ds.tab) { tab = ds.tab; render(); scrollTo(0, 0); }
  else if (ds.toggle) toggle(ds.toggle);
  else if (ds.open) openItem(ds.open);
  else if ('examen' in ds) openExamen();
  else if (ds.prayer) openPrayer(ds.prayer);
  else if (ds.set) { S.settings[ds.set] = ds.v; persist(); render(); }
  else if (ds.edit) openEditor(ds.edit);
  else if ('add' in ds) openEditor(null);
  else if ('ics' in ds) {
    const items = S.items.filter((i) => i.enabled).map((i) => ({ id: i.id, title: itemName(i), desc: itemDesc(i), time: i.time, freq: i.freq, minutes: i.minutes }));
    download('plan-de-vida.ics', buildIcs(items), 'text/calendar');
  } else if ('export' in ds) download(`plan-de-vida-${D.ymd(today())}.json`, JSON.stringify(S, null, 2), 'application/json');
  else if ('notif' in ds) Notification.requestPermission().then((p) => { S.settings.notif = p === 'granted'; persist(); render(); });
  else if ('reset' in ds) { if ((prompt(t.resetConfirm) || '').trim().toUpperCase() === t.resetWord) { const lang = S.settings.lang; Store.clear(); S = Store.fresh(); S.settings.lang = lang; persist(); tab = 'today'; render(); toast(t.resetDone); } }
});
document.addEventListener('change', (ev) => {
  const el = ev.target;
  if (el.dataset.enable) { const it = S.items.find((x) => x.id === el.dataset.enable); it.enabled = el.checked; persist(); render(); }
  if ('import' in el.dataset && el.files[0]) el.files[0].text().then((txt) => {
    try { const obj = JSON.parse(txt); if (!Store.validate(obj)) throw 0; S = obj; persist(); render(); toast(T().imported); } catch { toast(T().importError); }
  });
});

// ---------- in-app reminders (only while open) ----------
const notified = new Set();
function checkReminders() {
  if (!S.settings.notif || !('Notification' in window) || Notification.permission !== 'granted') return;
  const now = today(), hm = `${D.pad(now.getHours())}:${D.pad(now.getMinutes())}`, d = D.ymd(now);
  for (const it of todaysItems(now)) {
    const k = d + it.id;
    if (it.time === hm && !entry(d, it.id)?.done && !notified.has(k)) {
      notified.add(k);
      const opts = { body: T().reminderBody, icon: 'icons/icon-192.png', tag: k };
      navigator.serviceWorker?.ready.then((r) => r.showNotification(itemName(it), opts)).catch(() => new Notification(itemName(it), opts));
    }
  }
}
setInterval(checkReminders, 20000);
// Re-render when the day changes or app returns to foreground.
let lastDay = D.ymd(today());
document.addEventListener('visibilitychange', () => { if (!document.hidden && D.ymd(today()) !== lastDay) { lastDay = D.ymd(today()); render(); } });

if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
render();

// ---------- smoke test hook (?smoke) ----------
// ---------- screenshot hook (?shot=flow|counter): synchronous, no animations ----------
const SHOT = new URLSearchParams(location.search).get('shot');
if (SHOT) {
  document.documentElement.classList.add('noanim');
  if (SHOT === 'flow') { openItem('s_manana'); $('#flow-tap').click(); }
  if (SHOT === 'counter') { openItem('s_dia'); for (let i = 0; i < 47; i++) $('#bead').click(); }
  document.activeElement?.blur?.();
}
if (!SHOT && new URLSearchParams(location.search).has('smoke')) {
  window.__smoke = []; window.__smokeConfirm = true;
  addEventListener('error', (e) => window.__smoke.push('ERR window: ' + e.message));
  const step = (name, fn) => { try { fn(); window.__smoke.push('ok ' + name); } catch (e) { window.__smoke.push('ERR ' + name + ': ' + e.message); } };
  const tapN = (sel, n) => { for (let i = 0; i < n; i++) $(sel).click(); };
  step('default template is serafin', () => { if (S.template !== 'serafin' || !S.items.some((i) => i.id === 's_manana')) throw new Error(S.template); });
  for (const lang of ['es', 'en']) {
    S.settings.lang = lang;
    for (const tb of ['today', 'week', 'prayers', 'settings']) step(`${lang}/${tb}`, () => { tab = tb; render(); });
    tab = 'today'; render();
    step(`${lang}/toggle+undo`, () => { $('[data-toggle]').click(); $('#undo').click(); });
    step(`${lang}/morning flow`, () => {
      openItem('s_manana'); for (const k in flowState) delete flowState[k]; openItem('s_manana');
      tapN('#flow-tap', 3); // Padre Nuestro 3/3 → auto-advance after delay
    });
    step(`${lang}/jesus counter`, () => { const c0 = entry(D.ymd(today()), 's_dia')?.count || 0; openItem('s_dia'); tapN('#bead', 12); $('[data-minus]').click(); if (entry(D.ymd(today()), 's_dia').count !== c0 + 11) throw new Error('count'); $('[data-close]').click(); });
    step(`${lang}/theotokos counter`, () => { openItem('s_cena'); tapN('#bead', 3); $('[data-close]').click(); });
    step(`${lang}/examen`, () => { openExamen(); for (let i = 0; i < 5; i++) { const ta = $('#ex-in'); if (ta) ta.value = 'x'; $('[data-next]').click(); } });
    step(`${lang}/prayers`, () => { for (const p of [...PRAYER_ORDER_SERAFIN, ...PRAYER_ORDER]) openPrayer(p); closeSheet(); });
    step(`${lang}/editor`, () => { openEditor('s_dia'); $('#e-target').value = '33'; $('[data-save]').click(); if (S.items.find((i) => i.id === 's_dia').target !== 33) throw new Error('target'); openEditor(null); $('#e-name').value = 'Oración con los niños'; $('[data-save]').click(); });
    step(`${lang}/ics`, () => { if (!buildIcs(S.items.map((i) => ({ ...i, title: itemName(i) }))).includes('RRULE')) throw new Error('no rrule'); });
    step(`${lang}/week-after`, () => { tab = 'week'; render(); });
  }
  step('template → catolico keeps history', () => {
    const before = Object.keys(S.log).length; tab = 'settings'; render(); $('[data-tpl="catolico"]').click();
    if (S.template !== 'catolico' || !S.items.some((i) => i.id === 'rosario') || Object.keys(S.log).length !== before) throw new Error('switch');
    tab = 'today'; render(); openItem('oracion_m'); ($('[data-done]') || $('[data-save]')).click();
  });
  step('template → serafin restores plan', () => { tab = 'settings'; render(); $('[data-tpl="serafin"]').click(); if (!S.items.some((i) => i.name === 'Oración con los niños')) throw new Error('restore'); });
  const want = new URLSearchParams(location.search).get('shot');
  setTimeout(() => {
    step('flow auto-advanced', () => { const k = D.ymd(today()) + 's_manana'; if (flowState[k].step !== 1) throw new Error('step ' + flowState[k].step); });
    closeSheet(); S.settings.lang = 'es'; tab = new URLSearchParams(location.search).get('tab') || 'today'; render();
    document.body.dataset.smoke = JSON.stringify(window.__smoke);
  }, 1200);
}
