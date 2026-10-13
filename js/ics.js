import { pad } from './dates.js';
const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (m) => '\\' + m);
/** Build VCALENDAR with floating local times (no DST in Honduras). items: [{id,title,desc,time,freq,minutes}] */
export function buildIcs(items, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Plan de Vida//0.2//ES', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Plan de Vida'];
  for (const it of items) {
    if (!it.time) continue;
    const f = it.freq; let rrule, start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (f.type === 'daily') rrule = 'FREQ=DAILY';
    else if (f.type === 'weekdays' && f.days?.length) rrule = 'FREQ=WEEKLY;BYDAY=' + f.days.map((d) => BYDAY[d]).join(',');
    else if (f.type === 'weekly' && f.day != null) { rrule = `FREQ=WEEKLY;INTERVAL=${f.every || 1};BYDAY=${BYDAY[f.day]}`; while (start.getDay() !== f.day) start.setDate(start.getDate() + 1); }
    else if (f.type === 'monthly' && f.day != null) { rrule = `FREQ=MONTHLY;BYMONTHDAY=${f.day}`; if (start.getDate() > f.day) start.setMonth(start.getMonth() + 1); start.setDate(f.day); }
    else continue;
    const [h, m] = it.time.split(':').map(Number); const dur = Math.max(5, it.minutes || 10);
    const ds = `${start.getFullYear()}${pad(start.getMonth() + 1)}${pad(start.getDate())}T${pad(h)}${pad(m)}00`;
    lines.push('BEGIN:VEVENT', `UID:${it.id}@plandevida.local`, `DTSTAMP:${stamp}`, `DTSTART:${ds}`, `DURATION:PT${dur}M`, `RRULE:${rrule}`,
      `SUMMARY:${esc(it.title)}`, `DESCRIPTION:${esc(it.desc || '')}`, 'TRANSP:TRANSPARENT',
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(it.title)}`, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
