import { useSyncExternalStore } from 'react';
import type { DetectedIssue } from '@devlens/core';
import type { DashboardState, Tab, SeverityFilter, CategoryFilter, AIResult, AIModel } from '../lib/types';
import { createDashboardConnection } from '../lib/connection';
import type { DashboardConnection } from '../lib/connection';

const MAX_ISSUES = 2000;

function getSessionIdFromURL(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('session') ?? params.get('s') ?? 'default';
}

function createStore() {
  let state: DashboardState = {
    issues: [],
    activeTab: 'issues',
    severityFilter: 'all',
    categoryFilter: 'all',
    searchQuery: '',
    expandedIssueId: null,
    connected: false,
    sessionId: getSessionIdFromURL(),
  };

  let aiState: {
    loading: boolean;
    error: string | null;
    result: AIResult | null;
    model: AIModel;
  } = {
    loading: false,
    error: null,
    result: null,
    model: 'gemini-2.5-flash-lite',
  };

  const listeners = new Set<() => void>();

  function notify(): void {
    for (const listener of listeners) {
      listener();
    }
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getState(): DashboardState {
    return state;
  }

  function getAIState() {
    return aiState;
  }

  function setState(partial: Partial<DashboardState>): void {
    state = { ...state, ...partial };
    notify();
  }

  function setAIState(partial: Partial<typeof aiState>): void {
    aiState = { ...aiState, ...partial };
    notify();
  }

  function addIssue(issue: DetectedIssue): void {
    const issues = [...state.issues, issue];
    if (issues.length > MAX_ISSUES) {
      issues.splice(0, issues.length - MAX_ISSUES);
    }
    state = { ...state, issues };
    notify();
  }

  function syncIssues(issues: DetectedIssue[]): void {
    state = { ...state, issues: [...issues] };
    notify();
  }

  function clearIssues(): void {
    state = { ...state, issues: [], expandedIssueId: null };
    aiState = { ...aiState, result: null, error: null };
    notify();
  }

  function setTab(tab: Tab): void {
    state = { ...state, activeTab: tab, expandedIssueId: null };
    notify();
  }

  function setSeverityFilter(filter: SeverityFilter): void {
    state = { ...state, severityFilter: filter };
    notify();
  }

  function setCategoryFilter(filter: CategoryFilter): void {
    state = { ...state, categoryFilter: filter };
    notify();
  }

  function setSearchQuery(query: string): void {
    state = { ...state, searchQuery: query };
    notify();
  }

  function toggleExpandedIssue(id: string): void {
    state = {
      ...state,
      expandedIssueId: state.expandedIssueId === id ? null : id,
    };
    notify();
  }

  function setConnected(connected: boolean): void {
    state = { ...state, connected };
    notify();
  }

  return {
    subscribe,
    getState,
    getAIState,
    setState,
    setAIState,
    addIssue,
    syncIssues,
    clearIssues,
    setTab,
    setSeverityFilter,
    setCategoryFilter,
    setSearchQuery,
    toggleExpandedIssue,
    setConnected,
  };
}

// Singleton store
const store = createStore();

// Singleton connection — shared across all components
let connection: DashboardConnection | null = null;

export function useDashboardStore() {
  const state = useSyncExternalStore(store.subscribe, store.getState);
  const aiState = useSyncExternalStore(store.subscribe, store.getAIState);
  return { ...state, ai: aiState };
}

export function useDashboardActions() {
  return {
    setTab: store.setTab,
    setSeverityFilter: store.setSeverityFilter,
    setCategoryFilter: store.setCategoryFilter,
    setSearchQuery: store.setSearchQuery,
    toggleExpandedIssue: store.toggleExpandedIssue,
    clearIssues: store.clearIssues,
    setAIState: store.setAIState,
    addIssue: store.addIssue,
  };
}

export function connectDashboard(sessionId: string): void {
  if (connection) {
    connection.stop();
  }
  connection = createDashboardConnection(sessionId, {
    onIssue: store.addIssue,
    onSync: store.syncIssues,
    onClear: store.clearIssues,
    onConnected: store.setConnected,
  });
  connection.start();
}

export function disconnectDashboard(): void {
  if (connection) {
    connection.stop();
    connection = null;
  }
}

export function sendClearToApp(): void {
  connection?.sendClear();
  store.clearIssues();
}

export { store };
