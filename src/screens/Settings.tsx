import { useState } from 'react';
import { useStore } from '../store/store';
import type { ThemeMode } from '../types';
import { addDays, formatShortDate, isValidISO, daysBetween, WEEKDAY_KEYS, WEEKDAY_LABELS } from '../engine/dates';
import { Button, Field, Modal, Segmented, SettingRow, Switch, useToast } from '../components/ui';

export function SettingsScreen({ today }: { today: string }) {
  const { state, updateSettings, upsertProduct, resetAll } = useStore();
  const toast = useToast();
  const [confirmReset, setConfirmReset] = useState(false);
  const { settings } = state;
  const stepBackActive = isValidISO(settings.stepBackUntil) && daysBetween(today, settings.stepBackUntil!) >= 0;
  const notifications = settings.notifications;
  const shift = settings.scheduleShift ?? 0;

  return (
    <>
      <section className="hero">
        <span className="kicker">SkinTec</span>
        <h1 className="big">Settings</h1>
      </section>

      <section>
        <h2 className="subtitle">Plan</h2>
        <div className="st-mt-3 st-stack">
          <Field label="Day 1 of the plan" htmlFor="start-date" hint="Weeks 1–2 start slowly, adapalene joins in week 3, the full schedule runs from week 5.">
            <input
              id="start-date"
              type="date"
              className="st-input"
              value={settings.startDate}
              onChange={(e) => {
                if (isValidISO(e.target.value)) updateSettings({ startDate: e.target.value });
              }}
            />
          </Field>
        </div>
        <SettingRow
          title="I have adapalene"
          sub="Bought Differin gel and checked with your dapsone prescriber. Until then, adapalene nights are recovery nights."
        >
          <Switch
            checked={settings.adapaleneReady}
            label="I have adapalene"
            onChange={(next) => {
              updateSettings({ adapaleneReady: next });
              toast(next ? 'Adapalene nights are on' : 'Adapalene nights are recovery for now', 'calendar');
            }}
          />
        </SettingRow>
        <SettingRow
          title="Go back a step for a week"
          sub={
            stepBackActive
              ? `On until ${formatShortDate(settings.stepBackUntil!)}. The plan runs one phase gentler.`
              : 'Use this if your skin gets irritated. An irritated check-in does it for you too.'
          }
        >
          {stepBackActive ? (
            <Button variant="secondary" small onClick={() => updateSettings({ stepBackUntil: undefined })}>
              Stop
            </Button>
          ) : (
            <Button
              variant="secondary"
              small
              onClick={() => {
                updateSettings({ stepBackUntil: addDays(today, 6) });
                toast('Stepped back for a week', 'recovery');
              }}
            >
              Step back
            </Button>
          )}
        </SettingRow>
      </section>

      <section>
        <h2 className="subtitle">Shift the week</h2>
        <p className="st-small st-muted st-mt-2">
          {shift === 0
            ? 'Every night is on its usual weekday.'
            : `Running ${shift} day${shift === 1 ? '' : 's'} early: Monday’s routine is on ${WEEKDAY_LABELS[WEEKDAY_KEYS[(7 - shift) % 7]]}.`}{' '}
          Use this if you did a night on the wrong day and want to carry on from there.
        </p>
        <div className="st-flex st-mt-3" style={{ flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            small
            onClick={() => {
              updateSettings({ scheduleShift: (shift + 1) % 7 });
              toast('Week moved a day earlier', 'calendar');
            }}
          >
            A day earlier
          </Button>
          <Button
            variant="secondary"
            small
            onClick={() => {
              updateSettings({ scheduleShift: (shift + 6) % 7 });
              toast('Week moved a day later', 'calendar');
            }}
          >
            A day later
          </Button>
          {shift !== 0 ? (
            <Button variant="ghost" small onClick={() => updateSettings({ scheduleShift: 0 })}>
              Back to normal
            </Button>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="subtitle">Products</h2>
        <p className="st-small st-muted st-mt-2">Rename anything to what’s on your bottle. Turn a mask off if you don’t have one.</p>
        <div className="st-mt-3 st-stack">
          {state.products.map((p) => (
            <div key={p.id} className="st-flex" style={{ alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Field label={p.category} htmlFor={`product-${p.id}`}>
                  <input
                    id={`product-${p.id}`}
                    className="st-input"
                    value={p.shortName ?? p.name}
                    onChange={(e) => upsertProduct({ ...p, shortName: e.target.value })}
                  />
                </Field>
              </div>
              {p.category === 'mask' ? (
                <div style={{ paddingBottom: 8 }}>
                  <Switch checked={p.active} label={`${p.name} on`} onChange={(next) => upsertProduct({ ...p, active: next })} />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="subtitle">Reminders</h2>
        <SettingRow title="Morning reminder" sub={notifications.morningTime}>
          <Switch
            checked={notifications.morningReminder}
            label="Morning reminder"
            onChange={(next) => updateSettings({ notifications: { ...notifications, morningReminder: next } })}
          />
        </SettingRow>
        <SettingRow title="Night reminder" sub={notifications.nightTime}>
          <Switch
            checked={notifications.nightReminder}
            label="Night reminder"
            onChange={(next) => updateSettings({ notifications: { ...notifications, nightReminder: next } })}
          />
        </SettingRow>
        <div className="st-grid-2 st-mt-3">
          <Field label="Morning" htmlFor="rem-am">
            <input
              id="rem-am"
              type="time"
              className="st-input"
              value={notifications.morningTime}
              onChange={(e) => updateSettings({ notifications: { ...notifications, morningTime: e.target.value } })}
            />
          </Field>
          <Field label="Night" htmlFor="rem-pm">
            <input
              id="rem-pm"
              type="time"
              className="st-input"
              value={notifications.nightTime}
              onChange={(e) => updateSettings({ notifications: { ...notifications, nightTime: e.target.value } })}
            />
          </Field>
        </div>
        <p className="st-xs st-muted st-mt-2">Reminders show inside SkinTec while it’s open.</p>
      </section>

      <section>
        <h2 className="subtitle">Display</h2>
        <div className="st-field st-mt-3">
          <span className="st-label">Appearance</span>
          <Segmented<ThemeMode>
            label="Appearance"
            value={settings.themeMode}
            onChange={(mode) => updateSettings({ themeMode: mode })}
            options={[
              { value: 'light', label: 'Pastel' },
              { value: 'auto', label: 'Auto' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
          <p className="st-hint">Auto switches to dark from 6pm. Dark keeps the same colors, just dimmed.</p>
        </div>
        <SettingRow title="Reduce motion" sub="Turn off transitions.">
          <Switch checked={settings.reducedMotion} label="Reduce motion" onChange={(next) => updateSettings({ reducedMotion: next })} />
        </SettingRow>
      </section>

      <Button variant="danger" block icon="delete" onClick={() => setConfirmReset(true)}>
        Reset SkinTec
      </Button>
      <p className="st-xs st-muted st-center">Everything stays on this device. SkinTec organizes your routine; it isn’t medical advice.</p>

      {confirmReset ? (
        <Modal title="Reset SkinTec" onClose={() => setConfirmReset(false)}>
          <p>This clears your logged routines, check-ins and product names on this device and restarts the plan today. It can’t be undone.</p>
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
