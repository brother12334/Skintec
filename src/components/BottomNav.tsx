export type TabKey = 'today' | 'week' | 'notes' | 'progress' | 'settings';

export const TABS: { key: TabKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'notes', label: 'Notes' },
  { key: 'progress', label: 'Progress' },
  { key: 'settings', label: 'Settings' },
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
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
