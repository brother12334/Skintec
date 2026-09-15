import { useState } from 'react';
import type { SkinCheckIn, SkinComfort } from '../types';
import { SkinTecIcon } from '../icons/SkinTecIcon';
import { Button, Modal, Notice } from './ui';

const COMFORT: { value: SkinComfort; label: string }[] = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'a_little_dry', label: 'A little dry' },
  { value: 'irritated', label: 'Irritated' },
  { value: 'very_irritated', label: 'Very irritated' },
];

const INDICATORS = [
  { key: 'dryness', label: 'Dryness' },
  { key: 'stinging', label: 'Stinging' },
  { key: 'redness', label: 'Redness' },
  { key: 'peeling', label: 'Peeling' },
] as const;

export function CheckInSheet({
  date,
  existing,
  onSave,
  onClose,
}: {
  date: string;
  existing?: SkinCheckIn;
  onSave: (checkIn: SkinCheckIn) => void;
  onClose: () => void;
}) {
  const [comfort, setComfort] = useState<SkinComfort>(existing?.comfort ?? 'comfortable');
  const [flags, setFlags] = useState({
    dryness: existing?.dryness ?? false,
    stinging: existing?.stinging ?? false,
    redness: existing?.redness ?? false,
    peeling: existing?.peeling ?? false,
  });

  const willPause = comfort === 'very_irritated' || comfort === 'irritated';

  return (
    <Modal title="How does your skin feel?" onClose={onClose}>
      <div className="st-stack-sm" role="radiogroup" aria-label="Skin comfort">
        {COMFORT.map((option) => {
          const selected = comfort === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className="st-day"
              style={selected ? { borderColor: 'var(--st-yellow-400)', boxShadow: '0 0 0 3px var(--st-yellow-100)' } : undefined}
              onClick={() => setComfort(option.value)}
            >
              <span className="st-day-main">
                <span className="st-day-title">{option.label}</span>
              </span>
              {selected ? <SkinTecIcon name="completion" size={20} title="Selected" /> : null}
            </button>
          );
        })}
      </div>

      <h3 className="st-section-title st-mt-6">Anything else today?</h3>
      <div className="st-chip-row">
        {INDICATORS.map((indicator) => {
          const on = flags[indicator.key];
          return (
            <button
              key={indicator.key}
              type="button"
              aria-pressed={on}
              className="st-btn st-btn-sm"
              style={
                on
                  ? { background: 'var(--st-peach-100)', borderColor: 'var(--st-peach-300)', color: 'var(--st-peach-600)' }
                  : { background: 'var(--st-surface)', borderColor: 'var(--st-line-strong)' }
              }
              onClick={() => setFlags((prev) => ({ ...prev, [indicator.key]: !prev[indicator.key] }))}
            >
              {on ? <SkinTecIcon name="completion" size={15} /> : null}
              {indicator.label}
            </button>
          );
        })}
      </div>

      {willPause ? (
        <div className="st-mt-4">
          <Notice tone="calm" icon="recovery">
            SkinTec will favour recovery and hold your current frequency. Follow your dermatologist or
            prescriber's instructions if they differ.
          </Notice>
        </div>
      ) : null}

      <div className="st-mt-6">
        <Button
          variant="primary"
          block
          icon="checkin"
          onClick={() => onSave({ date, comfort, ...flags })}
        >
          Save check-in
        </Button>
      </div>
      <p className="st-xs st-muted st-mt-3 st-center">
        Check-ins adjust your schedule only. SkinTec does not assess or diagnose skin conditions.
      </p>
    </Modal>
  );
}
