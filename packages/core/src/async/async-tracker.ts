import type { DevLensEngine, DevLensPlugin, DetectedIssue } from '../types';
import type { AsyncTrackerConfig, AsyncOperation } from './types';

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_TRACKED = 500;

export function createAsyncTrackerPlugin(
  config: AsyncTrackerConfig = {},
): DevLensPlugin {
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const detectDuplicates = config.detectDuplicateRequests !== false;
  const maxTracked = config.maxTracked ?? DEFAULT_MAX_TRACKED;

  let engine: DevLensEngine | null = null;
  const operations = new Map<string, AsyncOperation>();
  const pendingUrls = new Map<string, number>();
  let checkInterval: ReturnType<typeof setInterval> | null = null;
  let originalFetch: typeof globalThis.fetch | null = null;

  function generateId(): string {
    return `async_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function trackOperation(label: string): string {
    const id = generateId();
    const op: AsyncOperation = {
      id,
      label,
      startTime: Date.now(),
      status: 'pending',
    };
    operations.set(id, op);

    if (operations.size > maxTracked) {
      const oldest = operations.keys().next().value;
      if (oldest) operations.delete(oldest);
    }

    return id;
  }

  function resolveOperation(id: string): void {
    const op = operations.get(id);
    if (op && op.status === 'pending') {
      op.status = 'resolved';
      op.endTime = Date.now();
    }
  }

  function rejectOperation(id: string, error: string): void {
    const op = operations.get(id);
    if (op && op.status === 'pending') {
      op.status = 'rejected';
      op.endTime = Date.now();
      op.error = error;
    }
  }

  function checkTimeouts(): void {
    if (!engine) return;
    const now = Date.now();

    for (const [id, op] of operations) {
      if (op.status !== 'pending') continue;
      if (now - op.startTime > timeoutMs) {
        op.status = 'timed-out';
        op.endTime = now;

        const issue: DetectedIssue = {
          id: `async-timeout:${id}`,
          timestamp: now,
          severity: 'warn',
          category: 'unhandled-rejection',
          message: `Async operation "${op.label}" pending for ${Math.round((now - op.startTime) / 1000)}s — possible hung promise`,
          source: op.label,
          details: {
            operationId: id,
            startTime: op.startTime,
            elapsedMs: now - op.startTime,
          },
          suggestion: `Check if "${op.label}" is awaited properly and the target service is responding.`,
        };
        engine.report(issue);
      }
    }
  }

  function wrapFetch(): void {
    if (typeof globalThis.fetch !== 'function') return;
    originalFetch = globalThis.fetch;

    globalThis.fetch = function wrappedFetch(
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method?.toUpperCase() ?? 'GET';
      const label = `fetch ${method} ${url}`;

      if (detectDuplicates && engine) {
        const urlKey = `${method}:${url}`;
        const count = (pendingUrls.get(urlKey) ?? 0) + 1;
        pendingUrls.set(urlKey, count);

        if (count > 1) {
          const issue: DetectedIssue = {
            id: `async-duplicate:${urlKey}:${Date.now()}`,
            timestamp: Date.now(),
            severity: 'info',
            category: 'network',
            message: `Duplicate concurrent request: ${method} ${url} (${count} in-flight)`,
            source: 'AsyncTracker',
            details: { url, method, concurrentCount: count },
            suggestion: 'Consider debouncing or deduplicating this request.',
          };
          engine.report(issue);
        }
      }

      const opId = trackOperation(label);

      return originalFetch!.call(globalThis, input, init).then(
        (response) => {
          resolveOperation(opId);
          if (detectDuplicates) {
            const urlKey = `${method}:${url}`;
            const c = pendingUrls.get(urlKey);
            if (c !== undefined) {
              if (c <= 1) pendingUrls.delete(urlKey);
              else pendingUrls.set(urlKey, c - 1);
            }
          }
          return response;
        },
        (error: unknown) => {
          const msg = error instanceof Error ? error.message : String(error);
          rejectOperation(opId, msg);
          if (detectDuplicates) {
            const urlKey = `${method}:${url}`;
            const c = pendingUrls.get(urlKey);
            if (c !== undefined) {
              if (c <= 1) pendingUrls.delete(urlKey);
              else pendingUrls.set(urlKey, c - 1);
            }
          }
          throw error;
        },
      );
    };
  }

  function restoreFetch(): void {
    if (originalFetch) {
      globalThis.fetch = originalFetch;
      originalFetch = null;
    }
  }

  return {
    name: 'async-tracker',
    version: '1.0.0',

    setup(eng: DevLensEngine): void {
      engine = eng;
      wrapFetch();
      checkInterval = setInterval(checkTimeouts, 5000);
    },

    teardown(): void {
      restoreFetch();
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
      operations.clear();
      pendingUrls.clear();
      engine = null;
    },
  };
}

export { type AsyncTrackerConfig, type AsyncOperation } from './types';
