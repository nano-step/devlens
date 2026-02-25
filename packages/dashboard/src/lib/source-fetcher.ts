import type { DetectedIssue } from '@devlens/core';

export interface SourceLocation {
  url: string;
  file: string;
  line: number;
  column?: number;
}

export interface SourceContext {
  file: string;
  line: number;
  column?: number;
  contextLines: string;
}

// Simple in-memory cache for fetched source files
const sourceCache = new Map<string, string | null>();

const STACK_LINE_RE =
  /(?:at\s+(?:[\w$.]+\s+)?\(?(https?:\/\/[^)]+)\)?|^\s*(https?:\/\/\S+))/;
const URL_LOCATION_RE = /^(https?:\/\/[^:?#]+(?:\.[^:?#]+)*)(?:\?[^:]*)?:(\d+)(?::(\d+))?/;

export function parseStackLocations(stack: string): SourceLocation[] {
  const locations: SourceLocation[] = [];
  const lines = stack.split('\n');

  for (const line of lines) {
    if (locations.length >= 3) break;

    const match = line.match(STACK_LINE_RE);
    if (!match) continue;

    const rawUrl = match[1] || match[2];
    if (!rawUrl) continue;

    // Skip node_modules, devlens internal, browser internals
    if (
      rawUrl.includes('node_modules') ||
      rawUrl.includes('__devlens__') ||
      rawUrl.includes('chrome-extension')
    ) continue;

    const locMatch = rawUrl.match(URL_LOCATION_RE);
    if (!locMatch) continue;

    const baseUrl = locMatch[1]!;
    const lineNum = parseInt(locMatch[2]!, 10);
    const colNum = locMatch[3] ? parseInt(locMatch[3], 10) : undefined;

    // Extract relative file path from URL
    try {
      const urlObj = new URL(baseUrl);
      const file = urlObj.pathname.replace(/^\//, '');
      if (!file) continue;

      locations.push({
        url: baseUrl,
        file,
        line: lineNum,
        column: colNum,
      });
    } catch {
      continue;
    }
  }

  return locations;
}

async function fetchFileContent(url: string): Promise<string | null> {
  if (sourceCache.has(url)) {
    return sourceCache.get(url) ?? null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'text/plain' },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      sourceCache.set(url, null);
      return null;
    }

    const text = await response.text();
    sourceCache.set(url, text);
    return text;
  } catch {
    sourceCache.set(url, null);
    return null;
  }
}

export async function fetchSourceContext(
  locations: SourceLocation[],
  contextRadius: number = 5,
): Promise<SourceContext[]> {
  const results: SourceContext[] = [];

  for (const loc of locations.slice(0, 2)) {
    const content = await fetchFileContent(loc.url);
    if (!content) continue;

    const lines = content.split('\n');
    const start = Math.max(0, loc.line - contextRadius - 1);
    const end = Math.min(lines.length, loc.line + contextRadius);

    const contextLines = lines
      .slice(start, end)
      .map((line, i) => {
        const lineNum = start + i + 1;
        const marker = lineNum === loc.line ? '>' : ' ';
        const numStr = String(lineNum).padStart(4);
        return `${marker} ${numStr} | ${line}`;
      })
      .join('\n');

    results.push({
      file: loc.file,
      line: loc.line,
      column: loc.column,
      contextLines,
    });
  }

  return results;
}

export async function getSourceContextForIssue(
  issue: DetectedIssue,
): Promise<string> {
  try {
    let locations: SourceLocation[] = [];

    // Try stack trace first
    if (issue.stack) {
      locations = parseStackLocations(issue.stack);
    }

    // Fallback to details.filename
    if (
      locations.length === 0 &&
      issue.details?.filename &&
      typeof issue.details.filename === 'string'
    ) {
      const filename = issue.details.filename;
      const lineno =
        typeof issue.details.lineno === 'number' ? issue.details.lineno : 1;
      const colno =
        typeof issue.details.colno === 'number'
          ? issue.details.colno
          : undefined;

      try {
        const urlObj = new URL(filename);
        locations.push({
          url: filename,
          file: urlObj.pathname.replace(/^\//, ''),
          line: lineno,
          column: colno,
        });
      } catch {
        // not a valid URL, skip
      }
    }

    if (locations.length === 0) return '';

    const contexts = await fetchSourceContext(locations);
    if (contexts.length === 0) return '';

    return contexts
      .map(
        (ctx) =>
          `Source code at ${ctx.file} (line ${ctx.line}):\n\`\`\`tsx\n${ctx.contextLines}\n\`\`\``,
      )
      .join('\n\n');
  } catch {
    return '';
  }
}
