import { SkinTecIcon, type SkinTecIconName } from '../icons/SkinTecIcon';

export type TabKey = 'today' | 'schedule' | 'products' | 'progress' | 'settings';

const TABS: { key: TabKey; label: string; icon: SkinTecIconName }[] = [
  { key: 'today', label: 'Today', icon: 'today' },
  { key: 'schedule', label: 'Schedule', icon: 'calendar' },
  { key: 'products', label: 'Products', icon: 'products' },
  { key: 'progress', label: 'Progress', icon: 'progress' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

export function BottomNav({ tab, onChange }: { tab: TabKey; onChange: (tab: TabKey) => void }) {
  return (
    <nav className="st-nav" aria-label="SkinTec sections">
      <div className="st-nav-inner">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            className="st-nav-item"
            aria-current={tab === item.key ? 'page' : undefined}
            onClick={() => onChange(item.key)}
          >
            <SkinTecIcon name={item.icon} size={22} />
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
