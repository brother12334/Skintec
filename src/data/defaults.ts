import type {
  AppState,
  Mask,
  Product,
  Settings,
  Treatment,
  TretinoinProgressionStage,
} from '../types';

export const PRODUCT_IDS = {
  anuaFirst: 'anua-first-cleanser',
  anuaSecond: 'anua-second-cleanser',
  lrp: 'lrp-triple-repair',
  collagenBank: 'neutrogena-collagen-bank',
  tretinoin: 'tretinoin',
  retinol: 'retinol',
  volcanoMask: 'alaskan-volcano-mask',
  riceMask: 'korean-rice-mask',
  laserDermMask: 'laserderm-korean-mask',
  sunscreen: 'sunscreen',
  skinAqua: 'skin-aqua-uv-serum',
  dermaStamp: 'derma-stamp',
  arganOil: 'argan-oil',
  aquaphor: 'aquaphor',
} as const;

export const defaultProducts: Product[] = [
  { id: PRODUCT_IDS.anuaFirst, name: 'Anua First Cleanser', category: 'cleanser', notes: 'Oil-based first cleanse.', active: true, builtIn: true },
  { id: PRODUCT_IDS.anuaSecond, name: 'Anua Second Cleanser', category: 'cleanser', notes: 'Gentle water-based second cleanse.', active: true, builtIn: true },
  { id: PRODUCT_IDS.lrp, name: 'La Roche-Posay Triple Repair Moisturizing Cream', shortName: 'LRP Triple Repair', category: 'moisturizer', notes: 'Barrier cream. Used on both sides of tretinoin.', active: true, builtIn: true },
  { id: PRODUCT_IDS.collagenBank, name: 'Neutrogena Collagen Bank', shortName: 'Collagen Bank', category: 'serum', notes: 'In your library. Not scheduled automatically — add it to a routine yourself if you want it.', active: true, builtIn: true },
  { id: PRODUCT_IDS.tretinoin, name: 'Tretinoin', category: 'treatment', notes: 'Prescription retinoid. Follow your prescriber.', active: true, builtIn: true },
  { id: PRODUCT_IDS.retinol, name: 'Retinol', category: 'treatment', notes: 'Never scheduled on a tretinoin night.', active: false, builtIn: true },
  { id: PRODUCT_IDS.volcanoMask, name: 'Alaskan Volcano Mask', category: 'mask', notes: 'More intensive. Recovery nights only.', active: true, builtIn: true },
  { id: PRODUCT_IDS.riceMask, name: 'Korean Rice Mask', category: 'mask', notes: 'Gentle, recovery-compatible.', active: true, builtIn: true },
  { id: PRODUCT_IDS.laserDermMask, name: 'LaserDerm Korean Mask', shortName: 'LaserDerm Mask', category: 'mask', notes: 'Soothing sheet mask, recovery-compatible.', active: true, builtIn: true },
  { id: PRODUCT_IDS.sunscreen, name: 'Sunscreen', category: 'sunscreen', notes: 'Placeholder — rename it to the sunscreen you actually use.', active: true, builtIn: true },
  { id: PRODUCT_IDS.skinAqua, name: 'Skin Aqua UV Serum', category: 'sunscreen', notes: 'Used alone in Skin Aqua mornings.', active: true, builtIn: true },
  { id: PRODUCT_IDS.dermaStamp, name: 'Derma Stamp', category: 'treatment', notes: 'Weekly. Never on a tretinoin night — SkinTec keeps them apart.', active: true, builtIn: true },
  { id: PRODUCT_IDS.arganOil, name: 'Argan Oil', category: 'other', notes: 'Applied immediately after the derma stamp.', active: true, builtIn: true },
  { id: PRODUCT_IDS.aquaphor, name: 'Aquaphor', category: 'other', notes: 'Optional last step. You choose spot treatment or whole face while doing the routine.', active: true, builtIn: true },
];

export const defaultTreatments: Treatment[] = [
  { id: 'treatment-tretinoin', name: 'Tretinoin', active: true, frequency: 'Scheduled by SkinTec', concentration: '0.025%', notes: '' },
  { id: 'treatment-retinol', name: 'Retinol', active: false, frequency: 'Not scheduled', concentration: '', notes: 'Never combined with tretinoin.' },
  { id: 'treatment-derma-stamp', name: 'Derma Stamp', active: true, frequency: 'Weekly', notes: 'Followed immediately by argan oil.' },
];

export const defaultMasks: Mask[] = [
  {
    id: 'mask-volcano',
    name: 'Alaskan Volcano Mask',
    productId: PRODUCT_IDS.volcanoMask,
    requiresRecoveryNight: true,
    avoidWithTretinoin: true,
    avoidWithRetinol: true,
    frequencyLimit: 1,
    preferredDays: ['sat'],
    priority: 3,
    avoidWithMaskIds: ['mask-laserderm'],
    enabled: true,
  },
  {
    id: 'mask-rice',
    name: 'Korean Rice Mask',
    productId: PRODUCT_IDS.riceMask,
    requiresRecoveryNight: true,
    avoidWithTretinoin: true,
    avoidWithRetinol: false,
    frequencyLimit: 1,
    preferredDays: ['tue'],
    priority: 2,
    avoidWithMaskIds: [],
    enabled: true,
  },
  {
    id: 'mask-laserderm',
    name: 'LaserDerm Korean Mask',
    productId: PRODUCT_IDS.laserDermMask,
    requiresRecoveryNight: true,
    avoidWithTretinoin: true,
    avoidWithRetinol: false,
    frequencyLimit: 1,
    preferredDays: ['thu'],
    priority: 1,
    avoidWithMaskIds: ['mask-volcano'],
    enabled: true,
  },
];

/** Progression is configuration, never hard-coded in the UI. */
export const defaultStages: TretinoinProgressionStage[] = [
  { id: 'stage-1', name: 'Initial restart', frequency: 'twice_weekly', durationWeeks: 2, enabled: true },
  { id: 'stage-2', name: 'Increased frequency', frequency: 'three_times_weekly', durationWeeks: 2, enabled: true },
  { id: 'stage-3', name: 'Every other night', frequency: 'every_other_night', durationWeeks: 2, enabled: true },
  { id: 'stage-4', name: 'Nightly', frequency: 'nightly', enabled: true },
];

export function todayISO(date = new Date()): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const defaultSettings: Settings = {
  morningMode: 'standard',
  tretinoinActive: true,
  tretinoinConcentration: '0.025%',
  restartDate: todayISO(),
  prescriberNotes: '',
  retinolActive: false,
  dermaStampActive: true,
  dermaStampDay: 'wed',
  notifications: {
    morningReminder: false,
    morningTime: '07:30',
    nightReminder: false,
    nightTime: '21:30',
    completionReminder: false,
  },
  themeMode: 'auto',
  reducedMotion: false,
  onboarded: false,
};

export function createDefaultState(): AppState {
  const restart = todayISO();
  return {
    version: 1,
    settings: { ...defaultSettings, restartDate: restart },
    products: defaultProducts.map((p) => ({ ...p })),
    treatments: defaultTreatments.map((t) => ({ ...t })),
    masks: defaultMasks.map((m) => ({ ...m, preferredDays: [...m.preferredDays], avoidWithMaskIds: [...m.avoidWithMaskIds] })),
    stages: defaultStages.map((s) => ({ ...s })),
    progression: {
      currentStage: 0,
      approvedMaxFrequency: 'every_other_night',
      stageStartedAt: restart,
      stageDurationWeeks: 2,
      paused: false,
    },
    completions: [],
    checkIns: [],
  };
}

export const FREQUENCY_LABEL: Record<string, string> = {
  twice_weekly: '2 nights / week',
  three_times_weekly: '3 nights / week',
  every_other_night: 'Every other night',
  nightly: 'Every night',
};

export const FREQUENCY_SHORT: Record<string, string> = {
  twice_weekly: '2× weekly',
  three_times_weekly: '3× weekly',
  every_other_night: 'Every other night',
  nightly: 'Nightly',
};
