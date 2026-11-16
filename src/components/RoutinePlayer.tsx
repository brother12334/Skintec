import { useMemo, useState } from 'react';
import type { RoutineStep } from '../types';
import { moodClass, type Mood } from '../engine/mood';
import { Button, IconButton } from './ui';

type Props = {
  mood: Mood;
  title: string;
  kicker: string;
  steps: RoutineStep[];
  initialCompleted: string[];
  onSave: (completedSteps: string[], finished: boolean) => void;
  onClose: () => void;
};

/**
 * Mirror mode: one step at a time, huge type, one big button. Built to be
 * read from the sink with wet hands.
 */
export function RoutinePlayer({ mood, title, kicker, steps, initialCompleted, onSave, onClose }: Props) {
  const [completed, setCompleted] = useState<string[]>(
    initialCompleted.filter((id) => steps.some((s) => s.id === id)),
  );
  const [index, setIndex] = useState(() => {
    const first = steps.findIndex((s) => !initialCompleted.includes(s.id));
    return first === -1 ? steps.length : first;
  });

  const required = useMemo(() => steps.filter((s) => s.mandatory), [steps]);
  const missing = required.filter((s) => !completed.includes(s.id));
  const atSummary = index >= steps.length;
  const step = atSummary ? null : steps[index];

  function commit(next: string[]) {
    setCompleted(next);
    onSave(next, false);
  }

  function doneAndNext() {
    if (!step) return;
    commit([...new Set([...completed, step.id])]);
    setIndex((i) => i + 1);
  }

  function skip() {
    if (!step) return;
    if (!step.mandatory) commit(completed.filter((id) => id !== step.id));
    setIndex((i) => i + 1);
  }

  return (
    <div className={`player ${moodClass(mood)}`} role="dialog" aria-modal="true" aria-label={`${title} routine`}>
      <div className="player-inner">
        <div className="player-top">
          <IconButton name="close" label="Close routine" onClick={onClose} />
          <div className="grow">
            <div className="kicker">{kicker}</div>
            <div className="subtitle">{title}</div>
          </div>
        </div>

        <div className="segbar" aria-hidden="true">
          {steps.map((s, i) => (
            <span key={s.id} className={completed.includes(s.id) ? 'is-done' : i === index ? 'is-current' : ''} />
          ))}
        </div>

        {step ? (
          <div className="player-body" key={step.id}>
            <span className="kicker">
              Step {index + 1} of {steps.length}
            </span>
            <span className="player-num" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h2 className="player-name">{step.name}</h2>
            {!step.mandatory ? <span className="player-flag">Optional</span> : null}
            <p className="player-instr">{step.instruction}</p>
            {step.tips?.length ? (
              <ul className="player-tips">
                {step.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <div className="player-body summary">
            <h2 className="big">{missing.length === 0 ? 'All done' : 'Almost'}</h2>
            <p className="player-instr">
              {missing.length === 0
                ? `${title} is finished. Nice.`
                : `Still open: ${missing.map((s) => s.name).join(', ')}. Tap a step to go back to it.`}
            </p>
            <ol className="steps">
              {steps.map((s, i) => (
                <li key={s.id} className={completed.includes(s.id) ? 'is-done' : ''} onClick={() => setIndex(i)}>
                  <span className="n">{i + 1}</span>
                  <span className="t">{s.name}</span>
                  {!completed.includes(s.id) ? <span className="opt">{s.mandatory ? 'Open' : 'Skipped'}</span> : null}
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="player-foot">
          {step ? (
            <>
              <Button variant="primary" huge block onClick={doneAndNext}>
                {index === steps.length - 1 ? 'Done' : 'Done, next'}
              </Button>
              <div className="row">
                <Button variant="ghost" small icon="back" disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}>
                  Back
                </Button>
                <Button variant="ghost" small iconAfter="forward" onClick={skip}>
                  {step.mandatory ? 'Later' : 'Skip it'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button variant="primary" huge block disabled={missing.length > 0} onClick={() => onSave(completed, true)}>
                {missing.length > 0 ? `${missing.length} step${missing.length === 1 ? '' : 's'} left` : 'Finish'}
              </Button>
              <Button variant="ghost" small icon="back" onClick={() => setIndex(steps.length - 1)}>
                Back to steps
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
