import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  AppState,
  Mask,
  Product,
  RoutineCompletion,
  Settings,
  SkinCheckIn,
  Treatment,
  TretinoinProgression,
  TretinoinProgressionStage,
} from '../types';
import { createDefaultState, defaultStages } from '../data/defaults';
import { isValidISO, toISO } from '../engine/dates';

const STORAGE_KEY = 'skintec.state.v1';

export type StoreValue = {
  state: AppState;
  /** True when saved data could not be read and a safe default was restored. */
  recovered: boolean;
  dismissRecovery: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  updateProgression: (patch: Partial<TretinoinProgression>) => void;
  setStages: (stages: TretinoinProgressionStage[]) => void;
  upsertProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  upsertTreatment: (treatment: Treatment) => void;
  updateMask: (id: string, patch: Partial<Mask>) => void;
  setCompletion: (completion: RoutineCompletion) => void;
  clearCompletion: (date: string, routine: 'am' | 'pm') => void;
  addCheckIn: (checkIn: SkinCheckIn) => void;
  resetAll: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Merges persisted data onto a fresh default state, dropping anything malformed.
 * Corrupted or partial saves degrade to a safe, usable routine instead of a crash.
 */
export function hydrate(raw: unknown): { state: AppState; recovered: boolean } {
  const base = createDefaultState();
  if (!isObject(raw)) return { state: base, recovered: true };

  let recovered = false;
  const state: AppState = base;

  if (isObject(raw.settings)) {
    const s = raw.settings as Partial<Settings>;
    state.settings = {
      ...base.settings,
      ...s,
      morningMode: s.morningMode === 'skin_aqua' ? 'skin_aqua' : 'standard',
      aquaphorMorning:
        s.aquaphorMorning === 'spot' || s.aquaphorMorning === 'face' ? s.aquaphorMorning : 'off',
      aquaphorNight: s.aquaphorNight === 'spot' || s.aquaphorNight === 'face' ? s.aquaphorNight : 'off',
      themeMode:
        s.themeMode === 'light' || s.themeMode === 'dark' || s.themeMode === 'auto'
          ? s.themeMode
          : base.settings.themeMode,
      restartDate: isValidISO(s.restartDate) ? (s.restartDate as string) : base.settings.restartDate,
      notifications: { ...base.settings.notifications, ...(isObject(s.notifications) ? s.notifications : {}) },
    };
  } else {
    recovered = true;
  }

  if (Array.isArray(raw.products)) {
    const products = (raw.products as Product[]).filter(
      (p) => isObject(p) && typeof p.id === 'string' && typeof p.name === 'string',
    );
    // Built-in products the scheduler depends on are always restored.
    const byId = new Map(products.map((p) => [p.id, { ...p, active: p.active !== false }]));
    for (const builtIn of base.products) {
      if (!byId.has(builtIn.id)) byId.set(builtIn.id, builtIn);
      else byId.set(builtIn.id, { ...byId.get(builtIn.id)!, builtIn: true, category: byId.get(builtIn.id)!.category ?? builtIn.category });
    }
    state.products = [...byId.values()];
  }

  if (Array.isArray(raw.treatments)) {
    const treatments = (raw.treatments as Treatment[]).filter((t) => isObject(t) && typeof t.id === 'string');
    if (treatments.length > 0) state.treatments = treatments;
  }

  if (Array.isArray(raw.masks)) {
    state.masks = base.masks.map((builtIn) => {
      const saved = (raw.masks as Mask[]).find((m) => isObject(m) && m.id === builtIn.id);
      if (!saved) return builtIn;
      return {
        ...builtIn,
        ...saved,
        // Compatibility rules are product safety, not user preferences.
        requiresRecoveryNight: builtIn.requiresRecoveryNight,
        avoidWithTretinoin: builtIn.avoidWithTretinoin,
        avoidWithMaskIds: builtIn.avoidWithMaskIds,
        preferredDays: Array.isArray(saved.preferredDays) ? saved.preferredDays : builtIn.preferredDays,
        frequencyLimit: Number.isFinite(saved.frequencyLimit) ? saved.frequencyLimit : builtIn.frequencyLimit,
      };
    });
  }

  if (Array.isArray(raw.stages) && (raw.stages as TretinoinProgressionStage[]).length > 0) {
    const stages = (raw.stages as TretinoinProgressionStage[]).filter(
      (s) => isObject(s) && typeof s.id === 'string' && typeof s.frequency === 'string',
    );
    state.stages = stages.length === defaultStages.length ? stages : base.stages;
  }

  if (isObject(raw.progression)) {
    const p = raw.progression as Partial<TretinoinProgression>;
    const maxOk =
      p.approvedMaxFrequency === 'twice_weekly' ||
      p.approvedMaxFrequency === 'three_times_weekly' ||
      p.approvedMaxFrequency === 'every_other_night' ||
      p.approvedMaxFrequency === 'nightly';
    state.progression = {
      ...base.progression,
      ...p,
      approvedMaxFrequency: maxOk ? p.approvedMaxFrequency! : base.progression.approvedMaxFrequency,
      currentStage:
        Number.isInteger(p.currentStage) && p.currentStage! >= 0 && p.currentStage! < state.stages.length
          ? p.currentStage!
          : 0,
      stageStartedAt: isValidISO(p.stageStartedAt) ? p.stageStartedAt! : state.settings.restartDate,
      stageDurationWeeks:
        Number.isFinite(p.stageDurationWeeks) && p.stageDurationWeeks! > 0 ? p.stageDurationWeeks! : 2,
      paused: Boolean(p.paused),
    };
  }

  if (Array.isArray(raw.completions)) {
    state.completions = (raw.completions as RoutineCompletion[]).filter(
      (c) => isObject(c) && isValidISO(c.date) && (c.routine === 'am' || c.routine === 'pm') && Array.isArray(c.completedSteps),
    );
  }

  if (Array.isArray(raw.checkIns)) {
    state.checkIns = (raw.checkIns as SkinCheckIn[]).filter((c) => isObject(c) && isValidISO(c.date));
  }

  return { state, recovered };
}

function load(): { state: AppState; recovered: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { state: createDefaultState(), recovered: false };
    return hydrate(JSON.parse(raw));
  } catch {
    return { state: createDefaultState(), recovered: true };
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = useRef(load());
  const [state, setState] = useState<AppState>(initial.current.state);
  const [recovered, setRecovered] = useState(initial.current.recovered);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage may be unavailable (private mode / quota). The session still works.
    }
  }, [state]);

  const patch = useCallback((fn: (prev: AppState) => AppState) => setState((prev) => fn(prev)), []);

  const value = useMemo<StoreValue>(
    () => ({
      state,
      recovered,
      dismissRecovery: () => setRecovered(false),
      updateSettings: (p) => patch((prev) => ({ ...prev, settings: { ...prev.settings, ...p } })),
      updateProgression: (p) => patch((prev) => ({ ...prev, progression: { ...prev.progression, ...p } })),
      setStages: (stages) => patch((prev) => ({ ...prev, stages })),
      upsertProduct: (product) =>
        patch((prev) => {
          const exists = prev.products.some((p) => p.id === product.id);
          return {
            ...prev,
            products: exists
              ? prev.products.map((p) => (p.id === product.id ? { ...p, ...product } : p))
              : [...prev.products, product],
          };
        }),
      removeProduct: (id) =>
        patch((prev) => ({
          ...prev,
          // Built-in products are deactivated rather than deleted so the
          // scheduler never loses a step it depends on.
          products: prev.products.some((p) => p.id === id && p.builtIn)
            ? prev.products.map((p) => (p.id === id ? { ...p, active: false } : p))
            : prev.products.filter((p) => p.id !== id),
        })),
      upsertTreatment: (treatment) =>
        patch((prev) => ({
          ...prev,
          treatments: prev.treatments.some((t) => t.id === treatment.id)
            ? prev.treatments.map((t) => (t.id === treatment.id ? { ...t, ...treatment } : t))
            : [...prev.treatments, treatment],
        })),
      updateMask: (id, p) =>
        patch((prev) => ({ ...prev, masks: prev.masks.map((m) => (m.id === id ? { ...m, ...p } : m)) })),
      setCompletion: (completion) =>
        patch((prev) => ({
          ...prev,
          completions: [
            ...prev.completions.filter((c) => !(c.date === completion.date && c.routine === completion.routine)),
            completion,
          ],
        })),
      clearCompletion: (date, routine) =>
        patch((prev) => ({
          ...prev,
          completions: prev.completions.filter((c) => !(c.date === date && c.routine === routine)),
        })),
      addCheckIn: (checkIn) =>
        patch((prev) => ({
          ...prev,
          checkIns: [...prev.checkIns.filter((c) => c.date !== checkIn.date), checkIn],
        })),
      resetAll: () => {
        const fresh = createDefaultState();
        fresh.settings.onboarded = true;
        fresh.settings.restartDate = toISO(new Date());
        setState(fresh);
      },
    }),
    [state, recovered, patch],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
