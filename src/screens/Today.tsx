import { useMemo, useState } from 'react';
import { useStore } from '../store/store';
import { getDailyRoutine } from '../engine/scheduler';
import { phaseOn } from '../engine/progression';
import { MASK_LABEL, PHASES } from '../data/defaults';
import { formatShortDate, WEEKDAY_LABELS, weekdayKey } from '../engine/dates';
import { Button, Notice, useToast } from '../components/ui';
import { RoutinePlayer } from '../components/RoutinePlayer';
import { CheckInSheet } from '../components/CheckInSheet';
import { WeekStrip } from '../components/WeekStrip';

export function TodayScreen({
  today,
  part,
  onPartChange,
}: {
  today: string;
  part: 'am' | 'pm';
  onPartChange: (part: 'am' | 'pm') => void;
}) {
  const { state, setCompletion, addCheckIn } = useStore();
  const toast = useToast();
  const [player, setPlayer] = useState(false);
  const [checkIn, setCheckIn] = useState(false);

  const routine = useMemo(() => getDailyRoutine(state, today), [state, today]);
  const phase = useMemo(() => phaseOn(state, today), [state, today]);
  const data = part === 'am' ? routine.am : routine.pm;
  const completion = state.completions.find((c) => c.date === today && c.routine === part);
  const done = completion?.completedSteps.filter((id) => data.steps.some((s) => s.id === id)) ?? [];
  const finished = Boolean(completion?.completedAt);
  const todayCheckIn = state.checkIns.find((c) => c.date === today);

  const title = part === 'am' ? 'Morning' : routine.pm.kind === 'recovery' ? 'Recovery' : routine.pm.title;
  const pill = part === 'am' ? 'Sunscreen, never skip it' : routine.pm.subtitle;

  function save(steps: string[], isFinished: boolean) {
    setCompletion({
      date: today,
      routine: part,
      routineType: data.type,
      completedSteps: steps,
      completedAt: isFinished ? new Date().toISOString() : undefined,
    });
    if (isFinished) {
      setPlayer(false);
      toast(part === 'am' ? 'Morning done' : 'Night done');
      if (part === 'pm' && !todayCheckIn) setCheckIn(true);
    }
  }

  const mood = part === 'am' ? 'am' : routine.pm.kind;

  return (
    <>
      <section className="hero">
        <span className="kicker">
          {WEEKDAY_LABELS[weekdayKey(today)]} · Week {routine.week} · {part === 'am' ? 'This morning' : 'Tonight'}
        </span>
        <h1 className="big">{title}</h1>
        <span className="pill">{pill}</span>
      </section>

      {routine.notices.map((notice) => (
        <Notice key={notice} icon="info">
          {notice}
        </Notice>
      ))}

      <section>
        <div className="segbar" aria-hidden="true">
          {data.steps.map((s) => (
            <span key={s.id} className={done.includes(s.id) ? 'is-done' : ''} />
          ))}
        </div>
        <ol className="steps st-mt-3">
          {data.steps.map((s, i) => (
            <li key={s.id} className={done.includes(s.id) ? 'is-done' : ''}>
              <span className="n">{i + 1}</span>
              <span className="t">{s.name}</span>
              {!s.mandatory ? <span className="opt">Optional</span> : null}
            </li>
          ))}
        </ol>
      </section>

      <Button variant="primary" huge block onClick={() => setPlayer(true)}>
        {finished ? 'Done. Review' : done.length > 0 ? `Continue, step ${Math.min(done.length + 1, data.steps.length)}` : 'Start'}
      </Button>

      <div className="st-center">
        <button type="button" className="text-link" onClick={() => onPartChange(part === 'am' ? 'pm' : 'am')}>
          {part === 'am' ? `Tonight: ${routine.pm.title.toLowerCase()}` : "This morning's routine"}
        </button>
      </div>

      <section>
        <div className="section-head">
          <h2 className="subtitle">This week</h2>
          <span className="st-xs st-muted">{PHASES[phase.phase].weeks}</span>
        </div>
        <WeekStrip state={state} date={today} today={today} />
        <p className="st-small st-muted st-mt-3">
          {PHASES[phase.phase].name}. {PHASES[phase.phase].summary}
          {phase.nextPhaseDate && !phase.steppedBack ? ` Next step on ${formatShortDate(phase.nextPhaseDate)}.` : ''}
          {routine.pm.mask && part === 'pm' ? ` Tonight's mask: ${MASK_LABEL[routine.pm.mask].toLowerCase()}.` : ''}
        </p>
      </section>

      <section className="st-card st-flex-between">
        <div>
          <h2 className="subtitle">Skin check-in</h2>
          <p className="st-small st-muted">{todayCheckIn ? 'Logged for today.' : 'Irritated skin steps the plan back a week.'}</p>
        </div>
        <Button variant="secondary" small onClick={() => setCheckIn(true)}>
          {todayCheckIn ? 'Update' : 'Log'}
        </Button>
      </section>

      {player ? (
        <RoutinePlayer
          mood={mood}
          title={title}
          kicker={part === 'am' ? 'This morning' : 'Tonight'}
          steps={data.steps}
          initialCompleted={completion?.completedSteps ?? []}
          onSave={save}
          onClose={() => setPlayer(false)}
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
