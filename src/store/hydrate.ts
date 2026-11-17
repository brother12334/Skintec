import type { AppState, Product, RoutineCompletion, RoutineType, Settings, SkinCheckIn } from '../types';
import { createDefaultState } from '../data/defaults';
import { isValidISO } from '../engine/dates';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const ROUTINE_TYPES: RoutineType[] = ['am', 'pm_bha', 'pm_adapalene', 'pm_recovery'];

/** Old (v1) routine types that still mean the same thing under the new plan. */
const LEGACY_TYPES: Record<string, RoutineType> = {
  am_standard: 'am',
  am_skin_aqua: 'am',
  pm_recovery: 'pm_recovery',
};

/**
 * Merges persisted data onto a fresh default state, dropping anything malformed.
 * Corrupted or partial saves degrade to a safe, usable routine instead of a crash.
 *
 * Data saved by the old tretinoin plan (v1) keeps its display preferences,
 * check-ins and the completions that still make sense, and goes back through
 * setup so the new plan gets a real start date.
 */
export function hydrate(raw: unknown): { state: AppState; recovered: boolean } {
  const base = createDefaultState();
  if (!isObject(raw)) return { state: base, recovered: true };

  let recovered = false;
  const state: AppState = base;
  const legacy = raw.version !== 2;

  if (isObject(raw.settings)) {
    const s = raw.settings as Partial<Settings>;
    state.settings = {
      ...base.settings,
      // The pastel redesign is the new default look, so an old theme choice isn't carried over.
      themeMode:
        !legacy && (s.themeMode === 'light' || s.themeMode === 'dark' || s.themeMode === 'auto') ? s.themeMode : base.settings.themeMode,
      reducedMotion: Boolean(s.reducedMotion),
      notifications: { ...base.settings.notifications, ...(isObject(s.notifications) ? s.notifications : {}) },
      onboarded: legacy ? false : Boolean(s.onboarded),
      startDate: !legacy && isValidISO(s.startDate) ? (s.startDate as string) : base.settings.startDate,
      adapaleneReady: !legacy && Boolean(s.adapaleneReady),
      stepBackUntil: !legacy && isValidISO(s.stepBackUntil) ? s.stepBackUntil : undefined,
      scheduleShift:
        !legacy && Number.isInteger(s.scheduleShift) && s.scheduleShift! >= 0 && s.scheduleShift! <= 6 ? s.scheduleShift! : 0,
    };
  } else {
    recovered = true;
  }

  if (!legacy && Array.isArray(raw.products)) {
    const products = (raw.products as Product[]).filter(
      (p) => isObject(p) && typeof p.id === 'string' && typeof p.name === 'string',
    );
    // Built-in products the scheduler depends on are always restored.
    const byId = new Map(products.map((p) => [p.id, { ...p, active: p.active !== false }]));
    for (const builtIn of base.products) {
      const saved = byId.get(builtIn.id);
      byId.set(builtIn.id, saved ? { ...builtIn, ...saved, builtIn: true, category: saved.category ?? builtIn.category } : builtIn);
    }
    state.products = [...byId.values()];
  }

  if (Array.isArray(raw.completions)) {
    state.completions = (raw.completions as RoutineCompletion[])
      .filter((c) => isObject(c) && isValidISO(c.date) && (c.routine === 'am' || c.routine === 'pm') && Array.isArray(c.completedSteps))
      .map((c) => {
        const type = ROUTINE_TYPES.includes(c.routineType) && !legacy ? c.routineType : LEGACY_TYPES[c.routineType as string];
        return type ? { ...c, routineType: type } : null;
      })
      .filter((c): c is RoutineCompletion => c !== null);
  }

  if (Array.isArray(raw.checkIns)) {
    state.checkIns = (raw.checkIns as SkinCheckIn[]).filter((c) => isObject(c) && isValidISO(c.date));
  }

  return { state, recovered };
}
