import type { Reporter, DetectedIssue } from '@devlens/core';
import type { PanelInstance } from './types';

export function createPanelReporter(panel: PanelInstance): Reporter {
  return {
    report(issue: DetectedIssue): void {
      panel.addIssue(issue);
    },
    reportBatch(issues: DetectedIssue[]): void {
      for (const issue of issues) {
        panel.addIssue(issue);
      }
    },
    clear(): void {
      panel.clear();
    },
  };
}
