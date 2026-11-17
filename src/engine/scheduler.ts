import type { AppState, DailyRoutine, MaskKind, NightKind, NightPlan, Product, RoutineStep, RoutineType } from '../types';
import { MASK_LABEL, NIGHT_LABEL, PRODUCT_IDS, WEEKLY_SCHEDULE } from '../data/defaults';
import { addDays, isValidISO, startOfWeek, toISO, weekdayKey } from './dates';
import { phaseOn } from './progression';

/** Step labels prefer a product's short name so routines stay readable. */
function productName(products: Product[], id: string): string {
  const product = products.find((p) => p.id === id);
  return product?.shortName?.trim() || product?.name || id;
}

function step(
  id: string,
  name: string,
  kind: RoutineStep['kind'],
  instruction: string,
  mandatory: boolean,
  productId?: string,
  tips?: string[],
): RoutineStep {
  return { id, name, kind, instruction, mandatory, productId, tips };
}

/* ------------------------------------------------------------------ *
 * Which night is it?
 * ------------------------------------------------------------------ */

/** The weekday whose routine runs on this date, after any schedule shift. */
export function planWeekday(state: AppState, date: string) {
  const shift = state.settings.scheduleShift ?? 0;
  return weekdayKey(shift ? addDays(date, shift) : date);
}

/**
 * The night for a date comes from its (shifted) weekday and the plan phase,
 * nothing else. Logged or not, the next day is always just the next day.
 */
export function planNight(state: AppState, date: string): NightPlan {
  const day = planWeekday(state, date);
  const full = WEEKLY_SCHEDULE[day];
  const { phase } = phaseOn(state, date);

  if (full.kind === 'adapalene') {
    // Weeks 1–2: no adapalene. Weeks 3–4: Wednesdays only.
    const allowed = phase === 2 || (phase === 1 && day === 'wed');
    if (!allowed) return { kind: 'recovery', fullKind: full.kind, heldBack: 'phase' };
    if (!state.settings.adapaleneReady) {
      return { kind: 'recovery', fullKind: full.kind, heldBack: 'adapalene_not_ready' };
    }
  }
  return { kind: full.kind, mask: full.mask, fullKind: full.kind };
}

export type WeekPlan = { weekStart: string; days: { date: string; plan: NightPlan }[] };

export function planWeekNights(state: AppState, anyDateInWeek: string): WeekPlan {
  const weekStart = startOfWeek(anyDateInWeek);
  return {
    weekStart,
    days: Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return { date, plan: planNight(state, date) };
    }),
  };
}

/* ------------------------------------------------------------------ *
 * Routines
 * ------------------------------------------------------------------ */

export function buildMorning(state: AppState): RoutineStep[] {
  const { products } = state;
  return [
    step('am-rinse', 'Rinse with water', 'rinse', 'Just water this morning, no cleanser.', true),
    step('am-dry', 'Pat completely dry', 'dry', 'Pat your face completely dry before the dapsone.', true),
    step(
      'am-dapsone',
      productName(products, PRODUCT_IDS.dapsone),
      'dapsone',
      'A thin, pea-sized layer on the areas where you break out. Let it dry for a minute.',
      true,
      PRODUCT_IDS.dapsone,
      ['Don’t use benzoyl peroxide with dapsone. The combination can turn your skin or hair orange.'],
    ),
    step('am-moisturizer', productName(products, PRODUCT_IDS.lrp), 'moisturizer', 'An even layer over your whole face.', true, PRODUCT_IDS.lrp),
    step(
      'am-sunscreen',
      productName(products, PRODUCT_IDS.sunscreen),
      'sunscreen',
      'SPF 30 or higher. Never skip it.',
      true,
      PRODUCT_IDS.sunscreen,
      ['BHA and adapalene make your skin burn more easily, and sun makes picking marks darker and longer-lasting.'],
    ),
  ];
}

const MASK_TIPS = [
  'Never on BHA or adapalene nights: masks with AHA, BHA, retinol or “peeling” in the name.',
  'Avoid peel-off masks and nose pore strips completely. They damage your skin and make pores look bigger over time.',
];

function maskStep(state: AppState, mask: MaskKind, scheduled: boolean): RoutineStep {
  if (mask === 'clay') {
    return step(
      'pm-mask-clay',
      productName(state.products, PRODUCT_IDS.clayMask),
      'mask',
      'Only on your nose and T-zone. Take it off before it dries and cracks.',
      false,
      PRODUCT_IDS.clayMask,
      MASK_TIPS,
    );
  }
  return step(
    'pm-mask-hydrating',
    productName(state.products, PRODUCT_IDS.hydratingMask),
    'mask',
    scheduled
      ? 'A sheet mask, centella, cica or ceramide mask. Use it as directed on the pack.'
      : 'Optional tonight. Any recovery night works, as often as you want.',
    false,
    PRODUCT_IDS.hydratingMask,
    MASK_TIPS,
  );
}

/**
 * Every night: oil cleanser, Blanc cleanser, pat dry, tonight's step,
 * moisturizer, Vaseline. Only the middle and the Vaseline rule change.
 */
export function buildNight(state: AppState, plan: NightPlan): RoutineStep[] {
  const { products } = state;
  const steps: RoutineStep[] = [
    step(
      'pm-oil',
      productName(products, PRODUCT_IDS.oilCleanser),
      'cleanser',
      'Dry face, dry hands. Massage for 1–2 minutes, mostly on your nose. Add water until it turns milky, then rinse.',
      true,
      PRODUCT_IDS.oilCleanser,
    ),
    step(
      'pm-blanc',
      productName(products, PRODUCT_IDS.blanc),
      'cleanser',
      'This removes the oil film so it doesn’t clog your forehead. Rinse well.',
      true,
      PRODUCT_IDS.blanc,
    ),
    step('pm-dry', 'Pat completely dry', 'dry', 'Actives sting more on damp skin.', true),
  ];

  if (plan.kind === 'bha') {
    steps.push(
      step(
        'pm-bha',
        productName(products, PRODUCT_IDS.bha),
        'bha',
        'Fingers or a cotton pad. A full layer on your nose, a lighter one on your cheeks and forehead.',
        true,
        PRODUCT_IDS.bha,
        [
          'Avoid your eyes, the corners of your nose and mouth, and any picked or raw spots.',
          'A little tingle is normal. If burning or redness sticks around, cut back to once a week.',
        ],
      ),
      step('pm-bha-wait', 'Wait 2–3 minutes', 'wait', 'Let the BHA sit before your moisturizer.', true),
    );
  } else if (plan.kind === 'adapalene') {
    steps.push(
      step(
        'pm-adapalene',
        productName(products, PRODUCT_IDS.adapalene),
        'adapalene',
        'A pea-sized amount for your whole face, focusing on your forehead and wherever you get bumps.',
        true,
        PRODUCT_IDS.adapalene,
        [
          'Avoid your eyes, mouth corners and nose creases.',
          'Too irritating? Moisturizer first, then adapalene, then moisturizer again (a “sandwich”).',
          'A purge (extra small breakouts) for 4–8 weeks is normal. Keep going.',
        ],
      ),
    );
  } else {
    const product = (id: string) => products.find((p) => p.id === id)?.active !== false;
    if (plan.mask === 'clay' && product(PRODUCT_IDS.clayMask)) steps.push(maskStep(state, 'clay', true));
    else if (product(PRODUCT_IDS.hydratingMask)) steps.push(maskStep(state, 'hydrating', plan.mask === 'hydrating'));
  }

  steps.push(
    step('pm-moisturizer', productName(products, PRODUCT_IDS.lrp), 'moisturizer', 'An even layer over your whole face.', true, PRODUCT_IDS.lrp),
  );

  steps.push(
    plan.kind === 'recovery'
      ? step('pm-vaseline', productName(products, PRODUCT_IDS.vaseline), 'occlusive', 'Slug your whole face.', true, PRODUCT_IDS.vaseline)
      : step(
          'pm-vaseline',
          productName(products, PRODUCT_IDS.vaseline),
          'occlusive',
          'Only on dry, irritated or healing spots. Skip it if there are none.',
          false,
          PRODUCT_IDS.vaseline,
          ['Never over the active product. It makes it stronger and more irritating.'],
        ),
  );
  return steps;
}

const ROUTINE_TYPE: Record<NightKind, RoutineType> = {
  bha: 'pm_bha',
  adapalene: 'pm_adapalene',
  recovery: 'pm_recovery',
};

function nightSubtitle(plan: NightPlan): string {
  if (plan.kind === 'bha') return 'Vaseline on dry spots only';
  if (plan.kind === 'adapalene') return 'Vaseline on dry spots only';
  if (plan.mask) return `${MASK_LABEL[plan.mask]}, then Vaseline all over`;
  return 'Vaseline all over';
}

/* ------------------------------------------------------------------ *
 * Public entry point
 * ------------------------------------------------------------------ */

export function getDailyRoutine(state: AppState, date: string): DailyRoutine {
  const safeDate = isValidISO(date) ? date : toISO(new Date());
  const plan = planNight(state, safeDate);
  const info = phaseOn(state, safeDate);
  const amSteps = buildMorning(state);
  const pmSteps = buildNight(state, plan);

  const notices: string[] = [];
  if (info.steppedBack && info.stepBackReason) {
    notices.push(`${info.stepBackReason} The plan is one step gentler until your skin settles.`);
  }
  if (plan.heldBack === 'adapalene_not_ready') {
    notices.push(
      'This is an adapalene night on the plan. Until you have Differin and your dapsone prescriber says it’s okay, it’s a recovery night.',
    );
  }

  return {
    date: safeDate,
    week: info.week,
    phase: info.phase,
    steppedBack: info.steppedBack,
    am: {
      type: 'am',
      title: 'Morning',
      subtitle: 'Dapsone, moisturizer, sunscreen',
      steps: amSteps,
    },
    pm: {
      type: ROUTINE_TYPE[plan.kind],
      kind: plan.kind,
      title: NIGHT_LABEL[plan.kind],
      subtitle: nightSubtitle(plan),
      steps: pmSteps,
      mask: plan.kind === 'recovery' ? plan.mask : undefined,
    },
    notices,
  };
}
