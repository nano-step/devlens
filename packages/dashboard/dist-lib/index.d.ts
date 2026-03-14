import type { DetectedIssue } from '@devlens/core';

export interface DevLensDashboardProps {
  sessionId?: string;
}

export declare function DevLensDashboard(props: DevLensDashboardProps): import('react').ReactElement;

export type Tab = 'issues' | 'timeline' | 'ai' | 'settings';
export type SeverityFilter = 'all' | 'error' | 'warn' | 'info';
export type CategoryFilter = 'all' | string;

export interface DashboardState {
  issues: DetectedIssue[];
  activeTab: Tab;
  severityFilter: SeverityFilter;
  categoryFilter: CategoryFilter;
  searchQuery: string;
  expandedIssueId: string | null;
  connected: boolean;
  sessionId: string;
}

export declare function connectDashboard(sessionId: string): void;
export declare function disconnectDashboard(): void;
export declare function sendClearToApp(): void;

export declare function useDashboardStore(): DashboardState & {
  ai: { loading: boolean; error: string | null; result: unknown; model: string };
  issueAI: Record<string, { loading: boolean; error: string | null; result: unknown }>;
};

export declare function useDashboardActions(): {
  setTab: (tab: Tab) => void;
  setSeverityFilter: (filter: SeverityFilter) => void;
  setCategoryFilter: (filter: CategoryFilter) => void;
  setSearchQuery: (query: string) => void;
  toggleExpandedIssue: (id: string) => void;
  clearIssues: () => void;
  setAIState: (partial: Record<string, unknown>) => void;
  setIssueAI: (issueId: string, partial: Record<string, unknown>) => void;
  addIssue: (issue: DetectedIssue) => void;
};
