import { useState } from 'react';
import { useStore } from '../store/store';
import type { MorningMode, TretinoinFrequency } from '../types';
import { FREQUENCY_LABEL, FREQUENCY_SHORT } from '../data/defaults';
import { WEEKDAY_KEYS, WEEKDAY_LABELS, isValidISO } from '../engine/dates';
import { effectiveProgression } from '../engine/progression';
import { SkinTecIcon } from '../icons/SkinTecIcon';
import { Badge, Button, Field, Modal, Notice, Segmented, SettingRow, Switch, useToast } from '../components/ui';

const FREQUENCIES: TretinoinFrequency[] = [
  'twice_weekly',
  'three_times_weekly',
  'every_other_night',
  'nightly',
];

export function SettingsScreen({ today }: { today: string }) {
  const { state, updateSettings, updateProgression, updateMask, upsertTreatment, resetAll } = useStore();
  const toast = useToast();
  const [confirmReset, setConfirmReset] = useState(false);
  const progression = effectiveProgression(state, today);
  const tretinoinTreatment = state.treatments.find((t) => t.id === 'treatment-tretinoin');

  return (
    <>
      <header className="st-mt-4">
        <p className="st-eyebrow">Settings</p>
        <h1 className="st-screen-title">SkinTec</h1>
        <p className="st-screen-sub">Your routine, treatment schedule and reminders.</p>
      </header>

      {/* ---------------- Morning ---------------- */}
      <section className="st-card st-mt-4">
        <div className="st-flex-between">
          <h2 className="st-section-title" style={{ margin: 0 }}>
            Morning
          </h2>
          <SkinTecIcon name="morning" size={22} />
        </div>
        <p className="st-xs st-muted st-mt-2">
          Standard is LRP Triple Repair then sunscreen. Skin Aqua is the UV serum on its own.
        </p>
        <div className="st-mt-3">
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
      </section>

      {/* ---------------- Tretinoin ---------------- */}
      <section className="st-card st-mt-4">
        <div className="st-flex-between">
          <h2 className="st-section-title" style={{ margin: 0 }}>
            Tretinoin
          </h2>
          <SkinTecIcon name="tretinoin" size={22} />
        </div>

        <SettingRow title="Tretinoin active" sub="Turn off to schedule recovery nights only.">
          <Switch
            checked={state.settings.tretinoinActive}
            label="Tretinoin active"
            onChange={(next) => updateSettings({ tretinoinActive: next })}
          />
        </SettingRow>

        <div className="st-mt-4">
          <Field label="Concentration" htmlFor="tret-strength" hint="For your reference only — SkinTec never changes a prescription.">
            <input
              id="tret-strength"
              className="st-input"
              value={state.settings.tretinoinConcentration}
              onChange={(e) => {
                updateSettings({ tretinoinConcentration: e.target.value });
                if (tretinoinTreatment) upsertTreatment({ ...tretinoinTreatment, concentration: e.target.value });
              }}
              placeholder="e.g. 0.025%"
            />
          </Field>

          <Field label="Restart date" htmlFor="tret-restart" hint="The schedule pattern is generated from this date.">
            <input
              id="tret-restart"
              type="date"
              className="st-input"
              value={state.settings.restartDate}
              onChange={(e) => {
                if (!isValidISO(e.target.value)) return;
                updateSettings({ restartDate: e.target.value });
                updateProgression({ stageStartedAt: e.target.value, currentStage: 0 });
                toast('Restart date updated', 'calendar');
              }}
            />
          </Field>

          <Field
            label="Prescriber-approved maximum frequency"
            htmlFor="tret-max"
            hint="SkinTec progresses up to this frequency and never beyond it."
          >
            <select
              id="tret-max"
              className="st-select"
              value={state.progression.approvedMaxFrequency}
              onChange={(e) => {
                updateProgression({ approvedMaxFrequency: e.target.value as TretinoinFrequency });
                toast('Approved maximum updated', 'compatibility');
              }}
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABEL[f]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Stage duration" htmlFor="tret-duration" hint="How long SkinTec stays at each frequency before increasing.">
            <select
              id="tret-duration"
              className="st-select"
              value={state.progression.stageDurationWeeks}
              onChange={(e) => {
                const weeks = Number.parseInt(e.target.value, 10);
                updateProgression({ stageDurationWeeks: weeks });
                toast('Stage duration updated', 'calendar');
              }}
            >
              {[1, 2, 3, 4, 6, 8].map((w) => (
                <option key={w} value={w}>
                  {w} {w === 1 ? 'week' : 'weeks'}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <SettingRow
          title="Pause progression"
          sub={progression.paused ? progression.pauseReason ?? 'Progression is paused.' : 'Hold the current frequency.'}
        >
          <Switch
            checked={state.progression.paused}
            label="Pause progression"
            onChange={(next) =>
              updateProgression({
                paused: next,
                pauseReason: next ? 'You paused progression in Settings.' : undefined,
              })
            }
          />
        </SettingRow>

        <div className="st-mt-4 st-flex-between">
          <div>
            <div className="st-row-title">Current stage</div>
            <div className="st-row-sub">
              {progression.frequency ? FREQUENCY_LABEL[progression.frequency] : 'Not scheduled'}
            </div>
          </div>
          <Badge tone="treat" icon="tretinoin">
            {progression.stage ? FREQUENCY_SHORT[progression.stage.frequency] : '—'}
          </Badge>
        </div>

        <div className="st-mt-4">
          <Field label="Prescriber notes" htmlFor="tret-notes" hint="Saved on this device only.">
            <textarea
              id="tret-notes"
              className="st-textarea"
              value={state.settings.prescriberNotes}
              onChange={(e) => updateSettings({ prescriberNotes: e.target.value })}
              placeholder="What your dermatologist or prescriber told you to do."
            />
          </Field>
        </div>

        <Notice tone="plain" icon="info">
          SkinTec is a routine organiser, not a medical service. It never changes a prescription and never
          exceeds your approved frequency. If irritation is significant or persistent, talk to your
          dermatologist or prescriber.
        </Notice>
      </section>

      {/* ---------------- Retinol ---------------- */}
      <section className="st-card st-mt-4">
        <div className="st-flex-between">
          <h2 className="st-section-title" style={{ margin: 0 }}>
            Retinol
          </h2>
          <SkinTecIcon name="retinol" size={22} />
        </div>
        <SettingRow
          title="Include retinol on recovery nights"
          sub="Retinol is never scheduled on a tretinoin night."
        >
          <Switch
            checked={state.settings.retinolActive}
            label="Retinol on recovery nights"
            onChange={(next) => {
              updateSettings({ retinolActive: next });
              if (next) toast('Retinol added to recovery nights only', 'compatibility');
            }}
          />
        </SettingRow>
      </section>

      {/* ---------------- Masks ---------------- */}
      <section className="st-card st-mt-4">
        <div className="st-flex-between">
          <h2 className="st-section-title" style={{ margin: 0 }}>
            Masks
          </h2>
          <SkinTecIcon name="mask" size={22} />
        </div>
        {state.masks.map((mask) => (
          <div key={mask.id} className="st-mt-4" style={{ borderTop: '1px solid var(--st-line)', paddingTop: 'var(--st-4)' }}>
            <div className="st-flex-between">
              <div className="st-row-main">
                <div className="st-row-title">{mask.name}</div>
                <div className="st-row-sub">
                  {mask.avoidWithTretinoin ? 'Recovery nights only' : 'Flexible'}
                  {mask.avoidWithMaskIds.length > 0 ? ' · never stacked with its conflicting mask' : ''}
                </div>
              </div>
              <Switch
                checked={mask.enabled}
                label={`${mask.name} enabled`}
                onChange={(next) => updateMask(mask.id, { enabled: next })}
              />
            </div>

            <div className="st-grid-2 st-mt-3">
              <Field label="Times per week" htmlFor={`${mask.id}-freq`}>
                <select
                  id={`${mask.id}-freq`}
                  className="st-select"
                  value={mask.frequencyLimit}
                  onChange={(e) => updateMask(mask.id, { frequencyLimit: Number.parseInt(e.target.value, 10) })}
                >
                  {[1, 2, 3].map((n) => (
                    <option key={n} value={n}>
                      {n}×
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Preferred day" htmlFor={`${mask.id}-day`}>
                <select
                  id={`${mask.id}-day`}
                  className="st-select"
                  value={mask.preferredDays[0] ?? 'sat'}
                  onChange={(e) => updateMask(mask.id, { preferredDays: [e.target.value] })}
                >
                  {WEEKDAY_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {WEEKDAY_LABELS[key]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        ))}
        <Notice tone="plain" icon="compatibility">
          If a preferred day lands on a treatment night, SkinTec moves the mask to the nearest suitable
          recovery night.
        </Notice>
      </section>

      {/* ---------------- Notifications ---------------- */}
      <section className="st-card st-mt-4">
        <div className="st-flex-between">
          <h2 className="st-section-title" style={{ margin: 0 }}>
            Reminders
          </h2>
          <SkinTecIcon name="wait" size={22} />
        </div>
        <SettingRow title="Morning reminder" sub={state.settings.notifications.morningTime}>
          <Switch
            checked={state.settings.notifications.morningReminder}
            label="Morning reminder"
            onChange={(next) =>
              updateSettings({ notifications: { ...state.settings.notifications, morningReminder: next } })
            }
          />
        </SettingRow>
        <SettingRow title="Night reminder" sub={state.settings.notifications.nightTime}>
          <Switch
            checked={state.settings.notifications.nightReminder}
            label="Night reminder"
            onChange={(next) =>
              updateSettings({ notifications: { ...state.settings.notifications, nightReminder: next } })
            }
          />
        </SettingRow>
        <SettingRow title="Unfinished routine reminder" sub="A nudge if a routine is still open.">
          <Switch
            checked={state.settings.notifications.completionReminder}
            label="Routine completion reminder"
            onChange={(next) =>
              updateSettings({ notifications: { ...state.settings.notifications, completionReminder: next } })
            }
          />
        </SettingRow>
        <div className="st-grid-2 st-mt-3">
          <Field label="Morning time" htmlFor="rem-am">
            <input
              id="rem-am"
              type="time"
              className="st-input"
              value={state.settings.notifications.morningTime}
              onChange={(e) =>
                updateSettings({ notifications: { ...state.settings.notifications, morningTime: e.target.value } })
              }
            />
          </Field>
          <Field label="Night time" htmlFor="rem-pm">
            <input
              id="rem-pm"
              type="time"
              className="st-input"
              value={state.settings.notifications.nightTime}
              onChange={(e) =>
                updateSettings({ notifications: { ...state.settings.notifications, nightTime: e.target.value } })
              }
            />
          </Field>
        </div>
        <p className="st-xs st-muted">
          Reminders appear inside SkinTec while it is open. iPhone home-screen apps cannot send system
          notifications unless you allow them in Safari.
        </p>
      </section>

      {/* ---------------- Accessibility & data ---------------- */}
      <section className="st-card st-mt-4">
        <h2 className="st-section-title">Display and data</h2>
        <SettingRow title="Reduce motion" sub="Turn off transitions and animations.">
          <Switch
            checked={state.settings.reducedMotion}
            label="Reduce motion"
            onChange={(next) => updateSettings({ reducedMotion: next })}
          />
        </SettingRow>
        <div className="st-mt-4">
          <Button variant="danger" block icon="delete" onClick={() => setConfirmReset(true)}>
            Reset SkinTec data
          </Button>
        </div>
      </section>

      <section className="st-card st-mt-4">
        <h2 className="st-section-title">About SkinTec</h2>
        <p className="st-small st-soft">
          SkinTec plans your mornings and nights, manages your tretinoin restart and frequency progression,
          keeps recovery nights genuine and schedules masks only where they are compatible. Everything is
          stored on this device.
        </p>
        <p className="st-xs st-muted st-mt-3">Version 1.0 · Routine organiser, not a medical device.</p>
      </section>

      {confirmReset ? (
        <Modal title="Reset SkinTec data" onClose={() => setConfirmReset(false)}>
          <p className="st-soft">
            This clears your completions, check-ins, product edits and treatment settings on this device, and
            restarts the progression at 2 nights per week. It cannot be undone.
          </p>
          <div className="st-mt-6 st-stack-sm">
            <Button
              variant="danger"
              block
              icon="delete"
              onClick={() => {
                resetAll();
                setConfirmReset(false);
                toast('SkinTec reset', 'delete');
              }}
            >
              Reset everything
            </Button>
            <Button variant="ghost" block onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
