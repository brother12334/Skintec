import { useMemo, useState } from 'react';
import { useStore } from '../store/store';
import { getDailyRoutine, planWeek } from '../engine/scheduler';
import { addDays, formatLongDate, formatShortDate, fromISO, startOfWeek, WEEKDAY_LABELS, weekdayKey } from '../engine/dates';
import { SkinTecIcon } from '../icons/SkinTecIcon';
import { Badge, Button, IconButton, Modal, Notice } from '../components/ui';

export function ScheduleScreen({ today }: { today: string }) {
  const { state } = useStore();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [selected, setSelected] = useState<string | null>(null);

  const week = useMemo(() => planWeek(state, weekStart), [state, weekStart]);
  const detail = useMemo(() => (selected ? getDailyRoutine(state, selected) : null), [state, selected]);

  const weekEnd = addDays(week.weekStart, 6);

  return (
    <>
      <header className="st-mt-4">
        <p className="st-eyebrow">Schedule</p>
        <h1 className="st-screen-title">Your week</h1>
        <p className="st-screen-sub">
          {formatShortDate(week.weekStart)} – {formatShortDate(weekEnd)}
        </p>
      </header>

      <div className="st-flex-between st-mt-4">
        <IconButton name="back" label="Previous week" onClick={() => setWeekStart((w) => addDays(w, -7))} />
        <Button variant="ghost" small icon="today" onClick={() => setWeekStart(startOfWeek(today))}>
          This week
        </Button>
        <IconButton name="forward" label="Next week" onClick={() => setWeekStart((w) => addDays(w, 7))} />
      </div>

      <div className="st-week st-mt-4">
        {week.days.map((day) => {
          const isTretinoin = day.plan.kind === 'tretinoin';
          const mask = day.plan.maskId ? state.masks.find((m) => m.id === day.plan.maskId) : undefined;
          const completion = state.completions.find((c) => c.date === day.date && c.routine === 'pm' && c.completedAt);
          const past = day.date < today;
          return (
            <button
              key={day.date}
              type="button"
              className={`st-day${day.date === today ? ' is-today' : ''}`}
              onClick={() => setSelected(day.date)}
              aria-label={`${WEEKDAY_LABELS[weekdayKey(day.date)]} ${formatShortDate(day.date)}, ${
                isTretinoin ? 'tretinoin night' : 'recovery night'
              }${mask ? `, ${mask.name}` : ''}`}
            >
              <span className="st-day-date">
                <span className="st-day-dow">{WEEKDAY_LABELS[weekdayKey(day.date)].slice(0, 3)}</span>
                <span className="st-day-num">{fromISO(day.date).getDate()}</span>
              </span>
              <span className="st-day-main">
                <span className="st-day-title">{isTretinoin ? 'Tretinoin night' : 'Recovery night'}</span>
                <span className="st-day-sub">
                  {mask ? mask.name : isTretinoin ? 'Moisturizer sandwich' : 'Cleanse and repair'}
                  {completion ? ' · completed' : past && !completion ? ' · not recorded' : ''}
                </span>
              </span>
              <span className="st-day-marks">
                <SkinTecIcon
                  name={isTretinoin ? 'tretinoin' : 'recovery'}
                  size={19}
                  title={isTretinoin ? 'Tretinoin' : 'Recovery'}
                />
                {mask ? <SkinTecIcon name="mask" size={19} title={`Mask: ${mask.name}`} /> : null}
                {completion ? <SkinTecIcon name="completion" size={19} title="Completed" /> : null}
              </span>
            </button>
          );
        })}
      </div>

      <div className="st-mt-4">
        <Notice tone="plain" icon="compatibility">
          Masks move automatically when they land on a treatment night, and two intensive treatments are
          never scheduled together.
        </Notice>
      </div>

      {detail ? (
        <Modal title={formatLongDate(detail.date)} onClose={() => setSelected(null)}>
          <div className="st-chip-row">
            <Badge tone={detail.pm.type === 'pm_tretinoin' ? 'treat' : 'recovery'} icon={detail.pm.type === 'pm_tretinoin' ? 'tretinoin' : 'recovery'}>
              {detail.pm.title}
            </Badge>
            {detail.pm.maskName ? (
              <Badge tone="neutral" icon="mask">
                {detail.pm.maskName}
              </Badge>
            ) : null}
          </div>

          <h3 className="st-section-title st-mt-6">
            <span className="st-flex">
              <SkinTecIcon name="morning" size={19} /> Morning — {detail.am.title}
            </span>
          </h3>
          <ol className="st-steps" style={{ listStyle: 'none' }}>
            {detail.am.steps.map((step, i) => (
              <li key={step.id} className="st-step-preview">
                <span className="st-step-index">{i + 1}</span>
                <span style={{ color: 'var(--st-ink)' }}>{step.name}</span>
              </li>
            ))}
          </ol>

          <h3 className="st-section-title st-mt-6">
            <span className="st-flex">
              <SkinTecIcon name="night" size={19} /> Night — {detail.pm.title}
            </span>
          </h3>
          <ol className="st-steps" style={{ listStyle: 'none' }}>
            {detail.pm.steps.map((step, i) => (
              <li key={step.id} className="st-step-preview">
                <span className="st-step-index">{i + 1}</span>
                <span style={{ color: 'var(--st-ink)' }}>{step.name}</span>
              </li>
            ))}
          </ol>

          {detail.notices.length > 0 ? (
            <div className="st-mt-4">
              {detail.notices.map((notice, i) => (
                <Notice key={i} tone="plain">
                  {notice}
                </Notice>
              ))}
            </div>
          ) : null}
        </Modal>
      ) : null}
    </>
  );
}
