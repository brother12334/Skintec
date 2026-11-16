import type { AppState, PhaseIndex, SkinCheckIn } from '../types';
import { daysBetween, isValidISO } from './dates';

export type IrritationSignal = {
  significant: boolean;
  reason?: string;
  latest?: SkinCheckIn;
};

/**
 * Reads the last week of check-ins conservatively. This is scheduling input
 * only — SkinTec never interprets a check-in as a diagnosis.
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

  if (recent.some(isSignificant)) {
    return { significant: true, reason: 'You logged irritated skin this week.', latest };
  }
  return { significant: false, latest };
}

/** Plan week, 1-based. Days before the start date count as week 1. */
export function planWeek(state: AppState, onDate: string): number {
  const start = isValidISO(state.settings.startDate) ? state.settings.startDate : onDate;
  const elapsed = Math.max(0, daysBetween(start, onDate));
  return Math.floor(elapsed / 7) + 1;
}

export type PhaseInfo = {
  /** Phase the calendar alone would put you in. */
  scheduled: PhaseIndex;
  /** Phase actually used tonight, after any step back. */
  phase: PhaseIndex;
  week: number;
  steppedBack: boolean;
  stepBackReason?: string;
  /** First day of the next phase by the calendar, if there is one. */
  nextPhaseDate: string | null;
};

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map((n) => Number.parseInt(n, 10));
  const date = new Date(y, m - 1, d + days);
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const dd = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

/**
 * Weeks 1–2 → phase 0, weeks 3–4 → phase 1, week 5 on → phase 2.
 * Everything is derived from the start date and the calendar, never from what
 * was logged, so a missed night changes nothing: tomorrow is still tomorrow.
 *
 * "If your skin gets irritated, go back a step for a week": a step back comes
 * either from the manual button (stepBackUntil) or from an irritated check-in
 * in the last seven days.
 */
export function phaseOn(state: AppState, onDate: string): PhaseInfo {
  const week = planWeek(state, onDate);
  const scheduled: PhaseIndex = week <= 2 ? 0 : week <= 4 ? 1 : 2;

  const manual =
    isValidISO(state.settings.stepBackUntil) && daysBetween(onDate, state.settings.stepBackUntil!) >= 0;
  const irritation = readIrritation(state, onDate);
  const steppedBack = (manual || irritation.significant) && scheduled > 0;
  const phase = (steppedBack ? scheduled - 1 : scheduled) as PhaseIndex;

  const start = isValidISO(state.settings.startDate) ? state.settings.startDate : onDate;
  const nextPhaseDate = scheduled === 0 ? addDaysISO(start, 14) : scheduled === 1 ? addDaysISO(start, 28) : null;

  return {
    scheduled,
    phase,
    week,
    steppedBack,
    stepBackReason: steppedBack
      ? manual
        ? 'You chose to go back a step for a week.'
        : irritation.reason
      : undefined,
    nextPhaseDate,
  };
}
