import type { DetectedIssue } from '@devlens/core';
import type { SeverityFilter, CategoryFilter } from './types';

export function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 1000) return 'now';
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

export function filterIssues(
  issues: DetectedIssue[],
  severityFilter: SeverityFilter,
  categoryFilter: CategoryFilter,
  searchQuery: string,
): DetectedIssue[] {
  return issues.filter((issue) => {
    if (severityFilter !== 'all' && issue.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && issue.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matches =
        issue.message.toLowerCase().includes(q) ||
        (issue.path?.toLowerCase().includes(q) ?? false) ||
        (issue.source?.toLowerCase().includes(q) ?? false) ||
        issue.category.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });
}

export function getCategoryCounts(issues: DetectedIssue[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const issue of issues) {
    counts[issue.category] = (counts[issue.category] ?? 0) + 1;
  }
  return counts;
}

export function exportAsJSON(issues: DetectedIssue[]): string {
  return JSON.stringify(issues, null, 2);
}

export function exportAsCSV(issues: DetectedIssue[]): string {
  const headers = 'id,timestamp,severity,category,message,path,source,suggestion';
  const rows = issues.map((i) => {
    return [
      i.id,
      new Date(i.timestamp).toISOString(),
      i.severity,
      i.category,
      `"${String(i.message || '').replace(/"/g, '""')}"`,
      i.path || '',
      i.source || '',
      `"${String(i.suggestion || '').replace(/"/g, '""')}"`,
    ].join(',');
  });
  return `${headers}\n${rows.join('\n')}`;
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
