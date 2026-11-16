import { useState } from 'react';
import { useStore } from '../store/store';
import { PHASES } from '../data/defaults';
import { isValidISO } from '../engine/dates';
import { moodClass } from '../engine/mood';
import { Button, Field } from '../components/ui';
import { SkinTecIcon } from '../icons/SkinTecIcon';

const MOODS = ['recovery', 'bha', 'adapalene'] as const;

export function Onboarding({ today }: { today: string }) {
  const { state, updateSettings } = useStore();
  const [step, setStep] = useState(0);
  const [start, setStart] = useState(today);
  const [adapalene, setAdapalene] = useState(state.settings.adapaleneReady);

  const last = step === 2;

  return (
    <div className={`onb ${moodClass(MOODS[step])}`} style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
      <div className="onb-inner">
        <span className="kicker">Step {step + 1} of 3</span>

        {step === 0 ? (
          <>
            <h1 className="big">Your new plan</h1>
            <p className="player-instr">
              Dapsone every morning. At night: BHA, adapalene or a recovery night, each on its own weekday. SkinTec tells you which,
              one step at a time.
            </p>
            <div className="st-stack-sm">
              <span className="tag sw-bha">Mon, Fri · BHA</span>
              <span className="tag sw-adapalene">Wed, Sat · Adapalene</span>
              <span className="tag sw-recovery">Tue, Thu, Sun · Recovery</span>
            </div>
            <p className="st-small st-muted">Miss a night? Nothing moves. The next day is just the next day.</p>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <h1 className="big">Adapalene</h1>
            <p className="player-instr">
              You’ll need to buy adapalene (Differin gel). It’s sold over the counter. Check with your dapsone prescriber before adding
              it. You won’t need it until week 3.
            </p>
            <button
              type="button"
              role="checkbox"
              aria-checked={adapalene}
              className="choice"
              onClick={() => setAdapalene((v) => !v)}
            >
              <span className="box">{adapalene ? <SkinTecIcon name="completion" size={16} /> : null}</span>I have it, and my prescriber said yes
            </button>
            <p className="st-small st-muted">You can change this any time in Settings. Until then, adapalene nights are recovery nights.</p>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h1 className="big">Start slowly</h1>
            <div className="phases">
              {PHASES.map((p, i) => (
                <div className={`phase${i === 0 ? ' is-current' : ''}`} key={p.name}>
                  <span className="n">{i + 1}</span>
                  <span>
                    <span className="st-strong">{p.weeks}</span>
                    <span className="st-small st-muted" style={{ display: 'block' }}>
                      {p.summary}
                    </span>
                  </span>
                </div>
              ))}
            </div>
            <Field label="Day 1" htmlFor="onb-start">
              <input id="onb-start" type="date" className="st-input" value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
          </>
        ) : null}

        <div className="onb-foot">
          <Button
            variant="primary"
            huge
            block
            onClick={() => {
              if (!last) return setStep((s) => s + 1);
              updateSettings({
                startDate: isValidISO(start) ? start : today,
                adapaleneReady: adapalene,
                onboarded: true,
              });
            }}
          >
            {last ? 'Start the plan' : 'Next'}
          </Button>
          {step > 0 ? (
            <Button variant="ghost" block icon="back" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
