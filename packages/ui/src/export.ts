import type { DetectedIssue } from '@devlens/core';

export function exportAsJSON(issues: readonly DetectedIssue[]): string {
  return JSON.stringify(issues, null, 2);
}

export function exportAsCSV(issues: readonly DetectedIssue[]): string {
  const headers = ['id', 'timestamp', 'severity', 'category', 'message', 'path', 'source', 'suggestion'];
  const rows = issues.map((issue) => {
    return headers.map((h) => {
      const val = issue[h as keyof DetectedIssue];
      if (val === undefined || val === null) return '';
      const str = typeof val === 'number' ? new Date(val).toISOString() : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
