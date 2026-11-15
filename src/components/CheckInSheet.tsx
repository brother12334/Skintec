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

  // Mirrors readIrritation(): what actually steps the plan back.
  const willPause = comfort === 'very_irritated' || (comfort === 'irritated' && Object.values(flags).some(Boolean));

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
              className="choice"
              onClick={() => setComfort(option.value)}
            >
              <span className="box">{selected ? <SkinTecIcon name="completion" size={16} /> : null}</span>
              {option.label}
            </button>
          );
        })}
      </div>

      <h3 className="subtitle st-mt-6" style={{ marginBottom: 8 }}>Anything else today?</h3>
      <div className="st-grid-2">
        {INDICATORS.map((indicator) => {
          const on = flags[indicator.key];
          return (
            <button
              key={indicator.key}
              type="button"
              aria-pressed={on}
              className={`st-btn st-btn-sm ${on ? 'st-btn-primary' : 'st-btn-secondary'}`}
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
          <Notice tone="tip" icon="recovery">
            SkinTec will go back a step for a week. If burning or redness sticks around after BHA, cut back to
            once a week.
          </Notice>
        </div>
      ) : null}

      <div className="st-mt-6">
        <Button
          variant="primary"
          huge
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
