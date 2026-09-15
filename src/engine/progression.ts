import type {
  AppState,
  SkinCheckIn,
  TretinoinFrequency,
  TretinoinProgressionStage,
} from '../types';
import { daysBetween, isValidISO } from './dates';

/** Ordered from gentlest to most frequent. The approved maximum is a ceiling on this ladder. */
export const FREQUENCY_ORDER: TretinoinFrequency[] = [
  'twice_weekly',
  'three_times_weekly',
  'every_other_night',
  'nightly',
];

export function frequencyRank(frequency: TretinoinFrequency): number {
  return FREQUENCY_ORDER.indexOf(frequency);
}

/** Stages the user is allowed to reach: enabled, and at or below the prescriber-approved maximum. */
export function allowedStages(state: AppState): TretinoinProgressionStage[] {
  const ceiling = frequencyRank(state.progression.approvedMaxFrequency);
  return state.stages.filter((s) => s.enabled && frequencyRank(s.frequency) <= ceiling);
}

export type IrritationSignal = {
  significant: boolean;
  reason?: string;
  latest?: SkinCheckIn;
};

/**
 * Reads recent check-ins conservatively. This is scheduling input only — SkinTec
 * never interprets a check-in as a diagnosis.
 */
export function readIrritation(state: AppState, onDate: string): IrritationSignal {
  const recent = state.checkIns
    .filter((c) => isValidISO(c.date))
    .filter((c) => {
      const delta = daysBetween(c.date, onDate);
      return delta >= 0 && delta <= 6;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  if (recent.length === 0) return { significant: false };
  const latest = recent[0];

  const indicatorCount = (c: SkinCheckIn) =>
    [c.dryness, c.stinging, c.redness, c.peeling].filter(Boolean).length;

  const isSignificant = (c: SkinCheckIn) =>
    c.comfort === 'very_irritated' || (c.comfort === 'irritated' && indicatorCount(c) >= 1);

  const significantCount = recent.filter(isSignificant).length;

  if (latest.comfort === 'very_irritated') {
    return { significant: true, reason: 'You reported significant irritation in a recent check-in.', latest };
  }
  if (significantCount >= 2) {
    return { significant: true, reason: 'Your recent check-ins have repeatedly reported irritation.', latest };
  }
  if (isSignificant(latest)) {
    return { significant: true, reason: 'Your most recent check-in reported irritation.', latest };
  }
  return { significant: false, latest };
}

export type EffectiveProgression = {
  stage: TretinoinProgressionStage | null;
  /** Index within the allowed stage ladder. */
  stageIndex: number;
  stageCount: number;
  stageStartedAt: string;
  frequency: TretinoinFrequency | null;
  nextStage: TretinoinProgressionStage | null;
  nextStageDate: string | null;
  paused: boolean;
  pauseReason?: string;
};

/**
 * Resolves which progression stage applies on a given date.
 *
 * Time advances the stage automatically, but only while progression is not paused
 * and only up to the prescriber-approved maximum frequency. Because the result is
 * derived from `stageStartedAt` rather than accumulated writes, missed days and
 * date/timezone changes can never corrupt the ladder.
 */
export function effectiveProgression(state: AppState, onDate: string): EffectiveProgression {
  const ladder = allowedStages(state);
  if (!state.settings.tretinoinActive || ladder.length === 0) {
    return {
      stage: null,
      stageIndex: -1,
      stageCount: ladder.length,
      stageStartedAt: state.progression.stageStartedAt,
      frequency: null,
      nextStage: null,
      nextStageDate: null,
      paused: state.progression.paused,
      pauseReason: state.progression.pauseReason,
    };
  }

  const storedStage = state.stages[state.progression.currentStage] ?? state.stages[0];
  // Clamp into the allowed ladder — the approved maximum may have been lowered.
  let index = ladder.findIndex((s) => s.id === storedStage?.id);
  if (index === -1) {
    const storedRank = storedStage ? frequencyRank(storedStage.frequency) : 0;
    index = ladder.reduce(
      (best, s, i) => (frequencyRank(s.frequency) <= storedRank ? i : best),
      0,
    );
  }

  let startedAt = isValidISO(state.progression.stageStartedAt)
    ? state.progression.stageStartedAt
    : state.settings.restartDate;
  if (!isValidISO(startedAt)) startedAt = onDate;

  const irritation = readIrritation(state, onDate);
  const paused = state.progression.paused || irritation.significant;
  const pauseReason = state.progression.paused
    ? state.progression.pauseReason ?? 'Progression is paused.'
    : irritation.reason;

  const durationOf = (stage: TretinoinProgressionStage) =>
    Math.max(1, stage.durationWeeks ?? state.progression.stageDurationWeeks) * 7;

  if (!paused) {
    let guard = 0;
    while (index < ladder.length - 1 && guard++ < 64) {
      const elapsed = daysBetween(startedAt, onDate);
      const needed = durationOf(ladder[index]);
      if (elapsed < needed) break;
      startedAt = addDaysISO(startedAt, needed);
      index += 1;
    }
  }

  const stage = ladder[index];
  const nextStage = index < ladder.length - 1 ? ladder[index + 1] : null;
  const nextStageDate = nextStage && !paused ? addDaysISO(startedAt, durationOf(stage)) : null;

  return {
    stage,
    stageIndex: index,
    stageCount: ladder.length,
    stageStartedAt: startedAt,
    frequency: stage.frequency,
    nextStage,
    nextStageDate,
    paused,
    pauseReason: paused ? pauseReason : undefined,
  };
}

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map((n) => Number.parseInt(n, 10));
  const date = new Date(y, m - 1, d + days);
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const dd = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

/** Week number of the restart, 1-based, for the "Week 3 of 8" readout. */
export function restartWeek(state: AppState, onDate: string): number {
  const start = isValidISO(state.settings.restartDate) ? state.settings.restartDate : onDate;
  const elapsed = Math.max(0, daysBetween(start, onDate));
  return Math.floor(elapsed / 7) + 1;
}

/** Total planned weeks across the allowed ladder (open-ended stages count as ongoing). */
export function plannedWeeks(state: AppState): number | null {
  const ladder = allowedStages(state);
  if (ladder.length === 0) return null;
  let total = 0;
  for (const stage of ladder) {
    if (stage.durationWeeks == null) return null;
    total += stage.durationWeeks;
  }
  return total;
}
