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
import type { AppState, Product, RoutineCompletion, Settings, SkinCheckIn } from '../types';
import { createDefaultState } from '../data/defaults';
import { toISO } from '../engine/dates';
import { hydrate } from './hydrate';

export { hydrate };

const STORAGE_KEY = 'skintec.state.v2';
/** Where the old tretinoin plan saved. Read once to carry preferences and history over. */
const LEGACY_KEY = 'skintec.state.v1';

export type StoreValue = {
  state: AppState;
  /** True when saved data could not be read and a safe default was restored. */
  recovered: boolean;
  dismissRecovery: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  upsertProduct: (product: Product) => void;
  setCompletion: (completion: RoutineCompletion) => void;
  clearCompletion: (date: string, routine: 'am' | 'pm') => void;
  addCheckIn: (checkIn: SkinCheckIn) => void;
  resetAll: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

function load(): { state: AppState; recovered: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
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
        fresh.settings.startDate = toISO(new Date());
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
