import type { AppState, MaskKind, NightKind, Product, Settings } from '../types';
import type { WeekdayKey } from '../engine/dates';

export const PRODUCT_IDS = {
  oilCleanser: 'oil-cleanser',
  blanc: 'blanc-cleanser',
  dapsone: 'dapsone-gel',
  bha: 'paulas-choice-bha',
  adapalene: 'adapalene',
  lrp: 'lrp-moisturizer',
  vaseline: 'vaseline',
  sunscreen: 'sunscreen',
  clayMask: 'clay-mask',
  hydratingMask: 'hydrating-mask',
} as const;

export const defaultProducts: Product[] = [
  { id: PRODUCT_IDS.oilCleanser, name: 'Oil cleanser', category: 'cleanser', notes: 'First cleanse, on a dry face with dry hands.', active: true, builtIn: true },
  { id: PRODUCT_IDS.blanc, name: 'Blanc cleanser', category: 'cleanser', notes: 'Second cleanse. Removes the oil film so it does not clog your forehead.', active: true, builtIn: true },
  { id: PRODUCT_IDS.dapsone, name: 'Dapsone gel', category: 'treatment', notes: 'Every morning. Never with benzoyl peroxide: the combination can turn skin or hair orange.', active: true, builtIn: true },
  { id: PRODUCT_IDS.bha, name: "Paula's Choice 2% BHA Liquid Exfoliant", shortName: "Paula's Choice BHA", category: 'treatment', notes: 'BHA nights. A little tingle is normal.', active: true, builtIn: true },
  { id: PRODUCT_IDS.adapalene, name: 'Adapalene (Differin gel)', shortName: 'Adapalene', category: 'treatment', notes: 'Sold over the counter; you need to buy it. Check with your dapsone prescriber before adding it.', active: true, builtIn: true },
  { id: PRODUCT_IDS.lrp, name: 'La Roche-Posay moisturizer', shortName: 'La Roche-Posay', category: 'moisturizer', notes: 'Every morning and every night.', active: true, builtIn: true },
  { id: PRODUCT_IDS.vaseline, name: 'Vaseline', category: 'other', notes: 'Whole face on recovery nights. Only dry or healing spots on active nights.', active: true, builtIn: true },
  { id: PRODUCT_IDS.sunscreen, name: 'Sunscreen, SPF 30 or higher', shortName: 'Sunscreen', category: 'sunscreen', notes: 'Never skip it.', active: true, builtIn: true },
  { id: PRODUCT_IDS.clayMask, name: 'Clay mask (kaolin or bentonite)', shortName: 'Clay mask', category: 'mask', notes: 'Sundays, nose and T-zone only.', active: true, builtIn: true },
  { id: PRODUCT_IDS.hydratingMask, name: 'Hydrating or soothing mask', shortName: 'Hydrating mask', category: 'mask', notes: 'Sheet masks, centella, cica, ceramide. Any recovery night.', active: true, builtIn: true },
];

/** The full schedule (week 5 on). Phases only ever make a night gentler than this. */
export const WEEKLY_SCHEDULE: Record<WeekdayKey, { kind: NightKind; mask?: MaskKind }> = {
  mon: { kind: 'bha' },
  tue: { kind: 'recovery' },
  wed: { kind: 'adapalene' },
  thu: { kind: 'recovery', mask: 'hydrating' },
  fri: { kind: 'bha' },
  sat: { kind: 'adapalene' },
  sun: { kind: 'recovery', mask: 'clay' },
};

export const PHASES = [
  { name: 'Start slowly', weeks: 'Weeks 1–2', summary: 'Dapsone as normal, BHA on Monday and Friday, every other night is recovery.' },
  { name: 'Add adapalene', weeks: 'Weeks 3–4', summary: 'Adapalene on Wednesdays only. Saturday stays a recovery night.' },
  { name: 'Full schedule', weeks: 'Week 5 on', summary: 'BHA Monday and Friday, adapalene Wednesday and Saturday.' },
] as const;

export const NIGHT_LABEL: Record<NightKind, string> = {
  bha: 'BHA night',
  adapalene: 'Adapalene night',
  recovery: 'Recovery night',
};

export const MASK_LABEL: Record<MaskKind, string> = {
  clay: 'Clay mask',
  hydrating: 'Hydrating mask',
};

/** Every note from the plan, grouped for the Notes screen. */
export const PLAN_NOTES: { title: string; items: string[] }[] = [
  {
    title: 'Morning',
    items: [
      'Rinse with water, then pat your face completely dry.',
      'Dapsone gel: a thin, pea-sized layer on the areas where you break out. Let it dry for a minute.',
      'La Roche-Posay moisturizer, then sunscreen.',
      'Never skip sunscreen. BHA and adapalene make your skin burn more easily, and sun makes picking marks darker and longer-lasting.',
      'Don’t use benzoyl peroxide with dapsone. The combination can turn your skin or hair orange.',
    ],
  },
  {
    title: 'Every night',
    items: [
      'Oil cleanser: dry face, dry hands. Massage for 1–2 minutes, mostly on your nose. Add water until it turns milky, then rinse.',
      'Blanc cleanser: this removes the oil film so it doesn’t clog your forehead.',
      'Pat completely dry. Actives sting more on damp skin.',
      'Tonight’s step from the schedule, then La Roche-Posay moisturizer, then Vaseline.',
      'Exfoliation comes from the oil-cleanser massage on your nose and the BHA. No scrubs, brushes or exfoliating pads: with adapalene they irritate.',
    ],
  },
  {
    title: 'BHA nights',
    items: [
      'Use your fingers or a cotton pad. Put a full layer on your nose and a lighter one on your cheeks and forehead.',
      'Avoid your eyes, the corners of your nose and mouth, and any picked or raw spots.',
      'Wait 2–3 minutes, then put on your moisturizer.',
      'A little tingle is normal. If you get burning or redness that sticks around, cut back to once a week.',
    ],
  },
  {
    title: 'Adapalene nights',
    items: [
      'You’ll need to buy adapalene (Differin gel). It’s sold over the counter. Check with your dapsone prescriber before adding it.',
      'Use a pea-sized amount for your whole face, focusing on your forehead and wherever you get bumps.',
      'Avoid your eyes, mouth corners and nose creases.',
      'If it’s too irritating, put moisturizer on first, then adapalene, then moisturizer again (a “sandwich”).',
      'Expect a possible purge (extra small breakouts) for 4–8 weeks. That’s normal, so keep going.',
    ],
  },
  {
    title: 'Vaseline rule',
    items: [
      'Recovery nights: slug your whole face.',
      'BHA or adapalene nights: put Vaseline only on dry, irritated or healing spots, not over the active product. It makes the active stronger and more irritating.',
    ],
  },
  {
    title: 'Masks',
    items: [
      'Clay masks (kaolin or bentonite): Sundays, only on your nose and T-zone. Take it off before it dries and cracks, then moisturizer and Vaseline.',
      'Hydrating or soothing masks (sheet masks, centella, cica, ceramide): any recovery night, as often as you want. Moisturizer and Vaseline after.',
      'Never on BHA or adapalene nights: masks with AHA, BHA, retinol or “peeling” in the name.',
      'Avoid completely: peel-off masks and nose pore strips. They damage your skin and make pores look bigger over time.',
    ],
  },
  {
    title: 'Start slowly',
    items: [
      'Weeks 1–2: dapsone as normal, BHA Mon and Fri, every other night is recovery.',
      'Weeks 3–4: add adapalene on Wednesdays only.',
      'Week 5 on: the full schedule.',
      'If your skin gets irritated, go back a step for a week.',
    ],
  },
  {
    title: 'Missed a night?',
    items: ['Nothing moves. Each night follows its weekday, so just do tonight’s routine as planned.'],
  },
];

export function todayISO(date = new Date()): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const defaultSettings: Settings = {
  startDate: todayISO(),
  adapaleneReady: false,
  scheduleShift: 0,
  notifications: {
    morningReminder: false,
    morningTime: '07:30',
    nightReminder: false,
    nightTime: '21:30',
    completionReminder: false,
  },
  themeMode: 'light',
  reducedMotion: false,
  onboarded: false,
};

export function createDefaultState(): AppState {
  return {
    version: 2,
    settings: { ...defaultSettings, startDate: todayISO(), notifications: { ...defaultSettings.notifications } },
    products: defaultProducts.map((p) => ({ ...p })),
    completions: [],
    checkIns: [],
  };
}
