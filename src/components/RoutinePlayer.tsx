import { useMemo, useState } from 'react';
import type { AquaphorChoice, RoutineStep, RoutineType } from '../types';
import { SkinTecIcon, STEP_ICON } from '../icons/SkinTecIcon';
import { Button, IconButton, ProgressBar } from './ui';

type Props = {
  title: string;
  subtitle: string;
  steps: RoutineStep[];
  routine: 'am' | 'pm';
  routineType: RoutineType;
  initialCompleted: string[];
  initialAquaphor?: AquaphorChoice;
  onSave: (completedSteps: string[], finished: boolean, aquaphor?: AquaphorChoice) => void;
  onClose: () => void;
};

export function RoutinePlayer({
  title,
  subtitle,
  steps,
  routine,
  initialCompleted,
  initialAquaphor,
  onSave,
  onClose,
}: Props) {
  const isNight = routine === 'pm';
  const [completed, setCompleted] = useState<string[]>(
    initialCompleted.filter((id) => steps.some((s) => s.id === id)),
  );
  const [aquaphor, setAquaphor] = useState<AquaphorChoice | undefined>(initialAquaphor);
  const [index, setIndex] = useState(() => {
    const first = steps.findIndex((s) => !initialCompleted.includes(s.id));
    return first === -1 ? steps.length : first;
  });

  const mandatory = useMemo(() => steps.filter((s) => s.mandatory), [steps]);
  const allMandatoryDone = mandatory.every((s) => completed.includes(s.id));
  const done = completed.length;
  const atSummary = index >= steps.length;
  const step = atSummary ? null : steps[index];

  function toggle(id: string, next: boolean) {
    setCompleted((prev) => {
      const set = next ? [...new Set([...prev, id])] : prev.filter((s) => s !== id);
      const choice = id === 'aquaphor' && !next ? undefined : aquaphor;
      if (id === 'aquaphor' && !next) setAquaphor(undefined);
      onSave(set, false, choice);
      return set;
    });
  }

  function markAndAdvance() {
    if (!step) return;
    const next = [...new Set([...completed, step.id])];
    setCompleted(next);
    onSave(next, false, aquaphor);
    setIndex((i) => Math.min(steps.length, i + 1));
  }

  /** Aquaphor is decided here, in the routine: spots, whole face, or not tonight. */
  function chooseAquaphor(choice: AquaphorChoice) {
    if (!step) return;
    const next = [...new Set([...completed, step.id])];
    setAquaphor(choice);
    setCompleted(next);
    onSave(next, false, choice);
    setIndex((i) => Math.min(steps.length, i + 1));
  }

  function skipAquaphor() {
    if (!step) return;
    const next = completed.filter((id) => id !== step.id);
    setAquaphor(undefined);
    setCompleted(next);
    onSave(next, false, undefined);
    setIndex((i) => Math.min(steps.length, i + 1));
  }

  return (
    <div className="st-player" role="dialog" aria-modal="true" aria-label={`${title} routine`}>
      <header className="st-player-head">
        <IconButton name="back" label="Close routine" onClick={onClose} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="st-eyebrow">{routine === 'am' ? 'This morning' : 'Tonight'}</div>
          <div className="st-strong">{title}</div>
        </div>
        <SkinTecIcon name={isNight ? 'night' : 'morning'} size={22} />
      </header>

      <div className="st-player-body">
        {atSummary ? (
          <section className="st-card st-complete-panel">
            <div className="st-complete-mark" style={{ color: allMandatoryDone ? 'var(--st-green-600)' : 'var(--st-peach-600)' }}>
              <SkinTecIcon name={allMandatoryDone ? 'completion' : 'warning'} size={56} strokeWidth={1.5} />
            </div>
            <h3 className="st-card-title st-mt-3">
              {allMandatoryDone ? 'Routine complete' : 'One step still open'}
            </h3>
            <p className="st-soft st-mt-2">
              {allMandatoryDone
                ? `${title} is done for ${routine === 'am' ? 'this morning' : 'tonight'}.`
                : 'Every required step needs to be completed before this routine counts as finished.'}
            </p>

            <ul className="st-steps st-mt-4" style={{ textAlign: 'left' }}>
              {steps.map((s, i) => {
                const isDone = completed.includes(s.id);
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      className="st-day"
                      onClick={() => setIndex(i)}
                      aria-label={`Go to step ${i + 1}, ${s.name}`}
                    >
                      <span
                        className="st-step-index"
                        style={
                          isDone
                            ? { background: 'var(--st-green-100)', color: 'var(--st-green-600)' }
                            : undefined
                        }
                      >
                        {isDone ? <SkinTecIcon name="completion" size={15} /> : i + 1}
                      </span>
                      <span className="st-day-main">
                        <span className="st-day-title">{s.name}</span>
                        <span className="st-day-sub">
                          {s.kind === 'occlusive'
                            ? isDone
                              ? aquaphor === 'face'
                                ? 'Whole face'
                                : 'Spot treatment'
                              : 'Not used tonight'
                            : isDone
                              ? 'Completed'
                              : s.mandatory
                                ? 'Required'
                                : 'Optional'}
                        </span>
                      </span>
                      <SkinTecIcon name="forward" size={18} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : (
          <section className="st-card st-step-card">
            <div className="st-eyebrow">
              Step {index + 1} of {steps.length}
            </div>
            <div className={`st-step-emblem${isNight ? ' is-night' : ''}`} aria-hidden="true">
              <SkinTecIcon name={STEP_ICON[step!.kind] ?? 'products'} size={40} strokeWidth={1.5} />
            </div>
            <h3 className="st-step-name">{step!.name}</h3>
            <p className="st-step-instruction">{step!.instruction}</p>
            {step!.mandatory ? (
              <p className="st-xs st-muted st-mt-3">This step is required for this routine.</p>
            ) : null}
            <div className="st-step-rail" aria-hidden="true">
              {steps.map((s, i) => (
                <span
                  key={s.id}
                  className={completed.includes(s.id) ? 'is-done' : i === index ? 'is-current' : ''}
                />
              ))}
            </div>
          </section>
        )}

        <div className="st-card st-mt-4">
          <ProgressBar value={done} total={steps.length} night={isNight} label={`${title} progress`} />
          <p className="st-xs st-muted st-mt-2">{subtitle}</p>
        </div>
      </div>

      <footer className="st-player-foot">
        <div className="st-player-foot-inner">
          {atSummary ? (
            <>
              <Button
                variant={isNight ? 'night' : 'primary'}
                block
                icon="completion"
                disabled={!allMandatoryDone}
                onClick={() => onSave(completed, true, aquaphor)}
              >
                {allMandatoryDone ? 'Finish routine' : 'Complete required steps first'}
              </Button>
              <Button variant="ghost" block icon="back" onClick={() => setIndex(steps.length - 1)}>
                Back to steps
              </Button>
            </>
          ) : (
            step!.kind === 'occlusive' ? (
              <>
                <div className="st-grid-2">
                  <Button
                    variant={aquaphor === 'spot' ? (isNight ? 'night' : 'primary') : 'secondary'}
                    block
                    icon="occlusive"
                    onClick={() => chooseAquaphor('spot')}
                  >
                    Spots only
                  </Button>
                  <Button
                    variant={aquaphor === 'face' ? (isNight ? 'night' : 'primary') : 'secondary'}
                    block
                    icon="occlusive"
                    onClick={() => chooseAquaphor('face')}
                  >
                    Whole face
                  </Button>
                </div>
                <Button variant="ghost" block iconAfter="forward" onClick={skipAquaphor}>
                  Not tonight
                </Button>
                <div className="st-flex" style={{ justifyContent: 'space-between' }}>
                  <Button
                    variant="ghost"
                    icon="back"
                    small
                    onClick={() => setIndex((i) => Math.max(0, i - 1))}
                    disabled={index === 0}
                  >
                    Back
                  </Button>
                </div>
              </>
            ) : (
            <>
              <Button
                variant={isNight ? 'night' : 'primary'}
                block
                icon="completion"
                onClick={markAndAdvance}
              >
                {completed.includes(step!.id) ? 'Next step' : 'Mark complete'}
              </Button>
              <div className="st-flex" style={{ justifyContent: 'space-between' }}>
                <Button variant="ghost" icon="back" small onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
                  Back
                </Button>
                {completed.includes(step!.id) ? (
                  <Button variant="ghost" small onClick={() => toggle(step!.id, false)}>
                    Undo this step
                  </Button>
                ) : null}
                <Button variant="ghost" iconAfter="forward" small onClick={() => setIndex((i) => Math.min(steps.length, i + 1))}>
                  Skip for now
                </Button>
              </div>
            </>
            )
          )}
        </div>
      </footer>
    </div>
  );
}
