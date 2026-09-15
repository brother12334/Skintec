import { useEffect, useState } from 'react';
import { StoreProvider, useStore } from './store/store';
import { ToastProvider, Notice, Button } from './components/ui';
import { BottomNav, type TabKey } from './components/BottomNav';
import { SkinTecIcon, SkinTecMark } from './icons/SkinTecIcon';
import { TodayScreen } from './screens/Today';
import { ScheduleScreen } from './screens/Schedule';
import { ProductsScreen } from './screens/Products';
import { ProgressScreen } from './screens/Progress';
import { SettingsScreen } from './screens/Settings';
import { Onboarding } from './screens/Onboarding';
import { toISO } from './engine/dates';
import { dayPart, resolveTheme } from './engine/daypart';

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
  schedule: 'Schedule',
  products: 'Products',
  progress: 'Progress',
  settings: 'Settings',
};

function Shell() {
  const { state, recovered, dismissRecovery } = useStore();
  const { today, hour } = useLocalClock();
  const [tab, setTab] = useState<TabKey>('today');

  const theme = resolveTheme(state.settings.themeMode, hour);
  const part = dayPart(hour);

  useEffect(() => {
    document.documentElement.classList.toggle('st-reduce', state.settings.reducedMotion);
  }, [state.settings.reducedMotion]);

  // SkinTec dims itself after dark. The meta colour keeps the iOS status bar
  // and the standalone window in step with the theme.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'night' ? '#131219' : '#FFFBF2');
  }, [theme]);

  useEffect(() => {
    document.title = tab === 'today' ? 'SkinTec' : `SkinTec — ${TAB_TITLES[tab]}`;
  }, [tab]);

  if (!state.settings.onboarded) return <Onboarding today={today} />;

  return (
    <div className="st-app">
      <header className="st-header">
        <div className="st-header-inner">
          <div className="st-wordmark">
            <SkinTecMark size={34} />
            <div>
              <div className="st-wordmark-name">SkinTec</div>
              <div className="st-wordmark-sub">{TAB_TITLES[tab]}</div>
            </div>
          </div>
          <SkinTecIcon
            name={part === 'am' ? 'morning' : 'night'}
            size={22}
            title={part === 'am' ? 'Daytime' : 'Evening'}
          />
        </div>
      </header>

      <main className="st-main">
        {recovered ? (
          <div className="st-mt-4">
            <Notice tone="warn" icon="warning">
              Some saved data could not be read, so SkinTec restored a safe default routine. Check your
              treatment settings.
              <div className="st-mt-3">
                <Button variant="secondary" small onClick={dismissRecovery}>
                  Got it
                </Button>
              </div>
            </Notice>
          </div>
        ) : null}

        {tab === 'today' ? <TodayScreen today={today} hour={hour} /> : null}
        {tab === 'schedule' ? <ScheduleScreen today={today} /> : null}
        {tab === 'products' ? <ProductsScreen today={today} /> : null}
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
