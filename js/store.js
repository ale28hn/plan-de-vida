import { ymd, mondayOf } from './dates.js';
import { SERAFIN_RULE } from './rule.js';
const KEY = 'plandevida.v1';
const D = { type: 'daily' };
export const seedCatolico = () => [
  { key: 'ofrecimiento', slot: 'morning', time: '06:00', minutes: null, freq: D, prayer: 'ofrecimiento' },
  { key: 'oracion_m', slot: 'morning', time: '06:15', minutes: 15, freq: D },
  { key: 'misa', slot: 'morning', time: '07:00', minutes: null, freq: D },
  { key: 'angelus', slot: 'noon', time: '12:00', minutes: null, freq: D, prayer: 'angelus' },
  { key: 'lectura_esp', slot: 'any', time: null, minutes: 10, freq: D },
  { key: 'nt', slot: 'any', time: null, minutes: 5, freq: D },
  { key: 'rosario', slot: 'afternoon', time: null, minutes: null, freq: D },
  { key: 'visita', slot: 'afternoon', time: null, minutes: null, freq: D },
  { key: 'oracion_t', slot: 'afternoon', time: '18:00', minutes: 15, freq: D },
  { key: 'examen', slot: 'night', time: '21:30', minutes: null, freq: D, prayer: 'examen', examen: true },
  { key: 'avemarias', slot: 'night', time: '21:45', minutes: null, freq: D, prayer: 'avemaria' },
  { key: 'confesion', slot: 'any', time: null, minutes: null, freq: { type: 'weekly', day: null, every: 2, anchor: ymd(mondayOf(new Date())) } },
  { key: 'sabado', slot: 'any', time: null, minutes: null, freq: { type: 'weekly', day: 6, every: 1 }, prayer: 'acordaos' },
  { key: 'retiro', slot: 'any', time: null, minutes: null, freq: { type: 'monthly', day: null } },
].map((it) => ({ id: it.key, name: null, desc: null, enabled: true, prayer: null, ...it }));

/** Regla de San Serafín de Sarov — structure exactly as the source page. */
export const seedSerafin = () => [
  { key: 's_manana', slot: 'morning', time: '06:00', kind: 'flow', steps: SERAFIN_RULE, prayer: 'o_padrenuestro' },
  { key: 's_dia', slot: 'day', time: null, kind: 'counter', counterPrayer: 'o_jesus', target: 100, prayer: 'o_jesus' },
  { key: 's_cena', slot: 'night', time: null, kind: 'counter', counterPrayer: 'o_theotokos_salva', target: 100, prayer: 'o_theotokos_salva' },
  { key: 's_acostarse', slot: 'night', time: '21:30', kind: 'flow', steps: SERAFIN_RULE, prayer: 'o_padrenuestro', crossNote: true },
  { key: 's_examen', slot: 'night', time: null, examen: true, prayer: 'examen' },
].map((it) => ({ id: it.key, name: null, desc: null, enabled: true, minutes: null, freq: { type: 'daily' }, ...it }));
export const SEEDS = { serafin: seedSerafin, catolico: seedCatolico };
export const seedItems = seedSerafin;

export const fresh = () => ({ version: 1, settings: { lang: 'es', theme: 'auto', accent: 'burgundy', notif: false, haptic: '33' }, template: 'serafin', createdAt: ymd(new Date()), items: seedItems(), log: {}, examen: {} });

export function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.version === 1 && Array.isArray(s.items)) { s.createdAt ||= ymd(new Date()); s.template ||= 'catolico'; s.settings.haptic ||= '33'; return s; /* v0.1 data was the Catholic plan: keep it, user can switch */ } } catch {}
  return fresh();
}
export const save = (s) => localStorage.setItem(KEY, JSON.stringify(s));
export const clear = () => localStorage.removeItem(KEY);
export function validate(obj) { return obj && obj.version === 1 && Array.isArray(obj.items) && typeof obj.log === 'object'; }
