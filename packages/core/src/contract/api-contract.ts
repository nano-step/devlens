import type { DevLensEngine, DevLensPlugin, DetectedIssue } from '../types';
import type { ContractConfig, APIShape } from './types';
import { inferShape, compareShapes } from './shape-tracker';

const DEFAULT_MAX_SHAPES = 200;

function matchesEndpoint(url: string, patterns: (string | RegExp)[]): boolean {
  return patterns.some((p) =>
    typeof p === 'string'
      ? (p.includes('*') ? new RegExp(p.replace(/\*/g, '.*')).test(url) : url.includes(p))
      : p.test(url),
  );
}

function normalizeUrl(raw: string): string {
  try {
    const url = new URL(raw);
    return url.pathname;
  } catch {
    return raw;
  }
}

export function createApiContractPlugin(
  config: ContractConfig = {},
): DevLensPlugin {
  const learn = config.learn !== false;
  const endpoints = config.endpoints ?? [];
  const ignoreFields = new Set(config.ignoreFields ?? []);
  const maxShapes = config.maxShapes ?? DEFAULT_MAX_SHAPES;
  const shapes = new Map<string, APIShape>();

  let engine: DevLensEngine | null = null;
  let unsubscribe: (() => void) | null = null;

  function shapeKey(method: string, endpoint: string): string {
    return `${method}:${endpoint}`;
  }

  function checkResponse(
    method: string,
    url: string,
    body: unknown,
  ): void {
    if (!engine || !learn) return;
    if (body === null || body === undefined || typeof body !== 'object') return;

    const endpoint = normalizeUrl(url);
    if (endpoints.length > 0 && !matchesEndpoint(endpoint, endpoints)) return;

    const currentFields = inferShape(body, ignoreFields);
    if (Object.keys(currentFields).length === 0) return;

    const key = shapeKey(method, endpoint);
    const existing = shapes.get(key);

    if (!existing) {
      if (shapes.size >= maxShapes) {
        const oldest = Array.from(shapes.entries())
          .sort(([, a], [, b]) => a.lastSeen - b.lastSeen)[0];
        if (oldest) shapes.delete(oldest[0]);
      }

      shapes.set(key, {
        endpoint,
        method,
        fields: currentFields,
        sampleCount: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
      });
      return;
    }

    const violations = compareShapes(
      existing.fields,
      currentFields,
      endpoint,
      method,
    );

    for (const violation of violations) {
      const issue: DetectedIssue = {
        id: `api-contract:${violation.field}:${violation.endpoint}`,
        timestamp: Date.now(),
        severity: 'warn',
        category: 'api-contract',
        message: violation.message,
        path: violation.field,
        source: `${violation.method} ${violation.endpoint}`,
        details: {
          endpoint: violation.endpoint,
          method: violation.method,
          expected: violation.expected,
          received: violation.received,
        },
        suggestion: violation.received === 'missing'
          ? `Field "${violation.field}" was present before but is now missing. Check if the API changed.`
          : `Field "${violation.field}" changed from ${violation.expected} to ${violation.received}. Verify backend response.`,
      };
      engine.report(issue);
    }

    existing.sampleCount++;
    existing.lastSeen = Date.now();
  }

  function onIssue(issue: DetectedIssue): void {
    if (issue.category !== 'network') return;
    if (!issue.details) return;

    const method = (issue.details.method as string) ?? 'GET';
    const url = (issue.details.url as string) ?? '';
    const body = issue.details.responseBody;

    if (url && body !== undefined) {
      checkResponse(method, url, body);
    }
  }

  return {
    name: 'api-contract',
    version: '1.0.0',

    setup(eng: DevLensEngine): void {
      engine = eng;
      unsubscribe = eng.subscribe(onIssue);
    },

    teardown(): void {
      unsubscribe?.();
      unsubscribe = null;
      engine = null;
      shapes.clear();
    },
  };
}

export { type ContractConfig, type APIShape, type ContractViolation } from './types';
