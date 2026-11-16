import { useMemo, useState } from 'react';
import { useStore } from '../store/store';
import { getDailyRoutine, planWeekNights } from '../engine/scheduler';
import { phaseOn } from '../engine/progression';
import { addDays, formatLongDate, formatShortDate, fromISO, startOfWeek, WEEKDAY_LABELS, weekdayKey } from '../engine/dates';
import { MASK_LABEL, NIGHT_LABEL, PHASES } from '../data/defaults';
import { swatchClass } from '../engine/mood';
import { IconButton, Modal, Notice, Button } from '../components/ui';

export function WeekScreen({ today }: { today: string }) {
  const { state } = useStore();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [selected, setSelected] = useState<string | null>(null);

  const week = useMemo(() => planWeekNights(state, weekStart), [state, weekStart]);
  const phase = useMemo(() => phaseOn(state, weekStart), [state, weekStart]);
  const detail = useMemo(() => (selected ? getDailyRoutine(state, selected) : null), [state, selected]);

  return (
    <>
      <section className="hero">
        <span className="kicker">
          Week {phase.week} · {PHASES[phase.phase].weeks}
        </span>
        <h1 className="big">{PHASES[phase.phase].name}</h1>
        <span className="pill">
          {formatShortDate(week.weekStart)} – {formatShortDate(addDays(week.weekStart, 6))}
        </span>
      </section>

      <div className="st-flex-between">
        <IconButton name="back" label="Previous week" onClick={() => setWeekStart((w) => addDays(w, -7))} />
        <Button variant="ghost" small onClick={() => setWeekStart(startOfWeek(today))}>
          This week
        </Button>
        <IconButton name="forward" label="Next week" onClick={() => setWeekStart((w) => addDays(w, 7))} />
      </div>

      <div>
        {week.days.map(({ date, plan }) => {
          const logged = state.completions.some((c) => c.date === date && c.routine === 'pm' && c.completedAt);
          const day = WEEKDAY_LABELS[weekdayKey(date)];
          const sub =
            plan.kind === 'recovery'
              ? plan.mask
                ? `${MASK_LABEL[plan.mask]}, Vaseline all over`
                : 'Vaseline all over'
              : 'Vaseline on dry spots only';
          return (
            <button
              key={date}
              type="button"
              className={`day-row${date === today ? ' is-today' : ''}`}
              onClick={() => setSelected(date)}
            >
              <span className={`day-chip ${swatchClass(plan.kind)}`}>
                <span>{day.slice(0, 3).toUpperCase()}</span>
                <b>{fromISO(date).getDate()}</b>
              </span>
              <span className="day-main">
                <span className="day-title">{NIGHT_LABEL[plan.kind]}</span>
                <span className="day-sub">{sub}</span>
              </span>
              <span className="day-state">{logged ? 'Done' : date === today ? 'Tonight' : ''}</span>
            </button>
          );
        })}
      </div>

      <p className="st-small st-muted">
        Each night follows its weekday. If you miss one, nothing moves: the next day is just the next day.
      </p>

      {detail ? (
        <Modal title={formatLongDate(detail.date)} onClose={() => setSelected(null)}>
          <div className="st-stack">
            <span className={`tag ${swatchClass(detail.pm.kind)}`} style={{ alignSelf: 'flex-start' }}>
              {detail.pm.title}
            </span>
            {detail.notices.map((n) => (
              <Notice key={n}>{n}</Notice>
            ))}
            <h3 className="subtitle">Morning</h3>
            <ol className="steps">
              {detail.am.steps.map((s, i) => (
                <li key={s.id}>
                  <span className="n">{i + 1}</span>
                  <span className="t">{s.name}</span>
                </li>
              ))}
            </ol>
            <h3 className="subtitle">Night</h3>
            <ol className="steps">
              {detail.pm.steps.map((s, i) => (
                <li key={s.id}>
                  <span className="n">{i + 1}</span>
                  <span className="t">
                    {s.name}
                    <small>{s.instruction}</small>
                  </span>
                  {!s.mandatory ? <span className="opt">Optional</span> : null}
                </li>
              ))}
            </ol>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
