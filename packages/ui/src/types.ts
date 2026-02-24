import type { DetectedIssue, IssueCategory, Severity } from '@devlens/core';

/** Configuration for the DevLens UI panel */
export interface PanelConfig {
  /** Position of the toggle button (default: 'bottom-right') */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Panel width in pixels (default: 420) */
  panelWidth?: number;
  /** Panel height in pixels (default: 520) */
  panelHeight?: number;
  /** Start with panel open (default: false) */
  defaultOpen?: boolean;
  /** Theme (default: 'dark') */
  theme?: 'dark' | 'light';
  /** Hotkey to toggle panel (default: 'ctrl+shift+d') */
  hotkey?: string;
}

/** Internal state of the panel */
export interface PanelState {
  isOpen: boolean;
  issues: DetectedIssue[];
  filter: {
    severity: Severity | 'all';
    category: IssueCategory | 'all';
    search: string;
  };
  activeView: 'list' | 'timeline';
  selectedIssueId: string | null;
}

/** Panel instance returned by createPanel */
export interface PanelInstance {
  /** Open the panel */
  open(): void;
  /** Close the panel */
  close(): void;
  /** Toggle panel visibility */
  toggle(): void;
  /** Add an issue to the panel */
  addIssue(issue: DetectedIssue): void;
  /** Clear all issues */
  clear(): void;
  /** Get current issues */
  getIssues(): readonly DetectedIssue[];
  /** Destroy the panel and clean up */
  destroy(): void;
}
