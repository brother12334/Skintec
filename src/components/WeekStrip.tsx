import { useMemo } from 'react';
import type { AppState, NightKind } from '../types';
import { planWeekNights } from '../engine/scheduler';
import { WEEKDAY_LABELS, weekdayKey } from '../engine/dates';
import { NIGHT_LABEL } from '../data/defaults';
import { swatchClass } from '../engine/mood';

const SHORT: Record<NightKind, string> = { bha: 'BHA', adapalene: 'Adap', recovery: 'Rest' };

/** Seven colour-coded nights. A dot marks a night that was logged. */
export function WeekStrip({
  state,
  date,
  today,
  onSelect,
}: {
  state: AppState;
  date: string;
  today: string;
  onSelect?: (date: string) => void;
}) {
  const week = useMemo(() => planWeekNights(state, date), [state, date]);
  return (
    <div className="wk" role="list" aria-label="This week's nights">
      {week.days.map(({ date: d, plan }) => {
        const logged = state.completions.some((c) => c.date === d && c.routine === 'pm' && c.completedAt);
        const day = WEEKDAY_LABELS[weekdayKey(d)];
        return (
          <button
            key={d}
            type="button"
            role="listitem"
            className={`wk-day ${swatchClass(plan.kind)}${d === today ? ' is-today' : ''}`}
            onClick={() => onSelect?.(d)}
            aria-label={`${day}, ${NIGHT_LABEL[plan.kind]}${logged ? ', done' : ''}`}
          >
            {day.slice(0, 1)}
            <small>{SHORT[plan.kind]}</small>
            <span className={`wk-dot${logged ? '' : ' is-empty'}`} />
          </button>
        );
      })}
    </div>
  );
}
