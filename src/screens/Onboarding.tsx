import { useState } from 'react';
import { useStore } from '../store/store';
import type { MorningMode, TretinoinFrequency } from '../types';
import { FREQUENCY_LABEL } from '../data/defaults';
import { isValidISO } from '../engine/dates';
import { SkinTecIcon, SkinTecMark } from '../icons/SkinTecIcon';
import { Button, Field, Notice } from '../components/ui';
import { MorningChooser } from '../components/MorningChooser';

export function Onboarding({ today }: { today: string }) {
  const { state, updateSettings, updateProgression } = useStore();
  const [step, setStep] = useState(0);
  const [morningMode, setMorningMode] = useState<MorningMode>(state.settings.morningMode);
  const [approved, setApproved] = useState<TretinoinFrequency>(state.progression.approvedMaxFrequency);
  const [restart, setRestart] = useState(today);

  const steps = [
    {
      title: 'Welcome to SkinTec',
      body: (
        <>
          <p className="st-soft">
            SkinTec decides what your skin needs each morning and night, so you never have to work out the
            plan yourself.
          </p>
          <ul className="st-steps st-mt-4" style={{ listStyle: 'none' }}>
            {[
              { icon: 'morning', text: 'A morning routine that stays simple' },
              { icon: 'tretinoin', text: 'A tretinoin schedule that progresses on its own' },
              { icon: 'recovery', text: 'Real recovery nights when your skin needs them' },
              { icon: 'mask', text: 'Masks placed only where they are compatible' },
            ].map((item) => (
              <li key={item.text} className="st-flex" style={{ padding: '6px 0' }}>
                <SkinTecIcon name={item.icon as 'morning'} size={20} />
                <span className="st-small">{item.text}</span>
              </li>
            ))}
          </ul>
        </>
      ),
    },
    {
      title: 'Choose your morning',
      body: (
        <>
          <p className="st-soft">You can switch at any time from Today or Settings.</p>
          <div className="st-mt-4">
            <MorningChooser state={state} value={morningMode} onChange={setMorningMode} />
          </div>
          <div className="st-mt-4">
            <Notice tone="plain" icon="sunscreen">
              Whichever you pick, SkinTec adds nothing else to your morning.
            </Notice>
          </div>
        </>
      ),
    },
    {
      title: 'Your tretinoin plan',
      body: (
        <>
          <Field
            label="Prescriber-approved maximum frequency"
            htmlFor="onb-max"
            hint="SkinTec starts at 2 nights a week and works up to this — never beyond it."
          >
            <select
              id="onb-max"
              className="st-select"
              value={approved}
              onChange={(e) => setApproved(e.target.value as TretinoinFrequency)}
            >
              {(['twice_weekly', 'three_times_weekly', 'every_other_night', 'nightly'] as TretinoinFrequency[]).map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABEL[f]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Restart date" htmlFor="onb-restart" hint="Your schedule is generated from this date.">
            <input
              id="onb-restart"
              type="date"
              className="st-input"
              value={restart}
              onChange={(e) => setRestart(e.target.value)}
            />
          </Field>
          <Notice tone="plain" icon="info">
            SkinTec organises the schedule your dermatologist or prescriber approved. Their instructions
            always take priority, and SkinTec never assesses skin conditions.
          </Notice>
        </>
      ),
    },
  ];

  const current = steps[step];
  const last = step === steps.length - 1;

  return (
    <div className="st-player">
      <div className="st-player-body">
        <div className="st-center st-mt-4">
          <SkinTecMark size={58} />
          <p className="st-eyebrow st-mt-3">SkinTec</p>
        </div>
        <section className="st-card st-mt-4">
          <h1 className="st-card-title">{current.title}</h1>
          <div className="st-mt-3">{current.body}</div>
        </section>
        <div className="st-flex st-mt-4" style={{ justifyContent: 'center', gap: 6 }}>
          {steps.map((s, i) => (
            <span
              key={s.title}
              style={{
                width: i === step ? 22 : 8,
                height: 8,
                borderRadius: 999,
                background: i === step ? 'var(--st-yellow-400)' : 'var(--st-line-strong)',
                transition: 'width var(--st-fast)',
              }}
            />
          ))}
        </div>
      </div>
      <footer className="st-player-foot">
        <div className="st-player-foot-inner">
          <Button
            variant="primary"
            block
            iconAfter={last ? undefined : 'forward'}
            icon={last ? 'start' : undefined}
            onClick={() => {
              if (!last) {
                setStep((s) => s + 1);
                return;
              }
              const safeRestart = isValidISO(restart) ? restart : today;
              updateSettings({ morningMode, restartDate: safeRestart, onboarded: true });
              updateProgression({
                approvedMaxFrequency: approved,
                currentStage: 0,
                stageStartedAt: safeRestart,
                paused: false,
              });
            }}
          >
            {last ? 'Start using SkinTec' : 'Continue'}
          </Button>
          {step > 0 ? (
            <Button variant="ghost" block icon="back" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          ) : (
            <Button variant="ghost" block onClick={() => updateSettings({ onboarded: true })}>
              Skip setup
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
