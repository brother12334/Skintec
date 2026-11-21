/** Core SkinTec domain types. All user data is persisted locally. */

export type ProductCategory =
  | 'cleanser'
  | 'moisturizer'
  | 'treatment'
  | 'sunscreen'
  | 'mask'
  | 'other';

export type Product = {
  id: string;
  name: string;
  /** Compact label used in step lists where the full name is unwieldy. */
  shortName?: string;
  category: ProductCategory;
  notes?: string;
  active: boolean;
  /** Built-in products are referenced by the scheduler and cannot be deleted. */
  builtIn?: boolean;
};

export type RoutineStepKind =
  | 'rinse'
  | 'dry'
  | 'cleanser'
  | 'dapsone'
  | 'bha'
  | 'adapalene'
  | 'wait'
  | 'mask'
  | 'moisturizer'
  | 'occlusive'
  | 'sunscreen';

export type RoutineStep = {
  id: string;
  name: string;
  kind: RoutineStepKind;
  instruction: string;
  /** Exactly how to do it, in order: amounts, where, how long. */
  how?: string[];
  /** Extra notes from the plan, shown under the instruction. */
  tips?: string[];
  /** Required steps must be done before a routine counts as finished. */
  mandatory: boolean;
  productId?: string;
};

/** What a night is for. Every night runs the same base routine around it. */
export type NightKind = 'bha' | 'adapalene' | 'recovery';

export type MaskKind = 'clay' | 'hydrating';

export type RoutineType = 'am' | 'pm_bha' | 'pm_adapalene' | 'pm_recovery';

/** The three "start slowly" phases. 0 = weeks 1–2, 1 = weeks 3–4, 2 = week 5 on. */
export type PhaseIndex = 0 | 1 | 2;

export type RoutineCompletion = {
  date: string;
  routine: 'am' | 'pm';
  routineType: RoutineType;
  completedSteps: string[];
  completedAt?: string;
};

export type SkinComfort = 'comfortable' | 'a_little_dry' | 'irritated' | 'very_irritated';

export type SkinCheckIn = {
  date: string;
  comfort: SkinComfort;
  dryness: boolean;
  stinging: boolean;
  redness: boolean;
  peeling: boolean;
};

/** 'auto' follows the device clock: bright by day, dark after dark. */
export type ThemeMode = 'auto' | 'light' | 'dark';

export type NotificationSettings = {
  morningReminder: boolean;
  morningTime: string;
  nightReminder: boolean;
  nightTime: string;
  completionReminder: boolean;
};

export type Settings = {
  /** Day 1 of the plan. Phases count whole weeks from here. */
  startDate: string;
  /** Adapalene is bought and the dapsone prescriber has okayed it. Until then its nights are recovery. */
  adapaleneReady: boolean;
  /** "Go back a step for a week": the plan runs one phase gentler through this date. */
  stepBackUntil?: string;
  /**
   * Runs the whole week this many days early (0–6). At 1, Sunday gets
   * Monday's routine, Monday gets Tuesday's, and so on.
   */
  scheduleShift: number;
  notifications: NotificationSettings;
  themeMode: ThemeMode;
  reducedMotion: boolean;
  onboarded: boolean;
};

export type AppState = {
  version: number;
  settings: Settings;
  products: Product[];
  completions: RoutineCompletion[];
  checkIns: SkinCheckIn[];
};

/** What the scheduling engine decides for one calendar night. */
export type NightPlan = {
  kind: NightKind;
  mask?: MaskKind;
  /** What the full schedule has on this weekday, when tonight is gentler than that. */
  fullKind: NightKind;
  /** Why tonight is gentler than the full schedule, if it is. */
  heldBack?: 'phase' | 'adapalene_not_ready';
};

export type DailyRoutine = {
  date: string;
  week: number;
  phase: PhaseIndex;
  /** True while a manual or check-in step-back is lowering the phase. */
  steppedBack: boolean;
  am: {
    type: RoutineType;
    title: string;
    subtitle: string;
    steps: RoutineStep[];
  };
  pm: {
    type: RoutineType;
    kind: NightKind;
    title: string;
    subtitle: string;
    steps: RoutineStep[];
    mask?: MaskKind;
  };
  notices: string[];
};
