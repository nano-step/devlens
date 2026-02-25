import type { Tab } from '../lib/types';
import { useDashboardStore, useDashboardActions } from '../hooks/use-dashboard-store';

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none"><circle cx="14" cy="14" r="10" stroke="#6366f1" stroke-width="2.5"/><line x1="21.5" y1="21.5" x2="32" y2="32" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round"/><text x="9" y="18" font-family="monospace" font-size="10" font-weight="bold" fill="#6366f1">{}</text></svg>`;

const TABS: Array<{ id: Tab; label: string; dotClass: string }> = [
  { id: 'issues', label: 'Issues', dotClass: 'issues' },
  { id: 'timeline', label: 'Timeline', dotClass: 'timeline' },
  { id: 'ai', label: 'AI Analysis', dotClass: 'ai' },
  { id: 'settings', label: 'Settings', dotClass: 'settings' },
];

export function Sidebar() {
  const { activeTab, issues, connected, sessionId } = useDashboardStore();
  const { setTab } = useDashboardActions();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div
          className="sidebar-logo"
          dangerouslySetInnerHTML={{ __html: LOGO_SVG }}
        />
        <div>
          <div className="sidebar-title">DevLens</div>
          <div className="sidebar-subtitle">Dashboard</div>
        </div>
      </div>

      <div className="sidebar-nav">
        {TABS.map((tab) => (
          <div
            key={tab.id}
            className={`nav-item${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setTab(tab.id)}
          >
            <div className={`nav-dot ${tab.dotClass}`} />
            <span>{tab.label}</span>
            {tab.id === 'issues' && issues.length > 0 && (
              <span className="nav-count">{issues.length}</span>
            )}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="conn-status">
          <div className={`conn-dot ${connected ? 'on' : 'wait'}`} />
          <span>{connected ? 'Connected' : 'Waiting…'}</span>
        </div>
        <div className="session-id mono">{sessionId}</div>
      </div>
    </div>
  );
}
