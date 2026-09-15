import { useMemo, useState } from 'react';
import { useStore } from '../store/store';
import { getDailyRoutine } from '../engine/scheduler';
import { effectiveProgression, restartWeek } from '../engine/progression';
import { FREQUENCY_LABEL, FREQUENCY_SHORT } from '../data/defaults';
import { formatLongDate, formatShortDate } from '../engine/dates';
import { SkinTecIcon } from '../icons/SkinTecIcon';
import { Badge, Button, Notice, ProgressRing, Segmented, useToast } from '../components/ui';
import { RoutinePlayer } from '../components/RoutinePlayer';
import { CheckInSheet } from '../components/CheckInSheet';
import type { MorningMode } from '../types';

function greeting(hour: number): string {
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function TodayScreen({ today, hour }: { today: string; hour: number }) {
  const { state, updateSettings, setCompletion, addCheckIn } = useStore();
  const toast = useToast();
  const [focus, setFocus] = useState<'am' | 'pm'>(hour >= 5 && hour < 17 ? 'am' : 'pm');
  const [player, setPlayer] = useState<'am' | 'pm' | null>(null);
  const [checkIn, setCheckIn] = useState(false);

  const routine = useMemo(() => getDailyRoutine(state, today), [state, today]);
  const progression = useMemo(() => effectiveProgression(state, today), [state, today]);

  const amDone = state.completions.find((c) => c.date === today && c.routine === 'am');
  const pmDone = state.completions.find((c) => c.date === today && c.routine === 'pm');
  const todayCheckIn = state.checkIns.find((c) => c.date === today);

  const cards = focus === 'am' ? (['am', 'pm'] as const) : (['pm', 'am'] as const);

  function save(routineKind: 'am' | 'pm', steps: string[], finished: boolean) {
    const target = routineKind === 'am' ? routine.am : routine.pm;
    setCompletion({
      date: today,
      routine: routineKind,
      routineType: target.type,
      completedSteps: steps,
      completedAt: finished ? new Date().toISOString() : undefined,
    });
    if (finished) {
      setPlayer(null);
      toast(routineKind === 'am' ? 'Morning routine complete' : 'Night routine complete');
      if (routineKind === 'pm' && !todayCheckIn) setCheckIn(true);
    }
  }

  return (
    <>
      <header className="st-mt-4">
        <p className="st-eyebrow">{formatLongDate(today)}</p>
        <h1 className="st-screen-title">{greeting(hour)}</h1>
        <p className="st-screen-sub">
          {routine.pm.type === 'pm_tretinoin'
            ? 'Tonight is a tretinoin night.'
            : routine.pm.maskName
              ? `Tonight is a recovery night with ${routine.pm.maskName}.`
              : 'Tonight is a recovery night.'}
        </p>
      </header>

      <div className="st-mt-4">
        <Segmented
          label="Show morning or night first"
          value={focus}
          onChange={setFocus}
          options={[
            { value: 'am', label: 'Morning', icon: 'morning' },
            { value: 'pm', label: 'Night', icon: 'night' },
          ]}
        />
      </div>

      {routine.notices.length > 0 ? (
        <div className="st-mt-4">
          {routine.notices.map((notice, i) => (
            <Notice
              key={i}
              tone={routine.progressionPaused && i === 0 ? 'calm' : 'plain'}
              icon={routine.progressionPaused && i === 0 ? 'recovery' : 'info'}
            >
              {notice}
            </Notice>
          ))}
        </div>
      ) : null}

      <div className="st-mt-4">
        {cards.map((kind) => {
          const data = kind === 'am' ? routine.am : routine.pm;
          const completion = kind === 'am' ? amDone : pmDone;
          const doneCount = completion?.completedSteps.filter((id) => data.steps.some((s) => s.id === id)).length ?? 0;
          const finished = Boolean(completion?.completedAt);
          const isNight = kind === 'pm';

          return (
            <section key={kind} className={`st-card ${isNight ? 'st-card-pm' : 'st-card-am'}`}>
              <div className="st-card-head">
                <div>
                  <div className="st-chip-row">
                    <Badge tone={isNight ? 'night' : 'sun'} icon={isNight ? 'night' : 'morning'}>
                      {isNight ? 'Tonight' : 'This morning'}
                    </Badge>
                    {isNight ? (
                      <Badge
                        tone={routine.pm.type === 'pm_tretinoin' ? 'treat' : 'recovery'}
                        icon={routine.pm.type === 'pm_tretinoin' ? 'tretinoin' : 'recovery'}
                      >
                        {routine.pm.type === 'pm_tretinoin' ? 'Tretinoin night' : 'Recovery night'}
                      </Badge>
                    ) : (
                      <Badge tone="neutral" icon="sunscreen">
                        {state.settings.morningMode === 'skin_aqua' ? 'Skin Aqua' : 'Standard'}
                      </Badge>
                    )}
                    {isNight && routine.pm.maskName ? (
                      <Badge tone="neutral" icon="mask">
                        {routine.pm.maskName}
                      </Badge>
                    ) : null}
                  </div>
                  <h2 className="st-card-title st-mt-3">{data.title}</h2>
                  <p className="st-card-meta">
                    {data.steps.length} {data.steps.length === 1 ? 'step' : 'steps'}
                    {finished ? ' · complete' : doneCount > 0 ? ` · ${doneCount} done` : ''}
                  </p>
                </div>
                <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
                  <ProgressRing value={doneCount} total={data.steps.length} night={isNight} />
                  <span style={{ position: 'absolute', fontSize: '0.75rem', fontWeight: 700 }}>
                    {doneCount}/{data.steps.length}
                  </span>
                </div>
              </div>

              <ul className="st-steps">
                {data.steps.map((step, i) => {
                  const stepDone = completion?.completedSteps.includes(step.id);
                  return (
                    <li key={step.id} className="st-step-preview">
                      <span
                        className="st-step-index"
                        style={stepDone ? { background: 'var(--st-green-100)', color: 'var(--st-green-600)' } : undefined}
                      >
                        {stepDone ? <SkinTecIcon name="completion" size={15} /> : i + 1}
                      </span>
                      <span style={{ color: 'var(--st-ink)' }}>{step.name}</span>
                    </li>
                  );
                })}
              </ul>

              <div className="st-mt-4">
                <Button
                  variant={isNight ? 'night' : 'primary'}
                  block
                  icon={finished ? 'completion' : 'start'}
                  onClick={() => setPlayer(kind)}
                >
                  {finished ? 'Review routine' : doneCount > 0 ? 'Continue routine' : 'Start routine'}
                </Button>
              </div>

              {!isNight ? (
                <div className="st-mt-4">
                  <p className="st-xs st-muted" style={{ marginBottom: 6 }}>
                    Morning routine
                  </p>
                  <Segmented<MorningMode>
                    label="Morning routine mode"
                    value={state.settings.morningMode}
                    onChange={(mode) => {
                      updateSettings({ morningMode: mode });
                      toast(mode === 'skin_aqua' ? 'Skin Aqua mornings on' : 'Standard mornings on', 'morning');
                    }}
                    options={[
                      { value: 'standard', label: 'Standard' },
                      { value: 'skin_aqua', label: 'Skin Aqua' },
                    ]}
                  />
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      <section className="st-card st-mt-4">
        <div className="st-flex-between">
          <div>
            <p className="st-eyebrow">Tretinoin restart</p>
            <h2 className="st-card-title">Week {restartWeek(state, today)}</h2>
          </div>
          <Badge tone={progression.paused ? 'neutral' : 'treat'} icon={progression.paused ? 'pause' : 'tretinoin'}>
            {progression.paused ? 'Paused' : `Stage ${progression.stageIndex + 1} of ${progression.stageCount}`}
          </Badge>
        </div>

        <div className="st-grid-2 st-mt-4">
          <div className="st-stat">
            <div className="st-stat-value" style={{ fontSize: '1.1rem' }}>
              {progression.frequency ? FREQUENCY_LABEL[progression.frequency] : 'Not scheduled'}
            </div>
            <div className="st-stat-label">Current frequency</div>
          </div>
          <div className="st-stat">
            <div className="st-stat-value" style={{ fontSize: '1.1rem' }}>
              {progression.paused
                ? 'On hold'
                : progression.nextStage
                  ? FREQUENCY_SHORT[progression.nextStage.frequency]
                  : 'At approved target'}
            </div>
            <div className="st-stat-label">
              {progression.nextStageDate && !progression.paused
                ? `Next increase ${formatShortDate(progression.nextStageDate)}`
                : 'Next frequency increase'}
            </div>
          </div>
        </div>
      </section>

      <section className="st-card st-mt-4">
        <div className="st-flex-between">
          <div>
            <p className="st-eyebrow">Skin check-in</p>
            <h2 className="st-card-title" style={{ fontSize: '1.05rem' }}>
              {todayCheckIn ? 'Recorded for today' : 'How does your skin feel?'}
            </h2>
          </div>
          <SkinTecIcon name="checkin" size={26} />
        </div>
        <div className="st-mt-4">
          <Button variant="secondary" block icon="checkin" onClick={() => setCheckIn(true)}>
            {todayCheckIn ? 'Update check-in' : 'Record check-in'}
          </Button>
        </div>
      </section>

      <p className="st-xs st-muted st-mt-4 st-center">
        SkinTec organises your routine. Your dermatologist or prescriber's instructions always take priority.
      </p>

      {player ? (
        <RoutinePlayer
          title={player === 'am' ? routine.am.title : routine.pm.title}
          subtitle={player === 'am' ? routine.am.subtitle : routine.pm.subtitle}
          steps={player === 'am' ? routine.am.steps : routine.pm.steps}
          routine={player}
          routineType={player === 'am' ? routine.am.type : routine.pm.type}
          initialCompleted={(player === 'am' ? amDone : pmDone)?.completedSteps ?? []}
          onSave={(steps, finished) => save(player, steps, finished)}
          onClose={() => setPlayer(null)}
        />
      ) : null}

      {checkIn ? (
        <CheckInSheet
          date={today}
          existing={todayCheckIn}
          onClose={() => setCheckIn(false)}
          onSave={(entry) => {
            addCheckIn(entry);
            setCheckIn(false);
            toast('Check-in saved', 'checkin');
          }}
        />
      ) : null}
    </>
  );
}
