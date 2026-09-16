/**
 * Scheduling-engine checks.
 * Run with: npm test  (node --experimental-strip-types, no test framework needed)
 */
import assert from 'node:assert/strict';
import { createDefaultState } from '../data/defaults';
import { addDays, daysBetween, startOfWeek, weekdayKey } from './dates';
import { effectiveProgression } from './progression';
import { getDailyRoutine, isTretinoinNight, planWeek } from './scheduler';
import type { AppState, SkinCheckIn } from '../types';

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

function stateAt(restart: string, patch: (s: AppState) => void = () => {}): AppState {
  const state = createDefaultState();
  state.settings.restartDate = restart;
  state.settings.onboarded = true;
  state.progression.stageStartedAt = restart;
  patch(state);
  return state;
}

const RESTART = '2026-01-05'; // a Monday

test('tretinoin nights per frequency', () => {
  const countWeek = (frequency: Parameters<typeof isTretinoinNight>[0]) =>
    Array.from({ length: 7 }, (_, i) => isTretinoinNight(frequency, RESTART, addDays(RESTART, i))).filter(Boolean)
      .length;
  assert.equal(countWeek('twice_weekly'), 2);
  assert.equal(countWeek('three_times_weekly'), 3);
  assert.equal(countWeek('every_other_night'), 4);
  assert.equal(countWeek('nightly'), 7);
});

test('every-other-night alternates correctly across weeks and months', () => {
  for (let i = 0; i < 120; i++) {
    const date = addDays(RESTART, i);
    assert.equal(isTretinoinNight('every_other_night', RESTART, date), i % 2 === 0, date);
  }
});

test('progression climbs 2x -> 3x -> EON -> nightly when approved', () => {
  const state = stateAt(RESTART, (s) => {
    s.progression.approvedMaxFrequency = 'nightly';
  });
  assert.equal(effectiveProgression(state, RESTART).frequency, 'twice_weekly');
  assert.equal(effectiveProgression(state, addDays(RESTART, 14)).frequency, 'three_times_weekly');
  assert.equal(effectiveProgression(state, addDays(RESTART, 28)).frequency, 'every_other_night');
  assert.equal(effectiveProgression(state, addDays(RESTART, 42)).frequency, 'nightly');
  assert.equal(effectiveProgression(state, addDays(RESTART, 400)).frequency, 'nightly');
});

test('progression never exceeds the prescriber-approved maximum', () => {
  const capped = stateAt(RESTART, (s) => {
    s.progression.approvedMaxFrequency = 'three_times_weekly';
  });
  assert.equal(effectiveProgression(capped, addDays(RESTART, 365)).frequency, 'three_times_weekly');

  const eon = stateAt(RESTART, (s) => {
    s.progression.approvedMaxFrequency = 'every_other_night';
  });
  assert.equal(effectiveProgression(eon, addDays(RESTART, 365)).frequency, 'every_other_night');
});

test('lowering the approved maximum clamps an advanced stage back down', () => {
  const state = stateAt(RESTART, (s) => {
    s.progression.approvedMaxFrequency = 'twice_weekly';
    s.progression.currentStage = 3;
    s.progression.stageStartedAt = addDays(RESTART, 42);
  });
  assert.equal(effectiveProgression(state, addDays(RESTART, 60)).frequency, 'twice_weekly');
});

test('significant irritation pauses progression and favours recovery', () => {
  const day = addDays(RESTART, 0);
  const checkIn: SkinCheckIn = {
    date: day,
    comfort: 'very_irritated',
    dryness: true,
    stinging: true,
    redness: false,
    peeling: false,
  };
  const state = stateAt(RESTART, (s) => {
    s.checkIns.push(checkIn);
  });
  const progression = effectiveProgression(state, day);
  assert.equal(progression.paused, true);
  assert.equal(progression.frequency, 'twice_weekly');

  const routine = getDailyRoutine(state, day);
  assert.equal(routine.pm.type, 'pm_recovery');
  assert.ok(routine.notices.some((n) => n.includes('paused')));
});

test('paused progression holds the current frequency indefinitely', () => {
  const state = stateAt(RESTART, (s) => {
    s.progression.paused = true;
    s.progression.approvedMaxFrequency = 'nightly';
  });
  assert.equal(effectiveProgression(state, addDays(RESTART, 200)).frequency, 'twice_weekly');
});

test('tretinoin night is the six-step moisturizer sandwich, closing on moisturizer', () => {
  const state = stateAt(RESTART);
  const routine = getDailyRoutine(state, RESTART);
  assert.equal(routine.pm.type, 'pm_tretinoin');

  // The sandwich is exactly the required work; only optional Aquaphor follows it.
  const required = routine.pm.steps.filter((s) => s.mandatory);
  assert.equal(required.length, 6);
  assert.deepEqual(
    required.map((s) => s.kind),
    ['cleanser', 'cleanser', 'wait', 'moisturizer', 'tretinoin', 'moisturizer'],
  );
  const last = required[required.length - 1];
  assert.equal(last.kind, 'moisturizer');
  assert.equal(last.mandatory, true);
  assert.deepEqual(
    routine.pm.steps.filter((s) => !s.mandatory).map((s) => s.kind),
    ['occlusive'],
  );
});

test('morning modes stay exactly as configured', () => {
  // Only the required steps define the morning; optional Aquaphor is offered after both.
  const standard = stateAt(RESTART);
  const am = getDailyRoutine(standard, RESTART).am;
  assert.deepEqual(
    am.steps.filter((s) => s.mandatory).map((s) => s.kind),
    ['moisturizer', 'sunscreen'],
  );

  const aqua = stateAt(RESTART, (s) => {
    s.settings.morningMode = 'skin_aqua';
  });
  const aquaAm = getDailyRoutine(aqua, RESTART).am;
  const aquaRequired = aquaAm.steps.filter((s) => s.mandatory);
  assert.equal(aquaRequired.length, 1);
  assert.equal(aquaRequired[0].productId, 'skin-aqua-uv-serum');

  // Collagen Bank is in the library but never inserted automatically.
  for (const state of [standard, aqua]) {
    const routine = getDailyRoutine(state, RESTART);
    const ids = [...routine.am.steps, ...routine.pm.steps].map((s) => s.productId);
    assert.ok(!ids.includes('neutrogena-collagen-bank'));
  }
});

test('recovery night has no tretinoin or retinol unless retinol is enabled', () => {
  const state = stateAt(RESTART);
  const recovery = getDailyRoutine(state, addDays(RESTART, 1));
  assert.equal(recovery.pm.type, 'pm_recovery');
  assert.ok(!recovery.pm.steps.some((s) => s.kind === 'tretinoin' || s.kind === 'retinol'));
});

test('retinol is never scheduled on a tretinoin night', () => {
  const state = stateAt(RESTART, (s) => {
    s.settings.retinolActive = true;
    s.progression.approvedMaxFrequency = 'nightly';
    s.progression.currentStage = 3;
  });
  for (let i = 0; i < 30; i++) {
    const date = addDays(RESTART, i);
    const routine = getDailyRoutine(state, date);
    const hasTret = routine.pm.steps.some((s) => s.kind === 'tretinoin');
    const hasRetinol = routine.pm.steps.some((s) => s.kind === 'retinol');
    assert.ok(!(hasTret && hasRetinol), `retinol stacked with tretinoin on ${date}`);
  }
});

test('masks never land on a tretinoin night and never stack', () => {
  for (const max of ['twice_weekly', 'three_times_weekly', 'every_other_night'] as const) {
    const state = stateAt(RESTART, (s) => {
      s.progression.approvedMaxFrequency = max;
    });
    for (let week = 0; week < 12; week++) {
      const plan = planWeek(state, addDays(RESTART, week * 7));
      const seen = new Map<string, string>();
      for (const day of plan.days) {
        if (!day.plan.maskId) continue;
        assert.equal(day.plan.kind, 'recovery', `mask on a treatment night ${day.date}`);
        assert.ok(!seen.has(day.date), 'two masks on one night');
        seen.set(day.date, day.plan.maskId);
      }
      // Volcano and LaserDerm never share a night.
      const volcanoNights = plan.days.filter((d) => d.plan.maskId === 'mask-volcano').map((d) => d.date);
      const laserNights = plan.days.filter((d) => d.plan.maskId === 'mask-laserderm').map((d) => d.date);
      assert.equal(volcanoNights.filter((d) => laserNights.includes(d)).length, 0);
    }
  }
});

test('a mask whose preferred day is a treatment night moves to a recovery night', () => {
  const state = stateAt(RESTART, (s) => {
    s.masks = s.masks.map((m) => (m.id === 'mask-volcano' ? { ...m, preferredDays: ['mon'] } : { ...m, enabled: false }));
  });
  const plan = planWeek(state, RESTART);
  const monday = plan.days[0];
  assert.equal(monday.plan.kind, 'tretinoin');
  assert.equal(monday.plan.maskId, undefined);
  const placed = plan.days.find((d) => d.plan.maskId === 'mask-volcano');
  assert.ok(placed, 'volcano mask was rescheduled');
  assert.equal(placed!.plan.kind, 'recovery');
  assert.equal(placed!.plan.maskMovedFrom, monday.date);
});

test('mask weekly frequency limits are respected', () => {
  const state = stateAt(RESTART);
  const plan = planWeek(state, RESTART);
  for (const mask of state.masks) {
    const uses = plan.days.filter((d) => d.plan.maskId === mask.id).length;
    assert.ok(uses <= mask.frequencyLimit, `${mask.name} exceeded its weekly limit`);
  }
});

test('weeks always start on Monday and cover seven days', () => {
  const state = stateAt(RESTART);
  const plan = planWeek(state, '2026-03-12');
  assert.equal(plan.days.length, 7);
  assert.equal(weekdayKey(plan.weekStart), 'mon');
  assert.equal(plan.weekStart, startOfWeek('2026-03-12'));
});

test('missed routines and date changes never corrupt the pattern', () => {
  const state = stateAt(RESTART, (s) => {
    s.progression.approvedMaxFrequency = 'every_other_night';
  });
  const before = getDailyRoutine(state, '2026-07-04').pm.type;
  state.completions.push({ date: '2026-02-02', routine: 'pm', routineType: 'pm_tretinoin', completedSteps: [] });
  const after = getDailyRoutine(state, '2026-07-04').pm.type;
  assert.equal(before, after);
});

test('an invalid date falls back instead of throwing', () => {
  const state = stateAt(RESTART);
  const routine = getDailyRoutine(state, 'not-a-date');
  assert.ok(routine.am.steps.length > 0);
  assert.ok(routine.pm.steps.length > 0);
});

test('with tretinoin inactive no night schedules tretinoin', () => {
  const state = stateAt(RESTART, (s) => {
    s.settings.tretinoinActive = false;
  });
  for (let i = 0; i < 14; i++) {
    const date = addDays(RESTART, i);
    const routine = getDailyRoutine(state, date);
    assert.ok(!routine.pm.steps.some((s) => s.kind === 'tretinoin'), date);
    assert.equal(routine.pm.type, weekdayKey(date) === 'wed' ? 'pm_derma_stamp' : 'pm_recovery', date);
  }
});

test('the derma stamp takes every Wednesday night', () => {
  const state = stateAt(RESTART);
  for (let week = 0; week < 8; week++) {
    const plan = planWeek(state, addDays(RESTART, week * 7));
    const wednesday = plan.days.find((d) => weekdayKey(d.date) === 'wed')!;
    assert.equal(wednesday.plan.kind, 'derma_stamp', wednesday.date);
  }
});

test('derma stamp night is cleanse, cleanse, dry, stamp, argan oil, moisturizer', () => {
  const state = stateAt(RESTART);
  const wednesday = addDays(RESTART, 2);
  const routine = getDailyRoutine(state, wednesday);
  assert.equal(routine.pm.type, 'pm_derma_stamp');
  const required = routine.pm.steps.filter((s) => s.mandatory);
  assert.deepEqual(
    required.map((s) => s.kind),
    ['cleanser', 'cleanser', 'wait', 'derma_stamp', 'oil', 'moisturizer'],
  );
  // Argan oil sits immediately after the stamp, and neither step is optional.
  const stampAt = routine.pm.steps.findIndex((s) => s.kind === 'derma_stamp');
  assert.equal(routine.pm.steps[stampAt + 1].kind, 'oil');
  assert.equal(routine.pm.steps[stampAt + 1].productId, 'argan-oil');
  assert.equal(routine.pm.steps[stampAt + 1].mandatory, true);
});

test('tretinoin, retinol and masks never share the derma stamp night', () => {
  const state = stateAt(RESTART, (s) => {
    s.settings.retinolActive = true;
    s.progression.approvedMaxFrequency = 'nightly';
    s.progression.currentStage = 3;
  });
  for (let i = 0; i < 40; i++) {
    const date = addDays(RESTART, i);
    if (weekdayKey(date) !== 'wed') continue;
    const routine = getDailyRoutine(state, date);
    assert.ok(!routine.pm.steps.some((s) => s.kind === 'tretinoin'), date);
    assert.ok(!routine.pm.steps.some((s) => s.kind === 'retinol'), date);
    assert.ok(!routine.pm.steps.some((s) => s.kind === 'mask'), date);
    assert.equal(routine.pm.maskId, undefined, date);
  }
});

test('a treatment night displaced by the derma stamp moves to a nearby night', () => {
  // Every-other-night from a Monday restart puts tretinoin on Wednesday.
  const state = stateAt(RESTART, (s) => {
    s.progression.approvedMaxFrequency = 'every_other_night';
    s.progression.currentStage = 2;
    s.progression.stageStartedAt = RESTART;
  });
  const plan = planWeek(state, RESTART);
  const wednesday = plan.days.find((d) => weekdayKey(d.date) === 'wed')!;
  assert.equal(wednesday.plan.kind, 'derma_stamp');
  const moved = plan.days.find((d) => d.plan.tretinoinMovedFrom === wednesday.date);
  assert.ok(moved, 'the displaced treatment night was rescheduled');
  assert.equal(moved!.plan.kind, 'tretinoin');
  assert.ok(Math.abs(daysBetween(wednesday.date, moved!.date)) <= 2);
});

test('the weekly tretinoin count is preserved when the stamp displaces a night', () => {
  const state = stateAt(RESTART, (s) => {
    s.progression.approvedMaxFrequency = 'three_times_weekly';
    s.progression.currentStage = 1;
    s.progression.stageStartedAt = RESTART;
  });
  const withStamp = planWeek(state, RESTART).days.filter((d) => d.plan.kind === 'tretinoin').length;
  const noStamp = planWeek(
    { ...state, settings: { ...state.settings, dermaStampActive: false } },
    RESTART,
  ).days.filter((d) => d.plan.kind === 'tretinoin').length;
  assert.equal(withStamp, noStamp);
});

test('turning the derma stamp off restores the plain pattern', () => {
  const state = stateAt(RESTART, (s) => {
    s.settings.dermaStampActive = false;
  });
  const plan = planWeek(state, RESTART);
  assert.ok(!plan.days.some((d) => d.plan.kind === 'derma_stamp'));
});

test('every routine ends with the optional Aquaphor step', () => {
  const state = stateAt(RESTART, (s) => {
    s.progression.approvedMaxFrequency = 'every_other_night';
  });
  for (const date of [RESTART, addDays(RESTART, 1), addDays(RESTART, 2)]) {
    const routine = getDailyRoutine(state, date);
    for (const part of [routine.am, routine.pm]) {
      const last = part.steps[part.steps.length - 1];
      assert.equal(last.kind, 'occlusive', `${date} ${part.type}`);
      assert.equal(last.id, 'aquaphor');
      assert.equal(last.productId, 'aquaphor');
      assert.equal(last.mandatory, false, 'Aquaphor is never required');
    }
  }
});

test('the Aquaphor step names both choices and skipping, worded for the time of day', () => {
  const routine = getDailyRoutine(stateAt(RESTART), RESTART);
  for (const part of [routine.am, routine.pm]) {
    const last = part.steps.slice(-1)[0];
    assert.match(last.instruction, /spot/i);
    assert.match(last.instruction, /whole face/i);
    assert.match(last.instruction, /skip/i);
  }
  // A morning step never talks about tonight.
  assert.match(routine.am.steps.slice(-1)[0].instruction, /skip it this morning/i);
  assert.doesNotMatch(routine.am.steps.slice(-1)[0].instruction, /tonight/i);
  assert.match(routine.pm.steps.slice(-1)[0].instruction, /skip it tonight/i);
});

test('Aquaphor never blocks a routine from completing', () => {
  const state = stateAt(RESTART, (s) => {
    s.settings.morningMode = 'skin_aqua';
  });
  const routine = getDailyRoutine(state, RESTART);
  // The required work is everything except the Aquaphor step.
  assert.equal(routine.pm.type, 'pm_tretinoin');
  const mandatory = routine.pm.steps.filter((s) => s.mandatory);
  assert.equal(mandatory.length, 6);
  assert.equal(mandatory[mandatory.length - 1].kind, 'moisturizer');
  assert.ok(!routine.am.steps.filter((s) => s.mandatory).some((s) => s.kind === 'occlusive'));
});

test('an inactive Aquaphor product removes the step', () => {
  const state = stateAt(RESTART, (s) => {
    s.products = s.products.map((p) => (p.id === 'aquaphor' ? { ...p, active: false } : p));
  });
  const routine = getDailyRoutine(state, RESTART);
  assert.ok(![...routine.am.steps, ...routine.pm.steps].some((s) => s.kind === 'occlusive'));
});

test('the double cleanse carries the same method on every night type', () => {
  const state = stateAt(RESTART, (s) => {
    s.progression.approvedMaxFrequency = 'every_other_night';
  });
  const nights = [RESTART, addDays(RESTART, 1), addDays(RESTART, 2)].map((d) => getDailyRoutine(state, d));
  assert.deepEqual(
    [...new Set(nights.map((n) => n.pm.type))].sort(),
    ['pm_derma_stamp', 'pm_recovery', 'pm_tretinoin'],
    'all three night types are covered',
  );

  for (const night of nights) {
    const [first, second] = night.pm.steps;
    assert.equal(first.kind, 'cleanser');
    assert.equal(second.kind, 'cleanser');
    // First cleanse: timed on dry skin, then water worked in to exfoliate, then rinsed.
    assert.match(first.instruction, /35-45 seconds/);
    assert.match(first.instruction, /dry skin/i);
    assert.match(first.instruction, /exfoliate/i);
    assert.match(first.instruction, /rinse several times/i);
    // Second cleanse goes on without drying off.
    assert.match(second.instruction, /do not dry/i);
    assert.match(second.instruction, /damp/i);
  }

  const firsts = new Set(nights.map((n) => n.pm.steps[0].instruction));
  const seconds = new Set(nights.map((n) => n.pm.steps[1].instruction));
  assert.equal(firsts.size, 1, 'one first-cleanse instruction everywhere');
  assert.equal(seconds.size, 1, 'one second-cleanse instruction everywhere');
});

console.log(`SkinTec scheduler: ${passed} checks passed`);
