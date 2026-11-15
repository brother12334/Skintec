/**
 * Scheduling-engine checks.
 * Run with: npm test (bundled with esbuild, no test framework needed)
 */
import assert from 'node:assert/strict';
import { createDefaultState } from '../data/defaults';
import { addDays, weekdayKey } from './dates';
import { phaseOn } from './progression';
import { getDailyRoutine, planNight, planWeekNights } from './scheduler';
import type { AppState } from '../types';
import { hydrate } from '../store/hydrate';

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
  } catch (error) {
    console.error(`FAIL  ${name}`);
    throw error;
  }
}

const START = '2026-01-05'; // a Monday

function stateAt(patch: (s: AppState) => void = () => {}): AppState {
  const state = createDefaultState();
  state.settings.startDate = START;
  state.settings.onboarded = true;
  state.settings.adapaleneReady = true;
  patch(state);
  return state;
}

const kinds = (state: AppState, weekOffset: number) =>
  planWeekNights(state, addDays(START, weekOffset * 7)).days.map((d) => d.plan.kind);

test('weeks 1–2: BHA Monday and Friday, every other night recovery', () => {
  const s = stateAt();
  const expected = ['bha', 'recovery', 'recovery', 'recovery', 'bha', 'recovery', 'recovery'];
  assert.deepEqual(kinds(s, 0), expected);
  assert.deepEqual(kinds(s, 1), expected);
});

test('weeks 3–4: adapalene on Wednesday only', () => {
  const s = stateAt();
  const expected = ['bha', 'recovery', 'adapalene', 'recovery', 'bha', 'recovery', 'recovery'];
  assert.deepEqual(kinds(s, 2), expected);
  assert.deepEqual(kinds(s, 3), expected);
});

test('week 5 on: the full schedule', () => {
  const s = stateAt();
  const expected = ['bha', 'recovery', 'adapalene', 'recovery', 'bha', 'adapalene', 'recovery'];
  assert.deepEqual(kinds(s, 4), expected);
  assert.deepEqual(kinds(s, 40), expected);
});

test('Thursday is a hydrating mask and Sunday a clay mask, every phase', () => {
  const s = stateAt();
  for (const w of [0, 2, 4, 9]) {
    const days = planWeekNights(s, addDays(START, w * 7)).days;
    assert.equal(days[3].plan.mask, 'hydrating');
    assert.equal(days[6].plan.mask, 'clay');
    assert.ok(days.filter((d) => d.plan.mask).every((d) => d.plan.kind === 'recovery'));
  }
});

test('a missed night shifts nothing: the plan follows the calendar', () => {
  const s = stateAt();
  const before = kinds(s, 4);
  // Log nothing for a whole week, then log one random night.
  s.completions.push({ date: addDays(START, 30), routine: 'pm', routineType: 'pm_bha', completedSteps: [], completedAt: 'x' });
  assert.deepEqual(kinds(s, 4), before);
  const tuesday = addDays(START, 29);
  assert.equal(weekdayKey(tuesday), 'tue');
  assert.equal(planNight(s, tuesday).kind, 'recovery');
});

test('adapalene stays a recovery night until it is marked ready', () => {
  const s = stateAt((st) => {
    st.settings.adapaleneReady = false;
  });
  const wed = addDays(START, 30); // week 5 Wednesday
  assert.equal(weekdayKey(wed), 'wed');
  const plan = planNight(s, wed);
  assert.equal(plan.kind, 'recovery');
  assert.equal(plan.heldBack, 'adapalene_not_ready');
  assert.ok(getDailyRoutine(s, wed).notices.some((n) => n.includes('Differin')));
});

test('an irritated check-in steps back one phase for a week', () => {
  const s = stateAt();
  const sat = addDays(START, 33); // week 5 Saturday, normally adapalene
  assert.equal(planNight(s, sat).kind, 'adapalene');
  s.checkIns.push({ date: addDays(sat, -2), comfort: 'very_irritated', dryness: false, stinging: false, redness: false, peeling: false });
  assert.equal(phaseOn(s, sat).phase, 1);
  assert.equal(planNight(s, sat).kind, 'recovery');
  assert.equal(planNight(s, addDays(sat, 7)).kind, 'adapalene');
});

test('the manual step back lasts through its end date', () => {
  const s = stateAt((st) => {
    st.settings.stepBackUntil = addDays(START, 35);
  });
  assert.equal(phaseOn(s, addDays(START, 35)).phase, 1);
  assert.equal(phaseOn(s, addDays(START, 36)).phase, 2);
  assert.equal(phaseOn(s, addDays(START, 3)).phase, 0); // never below phase 0
});

test('morning: rinse, dry, dapsone, moisturizer, sunscreen', () => {
  const am = getDailyRoutine(stateAt(), START).am.steps;
  assert.deepEqual(am.map((s) => s.kind), ['rinse', 'dry', 'dapsone', 'moisturizer', 'sunscreen']);
  assert.ok(am.every((s) => s.mandatory));
  assert.ok(am[2].tips?.some((t) => t.includes('benzoyl peroxide')));
});

test('every night: oil, Blanc, dry, tonight’s step, moisturizer, Vaseline', () => {
  const s = stateAt();
  for (let i = 28; i < 35; i++) {
    const pm = getDailyRoutine(s, addDays(START, i)).pm.steps;
    assert.equal(pm[0].productId, 'oil-cleanser');
    assert.equal(pm[1].productId, 'blanc-cleanser');
    assert.equal(pm[2].kind, 'dry');
    assert.equal(pm.at(-2)!.kind, 'moisturizer');
    assert.equal(pm.at(-1)!.kind, 'occlusive');
  }
});

test('BHA night waits 2–3 minutes before moisturizer', () => {
  const pm = getDailyRoutine(stateAt(), START).pm.steps.map((s) => s.kind);
  assert.deepEqual(pm.slice(3, 5), ['bha', 'wait']);
});

test('Vaseline rule: whole face on recovery, spots only and optional on active nights', () => {
  const s = stateAt();
  const rec = getDailyRoutine(s, addDays(START, 1)).pm.steps.at(-1)!;
  const bha = getDailyRoutine(s, START).pm.steps.at(-1)!;
  assert.equal(rec.mandatory, true);
  assert.match(rec.instruction, /whole face/);
  assert.equal(bha.mandatory, false);
  assert.match(bha.instruction, /spots/);
});

test('no mask ever appears on a BHA or adapalene night', () => {
  const s = stateAt();
  for (let i = 0; i < 70; i++) {
    const r = getDailyRoutine(s, addDays(START, i));
    if (r.pm.kind !== 'recovery') assert.ok(!r.pm.steps.some((st) => st.kind === 'mask'));
  }
});

test('masks are never required to finish a night', () => {
  const sun = getDailyRoutine(stateAt(), addDays(START, 6)).pm.steps;
  const mask = sun.find((s) => s.kind === 'mask')!;
  assert.equal(mask.productId, 'clay-mask');
  assert.equal(mask.mandatory, false);
});

test('an invalid date falls back instead of throwing', () => {
  const r = getDailyRoutine(stateAt(), 'not-a-date');
  assert.ok(r.pm.steps.length > 0);
});

test('old saved data keeps history and settings but gets the new plan', () => {
  const { state } = hydrate({
    settings: { restartDate: '2026-02-02', themeMode: 'dark', reducedMotion: true, onboarded: true },
    products: [{ id: 'tretinoin', name: 'Tretinoin', active: true }],
    completions: [{ date: '2026-02-03', routine: 'pm', routineType: 'pm_recovery', completedSteps: [], completedAt: 'x' },
      { date: '2026-02-04', routine: 'pm', routineType: 'pm_tretinoin', completedSteps: [], completedAt: 'x' }],
  });
  assert.equal(state.settings.themeMode, 'light'); // new look by default
  assert.equal(state.settings.reducedMotion, true);
  assert.equal(state.settings.onboarded, false); // goes back through setup for a real start date
  assert.equal(state.completions.length, 1);
  assert.equal(state.completions[0].routineType, 'pm_recovery');
  assert.ok(state.products.some((p) => p.id === 'dapsone-gel'));
  assert.ok(!state.products.some((p) => p.id === 'tretinoin'));
});

console.log(`${passed} scheduling checks passed`);
