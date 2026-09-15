import type {
  AppState,
  DailyRoutine,
  Mask,
  NightPlan,
  Product,
  RoutineStep,
  RoutineTemplate,

  TretinoinFrequency,
} from '../types';
import { PRODUCT_IDS } from '../data/defaults';
import {
  addDays,
  daysBetween,
  isValidISO,
  startOfWeek,
  toISO,
  weekdayKey,
  WEEKDAY_KEYS,
} from './dates';
import { effectiveProgression, readIrritation } from './progression';

/** Step labels prefer a product's short name so routines stay readable. */
function productName(products: Product[], id: string, fallback: string): string {
  const product = products.find((p) => p.id === id);
  if (!product) return fallback;
  return product.shortName?.trim() || product.name;
}

function step(
  id: string,
  name: string,
  kind: RoutineStep['kind'],
  instruction: string,
  mandatory: boolean,
  productId?: string,
): RoutineStep {
  return { id, name, kind, instruction, mandatory, productId };
}

/* ------------------------------------------------------------------ *
 * Routine templates
 * ------------------------------------------------------------------ */

export function buildMorningRoutine(state: AppState): RoutineTemplate {
  const { products, settings } = state;
  if (settings.morningMode === 'skin_aqua') {
    return {
      id: 'am-skin-aqua',
      type: 'am_skin_aqua',
      steps: [
        step(
          'am-skin-aqua-1',
          productName(products, PRODUCT_IDS.skinAqua, 'Skin Aqua UV Serum'),
          'sunscreen',
          'Apply generously as your only morning step. Reapply through the day as needed.',
          true,
          PRODUCT_IDS.skinAqua,
        ),
      ],
    };
  }
  return {
    id: 'am-standard',
    type: 'am_standard',
    steps: [
      step(
        'am-standard-1',
        productName(products, PRODUCT_IDS.lrp, 'La Roche-Posay Triple Repair Moisturizing Cream'),
        'moisturizer',
        'Smooth over clean, dry skin.',
        true,
        PRODUCT_IDS.lrp,
      ),
      step(
        'am-standard-2',
        productName(products, PRODUCT_IDS.sunscreen, 'Sunscreen'),
        'sunscreen',
        'Apply as the final morning step. Reapply through the day as needed.',
        true,
        PRODUCT_IDS.sunscreen,
      ),
    ],
  };
}

/**
 * Tretinoin night — the moisturizer sandwich.
 * The closing moisturizer is mandatory by construction: it is not a toggle,
 * not conditional, and the routine cannot be completed without it.
 */
export function buildTretinoinNight(state: AppState): RoutineTemplate {
  const { products } = state;
  return {
    id: 'pm-tretinoin',
    type: 'pm_tretinoin',
    steps: [
      step('pm-tret-1', productName(products, PRODUCT_IDS.anuaFirst, 'Anua First Cleanser'), 'cleanser', 'Massage over dry skin, then rinse.', true, PRODUCT_IDS.anuaFirst),
      step('pm-tret-2', productName(products, PRODUCT_IDS.anuaSecond, 'Anua Second Cleanser'), 'cleanser', 'Follow with a gentle second cleanse and rinse.', true, PRODUCT_IDS.anuaSecond),
      step('pm-tret-3', 'Allow skin to dry completely', 'wait', 'Wait until skin is fully dry before the next step.', true),
      step('pm-tret-4', productName(products, PRODUCT_IDS.lrp, 'LRP Triple Repair'), 'moisturizer', 'First layer of the sandwich — a thin, even layer.', true, PRODUCT_IDS.lrp),
      step('pm-tret-5', productName(products, PRODUCT_IDS.tretinoin, 'Tretinoin'), 'tretinoin', 'Apply the amount your prescriber directed.', true, PRODUCT_IDS.tretinoin),
      step('pm-tret-6', productName(products, PRODUCT_IDS.lrp, 'LRP Triple Repair'), 'moisturizer', 'Closing layer of the sandwich. This step is always required.', true, PRODUCT_IDS.lrp),
    ],
  };
}

export function buildRecoveryNight(state: AppState, mask?: Mask): RoutineTemplate {
  const { products, settings } = state;
  const steps: RoutineStep[] = [
    step('pm-rec-1', productName(products, PRODUCT_IDS.anuaFirst, 'Anua First Cleanser'), 'cleanser', 'Massage over dry skin, then rinse.', true, PRODUCT_IDS.anuaFirst),
    step('pm-rec-2', productName(products, PRODUCT_IDS.anuaSecond, 'Anua Second Cleanser'), 'cleanser', 'Follow with a gentle second cleanse and rinse.', true, PRODUCT_IDS.anuaSecond),
  ];

  if (mask) {
    steps.push(
      step(
        `pm-rec-mask-${mask.id}`,
        productName(products, mask.productId, mask.name),
        'mask',
        'Apply to clean skin and remove as directed on the pack.',
        true,
        mask.productId,
      ),
    );
  }

  if (settings.retinolActive) {
    steps.push(
      step(
        'pm-rec-retinol',
        productName(products, PRODUCT_IDS.retinol, 'Retinol'),
        'retinol',
        'Recovery nights only — retinol is never scheduled alongside tretinoin.',
        false,
        PRODUCT_IDS.retinol,
      ),
    );
  }

  steps.push(
    step('pm-rec-final', productName(products, PRODUCT_IDS.lrp, 'LRP Triple Repair'), 'moisturizer', 'Finish with an even layer to support your barrier.', true, PRODUCT_IDS.lrp),
  );

  return { id: 'pm-recovery', type: 'pm_recovery', steps };
}

/* ------------------------------------------------------------------ *
 * Tretinoin night pattern
 * ------------------------------------------------------------------ */

/**
 * Dynamically decides whether `date` is a treatment night for a frequency.
 * Everything is derived from the day offset since the restart date, so the
 * pattern stays correct across weeks, months, years and restart-date changes.
 */
export function isTretinoinNight(
  frequency: TretinoinFrequency,
  restartDate: string,
  date: string,
): boolean {
  const offset = daysBetween(restartDate, date);
  if (offset < 0) return false;
  switch (frequency) {
    case 'nightly':
      return true;
    case 'every_other_night':
      return offset % 2 === 0;
    case 'three_times_weekly':
      return [0, 2, 4].includes(offset % 7);
    case 'twice_weekly':
      return [0, 3].includes(offset % 7);
    default:
      return false;
  }
}

/* ------------------------------------------------------------------ *
 * Week planning (base nights + mask placement)
 * ------------------------------------------------------------------ */

function baseNight(state: AppState, date: string): NightPlan {
  const progression = effectiveProgression(state, date);
  if (!state.settings.tretinoinActive || !progression.frequency) {
    return { kind: 'recovery' };
  }
  const restart = isValidISO(state.settings.restartDate) ? state.settings.restartDate : date;
  if (!isTretinoinNight(progression.frequency, restart, date)) return { kind: 'recovery' };

  // Significant irritation always favours recovery over pushing through.
  if (readIrritation(state, date).significant) return { kind: 'recovery' };

  return { kind: 'tretinoin' };
}

function maskFitsNight(mask: Mask, plan: NightPlan, state: AppState, assigned: Mask | undefined): boolean {
  if (assigned) return false; // one mask per night — never stack treatments
  if (plan.kind === 'tretinoin' && (mask.avoidWithTretinoin || mask.requiresRecoveryNight)) return false;
  if (plan.kind === 'recovery' && state.settings.retinolActive && mask.avoidWithRetinol) return false;
  return true;
}

export type WeekPlan = {
  weekStart: string;
  days: { date: string; plan: NightPlan }[];
};

/**
 * Plans a Monday–Sunday week in one pass so mask moves, weekly frequency limits
 * and compatibility rules are all resolved centrally rather than in the UI.
 */
export function planWeek(state: AppState, anyDateInWeek: string): WeekPlan {
  const weekStart = startOfWeek(anyDateInWeek);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return { date, plan: baseNight(state, date) };
  });

  const assigned = new Map<string, Mask>();
  const masks = state.masks
    .filter((m) => m.enabled)
    .filter((m) => state.products.find((p) => p.id === m.productId)?.active !== false)
    .sort((a, b) => b.priority - a.priority);

  for (const mask of masks) {
    const limit = Math.max(0, Math.min(7, mask.frequencyLimit));
    let placed = 0;
    const preferredIndexes = mask.preferredDays
      .map((d) => WEEKDAY_KEYS.indexOf(d as (typeof WEEKDAY_KEYS)[number]))
      .filter((i) => i >= 0);
    const seeds = preferredIndexes.length > 0 ? preferredIndexes : [0];

    for (const seed of seeds) {
      if (placed >= limit) break;
      // Preferred day first, then the nearest nights either side of it.
      const order = [seed];
      for (let delta = 1; delta <= 6; delta++) {
        if (seed + delta <= 6) order.push(seed + delta);
        if (seed - delta >= 0) order.push(seed - delta);
      }
      for (const index of order) {
        const day = days[index];
        // One mask per night: an occupied night is skipped, so incompatible
        // pairs such as Volcano + LaserDerm can never stack.
        const current = assigned.get(day.date);
        if (!maskFitsNight(mask, day.plan, state, current)) continue;
        assigned.set(day.date, mask);
        day.plan.maskId = mask.id;
        if (index !== seed) day.plan.maskMovedFrom = days[seed].date;
        placed += 1;
        break;
      }
    }
  }

  return { weekStart, days };
}

/* ------------------------------------------------------------------ *
 * Public entry point
 * ------------------------------------------------------------------ */

export function getDailyRoutine(state: AppState, date: string): DailyRoutine {
  const safeDate = isValidISO(date) ? date : toISO(new Date());
  const week = planWeek(state, safeDate);
  const day = week.days.find((d) => d.date === safeDate) ?? {
    date: safeDate,
    plan: baseNight(state, safeDate),
  };
  const progression = effectiveProgression(state, safeDate);
  const irritation = readIrritation(state, safeDate);

  const am = buildMorningRoutine(state);
  const mask = day.plan.maskId ? state.masks.find((m) => m.id === day.plan.maskId) : undefined;

  const isTretinoin = day.plan.kind === 'tretinoin';
  const pm = isTretinoin ? buildTretinoinNight(state) : buildRecoveryNight(state, mask);

  const notices: string[] = [];
  if (progression.paused && progression.pauseReason) {
    notices.push(
      `Progression paused. ${progression.pauseReason} SkinTec has kept your current frequency and added recovery time. Follow your dermatologist or prescriber's instructions if they differ.`,
    );
  } else if (irritation.significant) {
    notices.push('Your skin may benefit from a recovery night.');
  }
  if (day.plan.maskMovedFrom) {
    notices.push(
      `${mask?.name ?? 'A mask'} moved to tonight — its usual night is a treatment night.`,
    );
  }
  if (state.settings.retinolActive && isTretinoin) {
    notices.push('Retinol is not scheduled tonight. Retinol and tretinoin are never combined.');
  }

  return {
    date: safeDate,
    am: {
      type: am.type,
      title: state.settings.morningMode === 'skin_aqua' ? 'Skin Aqua morning' : 'Standard morning',
      subtitle: am.steps.map((s) => s.name).join(' → '),
      steps: am.steps,
    },
    pm: {
      type: pm.type,
      title: isTretinoin ? 'Tretinoin night' : 'Recovery night',
      subtitle: mask && !isTretinoin ? `Recovery with ${mask.name}` : pm.steps.map((s) => s.name).join(' → '),
      steps: pm.steps,
      maskId: mask?.id,
      maskName: mask?.name,
      maskMovedFrom: day.plan.maskMovedFrom,
    },
    stage: progression.stage,
    stageIndex: progression.stageIndex,
    frequency: progression.frequency,
    progressionPaused: progression.paused,
    pauseReason: progression.pauseReason,
    notices,
  };
}

export function routineKey(date: string, routine: 'am' | 'pm'): string {
  return `${date}:${routine}`;
}

/** Retinol and tretinoin can never share a night. Used by the UI to warn before saving. */
export function retinolConflict(state: AppState, date: string): boolean {
  if (!state.settings.retinolActive) return false;
  const routine = getDailyRoutine(state, date);
  return routine.pm.type === 'pm_tretinoin';
}

export function weekdayOf(date: string) {
  return weekdayKey(date);
}
