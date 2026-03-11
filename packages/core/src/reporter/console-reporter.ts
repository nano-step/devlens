import type { Reporter, DetectedIssue, Severity, IssueCategory } from '../types';

const CATEGORY_LABELS: Record<IssueCategory, string> = {
  'network': '[NET]',
  'null-access': '[NULL]',
  'undefined-data': '[UNDEF]',
  'render-data': '[RENDER]',
  'unhandled-error': '[ERR]',
  'unhandled-rejection': '[REJ]',
  'type-mismatch': '[TYPE]',
  'api-contract': '[CONTRACT]',
};

const SEVERITY_COLORS: Record<Severity, string> = {
  error: '#ff4444',
  warn: '#ffaa00',
  info: '#4488ff',
};

const SEVERITY_LABELS: Record<Severity, string> = {
  error: 'ERROR',
  warn: 'WARN',
  info: 'INFO',
};

function formatDetails(issue: DetectedIssue): string[] {
  const lines: string[] = [];

  if (issue.path) {
    lines.push(`  |- Path: ${issue.path}`);
  }

  if (issue.foundValue !== undefined) {
    lines.push(
      `  |- Value: ${issue.foundValue === null ? 'null' : String(issue.foundValue)}`,
    );
  }

  if (issue.details) {
    const entries = Object.entries(issue.details);
    for (const [key, value] of entries) {
      lines.push(`  |- ${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`);
    }
  }

  if (issue.source) {
    lines.push(`  |- Source: ${issue.source}`);
  }

  if (issue.suggestion) {
    lines.push(`  |- Suggestion: ${issue.suggestion}`);
  }

  if (issue.stack) {
    const stackPreview = issue.stack.split('\n').slice(0, 3).join('\n');
    lines.push(`  \\- Stack:\n${stackPreview}`);
  } else if (lines.length > 0) {
    const lastIdx = lines.length - 1;
    const lastLine = lines[lastIdx];
    if (lastLine) {
      lines[lastIdx] = lastLine.replace('|-', '\\-');
    }
  }

  return lines;
}

export function createConsoleReporter(): Reporter {
  function report(issue: DetectedIssue): void {
    const categoryLabel = CATEGORY_LABELS[issue.category] ?? '[DL]';
    const color = SEVERITY_COLORS[issue.severity];
    const label = SEVERITY_LABELS[issue.severity];
    const header = `${categoryLabel} DevLens [${label}] ${issue.category}: ${issue.message}`;
    const details = formatDetails(issue);
    const timestamp = `  Timestamp: ${new Date(issue.timestamp).toISOString()}`;

    const consoleFn =
      issue.severity === 'error'
        ? console.error
        : issue.severity === 'warn'
          ? console.warn
          : console.log;
    // Single consoleFn call with header + all details to avoid
    // per-line stack traces that browsers inject on error/warn calls
    consoleFn(
      `%c${header}\n%c${[...details, timestamp].join('\n')}`,
      `color: ${color}; font-weight: bold;`,
      'color: #888; font-weight: normal;',
    );
  }

  function reportBatch(issues: DetectedIssue[]): void {
    if (issues.length === 0) return;

    console.groupCollapsed(
      `%c[DL] DevLens -- ${issues.length} issue(s) detected`,
      'color: #ff4444; font-weight: bold; font-size: 12px;',
    );

    for (const issue of issues) {
      report(issue);
    }

    console.groupEnd();
  }

  function clear(): void {
    console.clear();
  }

  return { report, reportBatch, clear };
}
