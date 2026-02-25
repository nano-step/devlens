import type { DetectedIssue } from '@devlens/core';

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

export interface AIResult {
  summary: string;
  criticalIssues: AIIssueItem[];
  patterns: AIPatternItem[];
  suggestions: AISuggestionItem[];
  _model?: string;
  _tokens?: number;
}

export interface AIIssueItem {
  title: string;
  severity: string;
  description: string;
  rootCause?: string;
  fix?: string;
  affectedPath?: string;
}

export interface AIPatternItem {
  title: string;
  description: string;
  relatedIssues?: string[];
}

export interface AISuggestionItem {
  title: string;
  priority: string;
  description: string;
  codeExample?: string;
}

export interface SingleIssueAIResult {
  rootCause: string;
  fix: string;
  codeExample?: string;
  impact?: string;
  prevention?: string;
  _model?: string;
  _tokens?: number;
}

export interface IssueAIState {
  loading: boolean;
  error: string | null;
  result: SingleIssueAIResult | null;
}

export const CATEGORY_LABELS: Record<string, string> = {
  'network': 'NET',
  'null-access': 'NULL',
  'undefined-data': 'UNDEF',
  'render-data': 'RENDER',
  'unhandled-error': 'ERR',
  'unhandled-rejection': 'REJ',
  'type-mismatch': 'TYPE',
};

export const CATEGORY_CSS: Record<string, string> = {
  'network': 'net',
  'null-access': 'null',
  'undefined-data': 'undef',
  'render-data': 'render',
  'unhandled-error': 'err',
  'unhandled-rejection': 'rej',
  'type-mismatch': 'type',
};

export const AI_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
  'claude-sonnet-4-6',
  'gpt-5',
  'gpt-5.1-codex-mini',
] as const;

export type AIModel = typeof AI_MODELS[number];
