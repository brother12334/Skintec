import { useMemo } from 'react';
import { useStore } from '../store/store';
import { effectiveProgression, restartWeek, allowedStages } from '../engine/progression';
import { FREQUENCY_SHORT } from '../data/defaults';
import { addDays, formatShortDate } from '../engine/dates';
import { SkinTecIcon } from '../icons/SkinTecIcon';
import { Badge, Notice, ProgressBar } from '../components/ui';

export function ProgressScreen({ today }: { today: string }) {
  const { state } = useStore();
  const progression = useMemo(() => effectiveProgression(state, today), [state, today]);
  const ladder = useMemo(() => allowedStages(state), [state]);

  const finished = state.completions.filter((c) => c.completedAt);
  const amCount = finished.filter((c) => c.routine === 'am').length;
  const pmCount = finished.filter((c) => c.routine === 'pm').length;
  const tretinoinNights = finished.filter((c) => c.routineType === 'pm_tretinoin').length;
  const recoveryNights = finished.filter((c) => c.routineType === 'pm_recovery').length;
  const dermaStampNights = finished.filter((c) => c.routineType === 'pm_derma_stamp').length;
  const maskNights = finished.filter(
    (c) => c.routine === 'pm' && c.completedSteps.some((id) => id.startsWith('pm-rec-mask-')),
  ).length;

  const streak = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 400; i++) {
      const date = addDays(today, -i);
      const any = finished.some((c) => c.date === date);
      if (any) count += 1;
      else if (i > 0 || date !== today) break;
    }
    return count;
  }, [finished, today]);

  const stats = [
    { label: 'Mornings completed', value: amCount },
    { label: 'Nights completed', value: pmCount },
    { label: 'Tretinoin nights', value: tretinoinNights },
    { label: 'Recovery nights', value: recoveryNights },
    { label: 'Mask nights', value: maskNights },
    { label: 'Derma stamp nights', value: dermaStampNights },
    { label: 'Day streak', value: streak },
  ];

  return (
    <>
      <header className="st-mt-4">
        <p className="st-eyebrow">Progress</p>
        <h1 className="st-screen-title">Consistency</h1>
        <p className="st-screen-sub">How steadily you are following your routine — nothing else.</p>
      </header>

      <section className="st-card st-mt-4">
        <div className="st-flex-between">
          <div>
            <p className="st-eyebrow">Tretinoin restart</p>
            <h2 className="st-card-title">Week {restartWeek(state, today)}</h2>
            <p className="st-card-meta">Started {formatShortDate(state.settings.restartDate)}</p>
          </div>
          <Badge tone={progression.paused ? 'neutral' : 'treat'} icon={progression.paused ? 'pause' : 'tretinoin'}>
            {progression.paused ? 'Paused' : `Stage ${progression.stageIndex + 1} of ${progression.stageCount}`}
          </Badge>
        </div>

        <div className="st-mt-4">
          <ProgressBar
            value={progression.stageIndex + 1}
            total={Math.max(1, progression.stageCount)}
            label="Progression stages"
          />
        </div>

        <div className="st-timeline">
          {ladder.map((stage, i) => {
            const done = i < progression.stageIndex;
            const current = i === progression.stageIndex;
            return (
              <div key={stage.id} className={`st-timeline-row${done ? ' is-done' : current ? ' is-current' : ''}`}>
                <span className="st-timeline-dot">
                  {done ? <SkinTecIcon name="completion" size={16} title="Completed stage" /> : i + 1}
                </span>
                <span>
                  <span className="st-timeline-label">{FREQUENCY_SHORT[stage.frequency]}</span>
                  <span className="st-timeline-note" style={{ display: 'block' }}>
                    {current
                      ? progression.paused
                        ? 'Current stage — progression paused'
                        : progression.nextStageDate
                          ? `Current stage — next increase ${formatShortDate(progression.nextStageDate)}`
                          : 'Current stage'
                      : done
                        ? 'Completed'
                        : stage.durationWeeks
                          ? `${stage.durationWeeks} weeks`
                          : 'Ongoing'}
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        {progression.paused && progression.pauseReason ? (
          <div className="st-mt-4">
            <Notice tone="calm" icon="recovery">
              {progression.pauseReason} SkinTec is holding your current frequency. Follow your dermatologist
              or prescriber's instructions if they differ.
            </Notice>
          </div>
        ) : null}
      </section>

      <h2 className="st-section-title st-mt-6">Routine adherence</h2>
      <div className="st-grid-2">
        {stats.map((stat) => (
          <div className="st-stat" key={stat.label}>
            <div className="st-stat-value">{stat.value}</div>
            <div className="st-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <h2 className="st-section-title st-mt-6">Recent check-ins</h2>
      {state.checkIns.length === 0 ? (
        <div className="st-empty">No check-ins recorded yet.</div>
      ) : (
        <div className="st-stack-sm">
          {[...state.checkIns]
            .sort((a, b) => (a.date < b.date ? 1 : -1))
            .slice(0, 7)
            .map((entry) => {
              const flags = [
                entry.dryness ? 'dryness' : null,
                entry.stinging ? 'stinging' : null,
                entry.redness ? 'redness' : null,
                entry.peeling ? 'peeling' : null,
              ].filter(Boolean);
              return (
                <div className="st-day" key={entry.date} style={{ cursor: 'default' }}>
                  <span className="st-day-date">
                    <span className="st-day-dow">{formatShortDate(entry.date)}</span>
                  </span>
                  <span className="st-day-main">
                    <span className="st-day-title">
                      {entry.comfort.replace(/_/g, ' ').replace(/^./, (ch) => ch.toUpperCase())}
                    </span>
                    <span className="st-day-sub">{flags.length ? flags.join(', ') : 'No extra indicators'}</span>
                  </span>
                  <SkinTecIcon name="checkin" size={19} />
                </div>
              );
            })}
        </div>
      )}

      <p className="st-xs st-muted st-mt-6 st-center">
        SkinTec tracks routine consistency only. It never scores appearance.
      </p>
    </>
  );
}
