import { useDashboardStore, sendClearToApp } from '../hooks/use-dashboard-store';

export function SettingsPage() {
  const { issues, sessionId } = useDashboardStore();

  return (
    <div className="content">
      <div className="settings-panel">
        <div className="settings-group">
          <div className="settings-label">Session ID</div>
          <div className="settings-value mono">{sessionId}</div>
        </div>
        <div className="settings-group">
          <div className="settings-label">Dashboard URL</div>
          <div className="settings-value mono">
            {window.location.origin}?session={sessionId}
          </div>
        </div>
        <div className="settings-group">
          <div className="settings-label">Total Issues</div>
          <div className="settings-value">{issues.length}</div>
        </div>
        <div className="settings-group">
          <button className="btn btn-ghost" onClick={sendClearToApp}>
            Clear All Issues
          </button>
        </div>
        <div className="settings-group">
          <div className="settings-label">Version</div>
          <div className="settings-value">DevLens Dashboard v0.1.0</div>
        </div>
      </div>
    </div>
  );
}
