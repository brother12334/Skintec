import { useEffect, useMemo, useState } from 'react';
import { StoreProvider, useStore } from './store/store';
import { ToastProvider, Notice, Button } from './components/ui';
import { BottomNav, type TabKey } from './components/BottomNav';
import { TodayScreen } from './screens/Today';
import { WeekScreen } from './screens/Week';
import { NotesScreen } from './screens/Notes';
import { ProgressScreen } from './screens/Progress';
import { SettingsScreen } from './screens/Settings';
import { Onboarding } from './screens/Onboarding';
import { formatHeaderDate, toISO } from './engine/dates';
import { dayPart, resolveTheme } from './engine/daypart';
import { getDailyRoutine } from './engine/scheduler';
import { MOOD_CLASSES, moodClass, type Mood } from './engine/mood';

/** Keeps the app on the right calendar day across midnight, sleep and timezone changes. */
function useLocalClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const timer = window.setInterval(tick, 60_000);
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', tick);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);
  return { today: toISO(now), hour: now.getHours() };
}

const TAB_TITLES: Record<TabKey, string> = {
  today: 'Today',
  week: 'Week',
  notes: 'Notes',
  progress: 'Progress',
  settings: 'Settings',
};

/** Paints the whole document in one mood, including the strip behind the status bar. */
function useDocumentMood(mood: Mood, theme: 'day' | 'night') {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.remove(...MOOD_CLASSES);
    root.classList.add(moodClass(mood));
    const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
    const meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (meta && bg) meta.setAttribute('content', bg);
    try {
      localStorage.setItem('skintec.paint', JSON.stringify({ mood, theme }));
    } catch {
      // Only used to paint the first frame; nothing depends on it.
    }
  }, [mood, theme]);
}

function Shell() {
  const { state, recovered, dismissRecovery } = useStore();
  const { today, hour } = useLocalClock();
  const [tab, setTab] = useState<TabKey>('today');

  const theme = resolveTheme(state.settings.themeMode, hour);
  const now = dayPart(hour);
  // Today shows the routine that is current; the other one is a tap away.
  const [part, setPart] = useState(now);
  useEffect(() => setPart(now), [now]);
  const routine = useMemo(() => getDailyRoutine(state, today), [state, today]);
  // The app wears the colour of the routine in front of you.
  const shown = tab === 'today' ? part : now;
  const mood: Mood = shown === 'am' ? 'am' : routine.pm.kind;
  useDocumentMood(mood, theme);

  useEffect(() => {
    document.documentElement.classList.toggle('st-reduce', state.settings.reducedMotion);
  }, [state.settings.reducedMotion]);

  useEffect(() => {
    document.title = tab === 'today' ? 'SkinTec' : `SkinTec — ${TAB_TITLES[tab]}`;
  }, [tab]);

  if (!state.settings.onboarded) return <Onboarding today={today} />;

  return (
    <div className={`st-app ${moodClass(mood)}`}>
      <header className="st-header">
        <div className="st-header-inner">
          <span className="st-wordmark">SkinTec</span>
          <span className="st-header-date">{formatHeaderDate(today)}</span>
        </div>
      </header>

      <main className="st-main">
        {recovered ? (
          <Notice tone="warn" icon="warning">
            Some saved data could not be read, so SkinTec restored a safe default routine. Check your settings.
            <div className="st-mt-3">
              <Button variant="secondary" small onClick={dismissRecovery}>
                Got it
              </Button>
            </div>
          </Notice>
        ) : null}

        {tab === 'today' ? <TodayScreen today={today} part={part} onPartChange={setPart} /> : null}
        {tab === 'week' ? <WeekScreen today={today} /> : null}
        {tab === 'notes' ? <NotesScreen /> : null}
        {tab === 'progress' ? <ProgressScreen today={today} /> : null}
        {tab === 'settings' ? <SettingsScreen today={today} /> : null}
      </main>

      <BottomNav tab={tab} onChange={setTab} />
    </div>
  );
}

export function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </StoreProvider>
  );
}
