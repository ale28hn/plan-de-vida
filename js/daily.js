// Daily offline companions: Catholic saint of the day + Philokalia pointer.
import { pad } from './dates.js';
import SAINTS from './data-saints.js';
import PHILOKALIA from './data-philokalia.js';

const byMd = SAINTS.byMonthDay || {};
const cycle = PHILOKALIA.cycle || [];

/** Local calendar month-day key: "MM-DD". */
export function monthDay(d = new Date()) {
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Day of year 1–365/366 in local timezone. */
export function dayOfYear(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0, 12);
  const cur = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
  return Math.round((cur - start) / 86400000);
}

/** @returns {{ name: string, rank?: string, feast?: string } | null} */
export function saintOf(d = new Date()) {
  return byMd[monthDay(d)] || null;
}

/** @returns {{ author: string, work: string, section: string, invite: string } | null} */
export function philokaliaOf(d = new Date()) {
  if (!cycle.length) return null;
  return cycle[(dayOfYear(d) - 1) % cycle.length];
}

export const saintsMeta = SAINTS.meta;
export const philokaliaMeta = PHILOKALIA.meta;
