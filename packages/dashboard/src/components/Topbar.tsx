import type { SeverityFilter } from '../lib/types';
import { useDashboardStore, useDashboardActions } from '../hooks/use-dashboard-store';

const TAB_TITLES: Record<string, string> = {
  issues: 'Issues',
  timeline: 'Timeline',
  ai: 'AI Analysis',
  settings: 'Settings',
};

const SEVERITY_BUTTONS: Array<{
  label: string;
  value: SeverityFilter;
  activeClass: string;
}> = [
  { label: 'All', value: 'all', activeClass: 'active' },
  { label: 'Error', value: 'error', activeClass: 'active-error' },
  { label: 'Warn', value: 'warn', activeClass: 'active-warn' },
  { label: 'Info', value: 'info', activeClass: 'active-info' },
];

export function Topbar() {
  const { activeTab, severityFilter, searchQuery } = useDashboardStore();
  const { setSeverityFilter, setSearchQuery } = useDashboardActions();
  const showControls = activeTab === 'issues' || activeTab === 'timeline';

  return (
    <div className="topbar">
      <div className="topbar-title">{TAB_TITLES[activeTab] ?? ''}</div>
      {showControls && (
        <div className="topbar-controls">
          {SEVERITY_BUTTONS.map((btn) => (
            <button
              key={btn.value}
              className={`sev-btn${severityFilter === btn.value ? ` ${btn.activeClass}` : ''}`}
              onClick={() => setSeverityFilter(btn.value)}
            >
              {btn.label}
            </button>
          ))}
          <input
            className="search-input"
            type="text"
            placeholder="Search issues…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
