import { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Statusbar } from './components/Statusbar';
import { IssuesPage } from './pages/IssuesPage';
import { TimelinePage } from './pages/TimelinePage';
import { AIPage } from './pages/AIPage';
import { SettingsPage } from './pages/SettingsPage';
import { useDashboardStore, connectDashboard, disconnectDashboard } from './hooks/use-dashboard-store';

function Content() {
  const { activeTab } = useDashboardStore();

  switch (activeTab) {
    case 'issues':
      return <IssuesPage />;
    case 'timeline':
      return <TimelinePage />;
    case 'ai':
      return <AIPage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <IssuesPage />;
  }
}

export function App() {
  const { sessionId } = useDashboardStore();

  useEffect(() => {
    connectDashboard(sessionId);
    return () => disconnectDashboard();
  }, [sessionId]);

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Topbar />
        <Content />
        <Statusbar />
      </div>
    </div>
  );
}
