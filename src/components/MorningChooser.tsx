import { useMemo } from 'react';
import type { AppState, MorningMode } from '../types';
import { buildMorningRoutine } from '../engine/scheduler';
import { SkinTecIcon, STEP_ICON } from '../icons/SkinTecIcon';

const MODES: { value: MorningMode; label: string }[] = [
  { value: 'standard', label: 'Moisturizer and sunscreen' },
  { value: 'skin_aqua', label: 'UV serum only' },
];

/**
 * Names the products in each morning so the choice is explicit.
 * Step labels come from the scheduler, so renaming a product updates them here too.
 */
export function MorningChooser({
  state,
  value,
  onChange,
}: {
  state: AppState;
  value: MorningMode;
  onChange: (mode: MorningMode) => void;
}) {
  const options = useMemo(
    () =>
      MODES.map((mode) => ({
        ...mode,
        steps: buildMorningRoutine({ ...state, settings: { ...state.settings, morningMode: mode.value } }).steps,
      })),
    [state],
  );

  return (
    <div className="st-choice-group" role="radiogroup" aria-label="Morning routine">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`st-choice${selected ? ' is-selected' : ''}`}
            onClick={() => onChange(option.value)}
          >
            <span className="st-choice-head">
              <span className="st-choice-label">{option.label}</span>
              <span className={`st-choice-tick${selected ? ' is-on' : ''}`} aria-hidden="true">
                {selected ? <SkinTecIcon name="completion" size={18} /> : null}
              </span>
            </span>
            <span className="st-choice-steps">
              {option.steps.map((step, i) => (
                <span className="st-choice-step" key={step.id}>
                  <SkinTecIcon name={STEP_ICON[step.kind] ?? 'products'} size={16} />
                  {step.name}
                  {i < option.steps.length - 1 ? <span className="st-choice-sep" aria-hidden="true" /> : null}
                </span>
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
