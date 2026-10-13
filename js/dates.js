// Pure date logic (no DOM) — shared by the app and scripts/dates-check.js.
export const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
export const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12); return x; };
export const dayDiff = (a, b) => Math.round((parseYmd(ymd(b)) - parseYmd(ymd(a))) / 86400000);
/** Monday of the week containing d (weeks start Monday). */
export const mondayOf = (d) => addDays(d, -((d.getDay() + 6) % 7));

/** Easter Sunday — anonymous Gregorian algorithm (Meeus/Jones/Butcher). */
export function easter(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day, 12);
}
/** Regina Coeli replaces the Angelus from Easter Sunday through Pentecost Sunday (Easter + 49), inclusive. */
export function isEasterSeason(d) {
  const e = easter(d.getFullYear());
  const n = dayDiff(e, d);
  return n >= 0 && n <= 49;
}

/**
 * Frequency shapes:
 *  {type:'daily'}
 *  {type:'weekdays', days:[0..6]}            (0 = Sunday)
 *  {type:'weekly', day:0..6|null, every:n, anchor:'YYYY-MM-DD'}  day null = any day that week
 *  {type:'monthly', day:1..31|null}          day null = any day that month; 31 clamps to month end
 */
export function weekActive(freq, d) {
  const every = Math.max(1, freq.every || 1);
  if (every === 1) return true;
  const anchor = mondayOf(freq.anchor ? parseYmd(freq.anchor) : new Date(2026, 0, 5, 12));
  const w = Math.floor(dayDiff(anchor, mondayOf(d)) / 7);
  return ((w % every) + every) % every === 0;
}
/** Is the item flexible (shown across a whole period until done)? */
export const isFlexible = (freq) => (freq.type === 'weekly' || freq.type === 'monthly') && (freq.day === null || freq.day === undefined);

/** Period [start,end] (Dates) for flexible items, else null. */
export function periodOf(freq, d) {
  if (freq.type === 'weekly') { const s = mondayOf(d); return [s, addDays(s, 6)]; }
  if (freq.type === 'monthly') return [new Date(d.getFullYear(), d.getMonth(), 1, 12), new Date(d.getFullYear(), d.getMonth() + 1, 0, 12)];
  return null;
}

/** Is the item scheduled on date d (ignores completion)? */
export function isScheduled(freq, d) {
  switch (freq.type) {
    case 'daily': return true;
    case 'weekdays': return (freq.days || []).includes(d.getDay());
    case 'weekly':
      if (!weekActive(freq, d)) return false;
      return isFlexible(freq) ? true : d.getDay() === freq.day;
    case 'monthly': {
      if (isFlexible(freq)) return true;
      const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      return d.getDate() === Math.min(freq.day, last);
    }
    default: return false;
  }
}

/** done(dateStr) -> bool. For flexible items: done in this period on some day? */
export function doneInPeriod(freq, d, done) {
  const p = periodOf(freq, d);
  for (let x = p[0]; x <= p[1]; x = addDays(x, 1)) if (done(ymd(x))) return ymd(x);
  return null;
}

/** Should item appear in the Today list for d? Flexible items stay visible all period; once done on another day they hide. */
export function showOn(freq, d, done) {
  if (!isScheduled(freq, d)) return false;
  if (isFlexible(freq)) { const at = doneInPeriod(freq, d, done); return !at || at === ymd(d); }
  return true;
}

/** Streak: consecutive scheduled days completed, ending today (today counts only if already done). Fixed-day items only. */
export function streak(freq, today, done) {
  if (isFlexible(freq)) return 0;
  let n = 0, d = today;
  if (isScheduled(freq, d) && !done(ymd(d))) d = addDays(d, -1);
  for (let guard = 0; guard < 800; guard++, d = addDays(d, -1)) {
    if (!isScheduled(freq, d)) continue;
    if (done(ymd(d))) n++; else break;
  }
  return n;
}

/** Consistency over the 7 days ending at `end`: {done, due}. Flexible items: due=1 if period overlaps, done if completed in range. */
export function consistency(freq, end, done, days = 7) {
  let d = 0, due = 0;
  if (isFlexible(freq)) {
    for (let i = 0; i < days; i++) { const x = addDays(end, -i); if (isScheduled(freq, x)) { due = 1; if (done(ymd(x))) d = 1; } }
    return { done: d, due };
  }
  for (let i = 0; i < days; i++) { const x = addDays(end, -i); if (isScheduled(freq, x)) { due++; if (done(ymd(x))) d++; } }
  return { done: d, due };
}
