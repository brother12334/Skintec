/** Core SkinTec domain types. All user data is persisted locally. */

export type ProductCategory =
  | 'cleanser'
  | 'moisturizer'
  | 'treatment'
  | 'sunscreen'
  | 'mask'
  | 'serum'
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

export type Treatment = {
  id: string;
  name: string;
  active: boolean;
  frequency: string;
  concentration?: string;
  notes?: string;
};

export type RoutineStepKind =
  | 'cleanser'
  | 'moisturizer'
  | 'tretinoin'
  | 'retinol'
  | 'mask'
  | 'sunscreen'
  | 'serum'
  | 'derma_stamp'
  | 'oil'
  | 'wait';

export type RoutineStep = {
  id: string;
  name: string;
  kind: RoutineStepKind;
  instruction: string;
  /** Mandatory steps can never be toggled off — e.g. the closing moisturizer. */
  mandatory: boolean;
  productId?: string;
};

export type RoutineType =
  | 'am_standard'
  | 'am_skin_aqua'
  | 'pm_tretinoin'
  | 'pm_recovery'
  | 'pm_derma_stamp';

export type RoutineTemplate = {
  id: string;
  type: RoutineType;
  steps: RoutineStep[];
};

export type TretinoinFrequency =
  | 'twice_weekly'
  | 'three_times_weekly'
  | 'every_other_night'
  | 'nightly';

export type TretinoinProgressionStage = {
  id: string;
  name: string;
  frequency: TretinoinFrequency;
  durationWeeks?: number;
  enabled: boolean;
};

export type TretinoinProgression = {
  currentStage: number;
  approvedMaxFrequency: TretinoinFrequency;
  stageStartedAt: string;
  stageDurationWeeks: number;
  paused: boolean;
  pauseReason?: string;
};

export type Mask = {
  id: string;
  name: string;
  productId: string;
  requiresRecoveryNight: boolean;
  avoidWithTretinoin: boolean;
  avoidWithRetinol: boolean;
  /** Maximum uses per week. */
  frequencyLimit: number;
  /** ISO weekday keys: 'mon' … 'sun'. */
  preferredDays: string[];
  /** Higher wins when two masks want the same night. */
  priority: number;
  avoidWithMaskIds: string[];
  enabled: boolean;
};

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

export type MorningMode = 'standard' | 'skin_aqua';

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
  morningMode: MorningMode;
  tretinoinActive: boolean;
  tretinoinConcentration: string;
  restartDate: string;
  prescriberNotes: string;
  retinolActive: boolean;
  dermaStampActive: boolean;
  /** Weekday key ('mon'…'sun') the derma stamp is scheduled on. */
  dermaStampDay: string;
  notifications: NotificationSettings;
  themeMode: ThemeMode;
  reducedMotion: boolean;
  onboarded: boolean;
};

export type AppState = {
  version: number;
  settings: Settings;
  products: Product[];
  treatments: Treatment[];
  masks: Mask[];
  stages: TretinoinProgressionStage[];
  progression: TretinoinProgression;
  completions: RoutineCompletion[];
  checkIns: SkinCheckIn[];
};

/** What the scheduling engine returns for a given calendar date. */
export type NightPlan = {
  kind: 'tretinoin' | 'recovery' | 'derma_stamp';
  maskId?: string;
  maskMovedFrom?: string;
  /** Set when a treatment night was moved off the derma stamp night. */
  tretinoinMovedFrom?: string;
};

export type DailyRoutine = {
  date: string;
  am: {
    type: RoutineType;
    title: string;
    subtitle: string;
    steps: RoutineStep[];
  };
  pm: {
    type: RoutineType;
    title: string;
    subtitle: string;
    steps: RoutineStep[];
    maskId?: string;
    maskName?: string;
    maskMovedFrom?: string;
    tretinoinMovedFrom?: string;
  };
  stage: TretinoinProgressionStage | null;
  stageIndex: number;
  frequency: TretinoinFrequency | null;
  progressionPaused: boolean;
  pauseReason?: string;
  notices: string[];
};
