import { useMemo } from 'react';
import { useStore } from '../store/store';
import { phaseOn } from '../engine/progression';
import { PHASES } from '../data/defaults';
import { addDays, formatShortDate } from '../engine/dates';
import { Notice } from '../components/ui';

const COMFORT_LABEL: Record<string, string> = {
  comfortable: 'Comfortable',
  a_little_dry: 'A little dry',
  irritated: 'Irritated',
  very_irritated: 'Very irritated',
};

export function ProgressScreen({ today }: { today: string }) {
  const { state } = useStore();
  const phase = useMemo(() => phaseOn(state, today), [state, today]);

  const finished = state.completions.filter((c) => c.completedAt);
  const count = (fn: (c: (typeof finished)[number]) => boolean) => finished.filter(fn).length;

  // A streak counts days with anything logged. Today not logged yet doesn't break it.
  const streak = useMemo(() => {
    let n = 0;
    for (let i = 0; i < 400; i++) {
      const date = addDays(today, -i);
      if (finished.some((c) => c.date === date)) n += 1;
      else if (i > 0) break;
    }
    return n;
  }, [finished, today]);

  const stats = [
    { label: 'Day streak', value: streak },
    { label: 'Mornings', value: count((c) => c.routine === 'am') },
    { label: 'BHA nights', value: count((c) => c.routineType === 'pm_bha') },
    { label: 'Adapalene nights', value: count((c) => c.routineType === 'pm_adapalene') },
    { label: 'Recovery nights', value: count((c) => c.routineType === 'pm_recovery') },
    { label: 'Mask nights', value: count((c) => c.completedSteps.some((id) => id.startsWith('pm-mask-'))) },
  ];

  return (
    <>
      <section className="hero">
        <span className="kicker">Started {formatShortDate(state.settings.startDate)}</span>
        <h1 className="big">Week {phase.week}</h1>
        <span className="pill">{PHASES[phase.phase].name}</span>
      </section>

      {phase.steppedBack && phase.stepBackReason ? (
        <Notice icon="info">{phase.stepBackReason} You’re one step gentler for now.</Notice>
      ) : null}

      <section className="phases" aria-label="Plan phases">
        {PHASES.map((p, i) => (
          <div key={p.name} className={`phase${i === phase.phase ? ' is-current' : i < phase.phase ? ' is-done' : ''}`}>
            <span className="n">{i + 1}</span>
            <span>
              <span className="st-strong">
                {p.name} · {p.weeks}
              </span>
              <span className="st-small st-muted" style={{ display: 'block' }}>
                {p.summary}
              </span>
            </span>
          </div>
        ))}
      </section>

      <section>
        <h2 className="subtitle" style={{ marginBottom: 8 }}>
          Logged
        </h2>
        <div className="st-grid-2">
          {stats.map((s) => (
            <div className="stat" key={s.label}>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="subtitle" style={{ marginBottom: 8 }}>
          Check-ins
        </h2>
        {state.checkIns.length === 0 ? (
          <p className="st-small st-muted">Nothing logged yet. You can log how your skin feels from Today.</p>
        ) : (
          <div>
            {[...state.checkIns]
              .sort((a, b) => (a.date < b.date ? 1 : -1))
              .slice(0, 7)
              .map((c) => {
                const flags = [c.dryness && 'dryness', c.stinging && 'stinging', c.redness && 'redness', c.peeling && 'peeling'].filter(Boolean);
                return (
                  <div className="st-row" key={c.date}>
                    <div className="st-row-main">
                      <div className="st-row-title">{COMFORT_LABEL[c.comfort] ?? c.comfort}</div>
                      <div className="st-row-sub">{flags.length ? flags.join(', ') : 'Nothing else'}</div>
                    </div>
                    <span className="st-xs st-muted">{formatShortDate(c.date)}</span>
                  </div>
                );
              })}
          </div>
        )}
      </section>
    </>
  );
}
