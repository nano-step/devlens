import { createElement, useEffect } from 'react';
import { App } from './App';
import { connectDashboard, disconnectDashboard } from './hooks/use-dashboard-store';
import './styles/dashboard.css';

export { connectDashboard, disconnectDashboard, useDashboardStore, useDashboardActions, sendClearToApp } from './hooks/use-dashboard-store';
export type { DashboardState, Tab, SeverityFilter, CategoryFilter } from './lib/types';

export interface DevLensDashboardProps {
  sessionId?: string;
}

function getSessionIdFromURL(): string {
  if (typeof window === 'undefined') return 'default';
  const params = new URLSearchParams(window.location.search);
  return params.get('session') ?? params.get('s') ?? 'default';
}

export function DevLensDashboard({ sessionId }: DevLensDashboardProps) {
  const resolvedSessionId = sessionId ?? getSessionIdFromURL();

  useEffect(() => {
    connectDashboard(resolvedSessionId);
    return () => disconnectDashboard();
  }, [resolvedSessionId]);

  return createElement(App);
}
