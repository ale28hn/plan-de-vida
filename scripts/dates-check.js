import * as D from '../js/dates.js';
import * as R from '../js/rule.js';
import { seedSerafin, SEEDS, migrate } from '../js/store.js';
import { PRAYERS, getPrayer, VATICAN_ES } from '../js/prayers.js';
let pass = 0, fail = 0;
const eq = (name, got, exp) => { const ok = JSON.stringify(got) === JSON.stringify(exp); ok ? pass++ : fail++; console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `  got ${JSON.stringify(got)} expected ${JSON.stringify(exp)}`}`); };
const P = D.parseYmd;
// Easter — known dates
const known = { 1961: '1961-04-02', 2000: '2000-04-23', 2008: '2008-03-23', 2011: '2011-04-24', 2019: '2019-04-21', 2024: '2024-03-31', 2025: '2025-04-20', 2026: '2026-04-05', 2027: '2027-03-28', 2038: '2038-04-25', 2285: '2285-03-22' };
for (const [y, s] of Object.entries(known)) eq(`Easter ${y}`, D.ymd(D.easter(+y)), s);
// Regina Coeli season 2026: Apr 5 – May 24 (Pentecost)
eq('RC Holy Saturday 2026 → Angelus', D.isEasterSeason(P('2026-04-04')), false);
eq('RC Easter Sunday 2026', D.isEasterSeason(P('2026-04-05')), true);
eq('RC Pentecost 2026', D.isEasterSeason(P('2026-05-24')), true);
eq('RC day after Pentecost 2026', D.isEasterSeason(P('2026-05-25')), false);
eq('RC Oct 2026', D.isEasterSeason(P('2026-10-11')), false);
// Frequencies
eq('daily', D.isScheduled({ type: 'daily' }, P('2026-10-11')), true);
eq('weekdays Sat on Sat', D.isScheduled({ type: 'weekdays', days: [6] }, P('2026-10-10')), true);
eq('weekdays Sat on Sun', D.isScheduled({ type: 'weekdays', days: [6] }, P('2026-10-11')), false);
const bi = { type: 'weekly', day: null, every: 2, anchor: '2026-10-05' };
eq('biweekly active anchor week', D.isScheduled(bi, P('2026-10-07')), true);
eq('biweekly inactive next week', D.isScheduled(bi, P('2026-10-14')), false);
eq('biweekly active +2 weeks', D.isScheduled(bi, P('2026-10-19')), true);
eq('biweekly active −2 weeks', D.isScheduled(bi, P('2026-09-21')), true);
eq('weekly fixed Sat', D.isScheduled({ type: 'weekly', day: 6, every: 1 }, P('2026-10-17')), true);
eq('monthly day 31 clamps (Feb 28)', D.isScheduled({ type: 'monthly', day: 31 }, P('2026-02-28')), true);
eq('monthly day 15 not 14', D.isScheduled({ type: 'monthly', day: 15 }, P('2026-10-14')), false);
// Flexible visibility
const doneSet = (arr) => (s) => arr.includes(s);
const wk = { type: 'weekly', day: null, every: 1 };
eq('flex shows before done', D.showOn(wk, P('2026-10-08'), doneSet([])), true);
eq('flex shows on day done', D.showOn(wk, P('2026-10-08'), doneSet(['2026-10-08'])), true);
eq('flex hidden later that week', D.showOn(wk, P('2026-10-10'), doneSet(['2026-10-08'])), false);
eq('flex back next week', D.showOn(wk, P('2026-10-12'), doneSet(['2026-10-08'])), true);
// Streaks
const daily = { type: 'daily' };
eq('streak 3 incl today', D.streak(daily, P('2026-10-11'), doneSet(['2026-10-09', '2026-10-10', '2026-10-11'])), 3);
eq('streak today not yet done keeps yesterday run', D.streak(daily, P('2026-10-11'), doneSet(['2026-10-09', '2026-10-10'])), 2);
eq('streak broken', D.streak(daily, P('2026-10-11'), doneSet(['2026-10-08', '2026-10-10'])), 1);
eq('streak weekdays skips unscheduled', D.streak({ type: 'weekdays', days: [6] }, P('2026-10-11'), doneSet(['2026-10-03', '2026-10-10'])), 2);
eq('streak zero', D.streak(daily, P('2026-10-11'), doneSet([])), 0);
// Consistency
eq('consistency 5/7', D.consistency(daily, P('2026-10-11'), doneSet(['2026-10-05', '2026-10-06', '2026-10-08', '2026-10-10', '2026-10-11'])), { done: 5, due: 7 });
eq('consistency weekdays 1/1', D.consistency({ type: 'weekdays', days: [6] }, P('2026-10-11'), doneSet(['2026-10-10'])), { done: 1, due: 1 });
eq('consistency flexible done', D.consistency(wk, P('2026-10-11'), doneSet(['2026-10-07'])), { done: 1, due: 1 });
eq('mondayOf Sunday', D.ymd(D.mondayOf(P('2026-10-11'))), '2026-10-05');
// --- Regla de San Serafín: structure exactly as source page ---
const sf = seedSerafin();
const sfRule = sf.filter((i) => !i.iq);
eq('serafin blocks', sfRule.map((i) => [i.key, i.slot]), [['s_manana', 'morning'], ['s_dia', 'day'], ['s_cena', 'night'], ['s_acostarse', 'night'], ['s_examen', 'night']]);
eq('morning rule = PN×3, Theotokos×3, Credo×1', R.SERAFIN_RULE.map((x) => `${x.prayer}×${x.count}`), ['o_padrenuestro×3', 'o_theotokos×3', 'o_credo×1']);
eq('bedtime rule repeats morning rule', sfRule[3].steps, sfRule[0].steps);
eq('day counter is Jesus Prayer', sfRule[1].counterPrayer, 'o_jesus');
eq('after supper counter is Theotokos', sfRule[2].counterPrayer, 'o_theotokos_salva');
// --- Inner Quest + Coué (v0.2.4): each card sits after its prayer block ---
eq('serafin order with inner quest', sf.map((i) => i.id), ['s_manana', 'iq-coue-space', 'iq-move-breathe', 's_dia', 'iq-kind-intention', 's_cena', 's_acostarse', 'iq-coue-close', 's_examen']);
eq('iq slots', sf.filter((i) => i.iq).map((i) => i.slot), ['morning', 'morning', 'day', 'night']);
const legacy = { version: 1, template: 'serafin', items: sfRule.map((i) => ({ ...i, name: i.id === 's_dia' ? 'Mi oración' : null })), log: { '2026-10-28': { s_dia: { done: true, count: 100 } } }, examen: { '2026-10-28': { proposito: 'p' } }, settings: {} };
const mig = migrate(JSON.parse(JSON.stringify(legacy)));
eq('migration adds 4 iq items in order', mig.items.map((i) => i.id), sf.map((i) => i.id));
eq('migration keeps history, examen and edits', [mig.log, mig.examen, mig.items.find((i) => i.id === 's_dia').name], [legacy.log, legacy.examen, 'Mi oración']);
mig.items = mig.items.filter((i) => i.id !== 'iq-kind-intention');
eq('migration runs once (deleted item stays deleted)', migrate(mig).items.some((i) => i.id === 'iq-kind-intention'), false);
const cat = migrate({ template: 'catolico', items: [{ id: 'rosario' }], savedPlans: { serafin: sfRule }, log: {} });
eq('catolico user: iq added to saved serafin plan only', [cat.items.length, cat.savedPlans.serafin.filter((i) => i.iq).length], [1, 4]);
eq('Creed ES without filioque', /procede del Padre(?! y del Hijo)/.test(PRAYERS.o_credo.es.b) && !/y del Hijo, que/.test(PRAYERS.o_credo.es.b), true);
eq('Creed EN without filioque', !/and the Son,? Who with/.test(PRAYERS.o_credo.en.b.replace('Who with the Father and the Son', '')), true);
eq('every Orthodox text has a URL source', Object.entries(PRAYERS).filter(([k]) => k.startsWith('o_')).every(([, v]) => v.es.src?.url && v.en.src?.url), true);
// --- flow ---
const st = R.SERAFIN_RULE; let f = { step: 0, n: 0 };
f = R.flowTap(st, f); eq('flow tap 1/3', [f.step, f.n, f.advance], [0, 1, false]);
f = R.flowTap(st, R.flowTap(st, { step: 0, n: 0 })); f = R.flowTap(st, f); eq('flow 3/3 auto-advances', [f.step, f.n, f.advance], [1, 0, true]);
eq('flow last step finishes', R.flowTap(st, { step: 2, n: 0 }).done, true);
eq('flow back across step', R.flowBack(st, { step: 1, n: 0 }), { step: 0, n: 2 });
eq('flow total 7', R.flowTotal(st), 7);
eq('flow done count', R.flowDoneCount(st, { step: 2, n: 0 }), 6);
// --- bead haptics ---
eq('bead 33 mark', R.beadFeedback(33, '33', 100), 'mark');
eq('bead 34 plain', R.beadFeedback(34, '33', 100), 'bead');
eq('bead target', R.beadFeedback(100, '33', 100), 'target');
eq('bead off', R.beadFeedback(10, 'off', 100), 'bead');
// --- template switch keeps history ---
const s0 = { template: 'serafin', items: sf, log: { '2026-10-11': { s_manana: { done: true } } }, examen: { '2026-10-11': { proposito: 'x' } } };
const s1 = R.switchTemplate(s0, 'catolico', SEEDS);
eq('switch → catolico items', s1.items.some((i) => i.key === 'rosario'), true);
eq('switch keeps log + examen', [s1.log, s1.examen], [s0.log, s0.examen]);
const s2 = R.switchTemplate(s1, 'serafin', SEEDS);
eq('switch back restores same plan object', s2.items, sf);
// v0.2.1 — Vatican texts (default) vs Orthodox
const allVat = Object.values(VATICAN_ES).every((p) => p.src && p.src.url.startsWith('https://www.vatican.va/'));
eq('vatican: every text cites a vatican.va URL', allVat, true);
eq('vatican default: Theotokos step → Ave María', getPrayer('o_theotokos', 'es').b.startsWith('Dios te salve, María'), true);
eq('vatican Credo keeps «y del Hijo» + note', getPrayer('o_credo', 'es').b.includes('procede del Padre y del Hijo') && /filioque/.test(getPrayer('o_credo', 'es').alt), true);
eq('vatican Jesus prayer = CIC 2667 wording', getPrayer('o_jesus', 'es').b, 'Señor Jesucristo, Hijo de Dios, ten piedad de nosotros, pecadores');
eq('orthodox Credo has no filioque', getPrayer('o_credo', 'es', 'orthodox').b.includes('y del Hijo'), false);
eq('orthodox Theotokos hymn selectable', getPrayer('o_theotokos', 'es', 'orthodox').b.startsWith('¡Madre de Dios, Virgen, regocíjate!'), true);
eq('english unaffected by texts setting', getPrayer('o_credo', 'en', 'vatican').b === PRAYERS.o_credo.en.b, true);
eq('all seraphim step prayers resolve in both text sets', ['o_padrenuestro', 'o_theotokos', 'o_credo', 'o_jesus', 'o_kyrie', 'o_theotokos_salva'].every((id) => getPrayer(id, 'es', 'vatican')?.b && getPrayer(id, 'es', 'orthodox')?.b), true);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
