// Pure logic for the step-by-step prayer flow, the prayer-rope counter and template switching (no DOM).
/** Steps of the Rule of St. Seraphim said on rising and again on going to bed. */
export const SERAFIN_RULE = [{ prayer: 'o_padrenuestro', count: 3 }, { prayer: 'o_theotokos', count: 3 }, { prayer: 'o_credo', count: 1 }];

/** Flow state {step, n}. tap() counts one repetition; returns {step, n, advance, done}. */
export function flowTap(steps, st) {
  const cur = steps[st.step]; if (!cur) return { ...st, advance: false, done: true };
  const n = Math.min(cur.count, st.n + 1);
  if (n < cur.count) return { step: st.step, n, advance: false, done: false };
  const last = st.step === steps.length - 1;
  return { step: last ? st.step : st.step + 1, n: last ? n : 0, advance: !last, done: last };
}
export function flowBack(steps, st) {
  if (st.n > 0) return { step: st.step, n: st.n - 1 };
  if (st.step > 0) return { step: st.step - 1, n: Math.max(0, steps[st.step - 1].count - 1) };
  return { step: 0, n: 0 };
}
export const flowTotal = (steps) => steps.reduce((a, s) => a + s.count, 0);
export const flowDoneCount = (steps, st) => steps.slice(0, st.step).reduce((a, s) => a + s.count, 0) + st.n;

/** Prayer-rope haptic: 'off' | 10 | 33 | 100. Returns 'bead' | 'mark' | 'target'. */
export function beadFeedback(count, every, target) {
  if (target && count === target) return 'target';
  const e = Number(every);
  if (e && count > 0 && count % e === 0) return 'mark';
  return 'bead';
}

/** Switch template: replaces plan items, keeps log/examen/settings, remembers previous template items. */
export function switchTemplate(state, name, seeds) {
  const saved = { ...(state.savedPlans || {}) };
  saved[state.template || 'catolico'] = state.items;
  const items = saved[name] ? saved[name] : seeds[name]();
  delete saved[name];
  return { ...state, template: name, items, savedPlans: saved };
}
