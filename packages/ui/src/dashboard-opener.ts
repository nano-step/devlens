import type { Reporter } from '@devlens/core';

/** Configuration for createDashboardOpener */
export interface DashboardOpenerConfig {
  /**
   * URL of the DevLens dashboard to open.
   * Example: `'http://localhost:5173/__devlens__'`
   */
  dashboardUrl: string;
  /**
   * Session ID appended as `?session=<id>`.
   * Auto-generated from timestamp + random if omitted.
   */
  sessionId?: string;
  /**
   * Window target name used by `window.open()`.
   * @default 'devlens-dashboard'
   */
  windowName?: string;
}

/** Instance returned by createDashboardOpener */
export interface DashboardOpenerInstance {
  /** Open the dashboard window (or focus it if already open) */
  open(): void;
  /** Close the dashboard window */
  close(): void;
  /** Clean up (same as close) */
  destroy(): void;
  /** Whether the dashboard window is currently open */
  readonly isOpen: boolean;
  /** The session ID in use */
  readonly sessionId: string;
  /** Full dashboard URL with ?session=<id> */
  readonly dashboardLink: string;
}

const NOOP_OPENER: DashboardOpenerInstance = {
  open: () => {},
  close: () => {},
  destroy: () => {},
  isOpen: false,
  sessionId: '',
  dashboardLink: '',
};

function generateSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Creates a controller that opens the DevLens hosted dashboard in a new browser
 * window/tab and tracks whether that window is still open.
 *
 * SSR-safe and production-safe — returns a noop instance when `document` is
 * unavailable or `NODE_ENV === 'production'`.
 *
 * @example
 * ```ts
 * const opener = createDashboardOpener({
 *   dashboardUrl: 'http://localhost:5173/__devlens__',
 * });
 * opener.open(); // opens dashboard, appends ?session=<id>
 * ```
 */
export function createDashboardOpener(
  config: DashboardOpenerConfig,
): DashboardOpenerInstance {
  if (typeof document === 'undefined') {
    return NOOP_OPENER;
  }

  try {
    if (
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV === 'production'
    ) {
      return NOOP_OPENER;
    }
  } catch {
    // process may not exist in the browser
  }

  const sessionId = config.sessionId ?? generateSessionId();
  const windowName = config.windowName ?? 'devlens-dashboard';
  const base = config.dashboardUrl.replace(/\/$/, '');
  const dashboardLink = `${base}?session=${sessionId}`;

  let win: Window | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  function startPoll(): void {
    if (pollTimer !== null) return;
    pollTimer = setInterval(() => {
      if (win && win.closed) {
        win = null;
        if (pollTimer !== null) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
      }
    }, 500);
  }

  function open(): void {
    if (win && !win.closed) {
      win.focus();
      return;
    }
    win = window.open(dashboardLink, windowName);
    if (win) {
      startPoll();
    }
  }

  function close(): void {
    if (win && !win.closed) {
      win.close();
    }
    win = null;
    if (pollTimer !== null) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  return {
    open,
    close,
    destroy: close,
    get isOpen() {
      return win !== null && !win.closed;
    },
    sessionId,
    dashboardLink,
  };
}

/**
 * Creates a `Reporter` adapter that automatically opens the DevLens dashboard
 * the first time an issue is detected.
 *
 * @example
 * ```ts
 * const opener = createDashboardOpener({ dashboardUrl: 'http://localhost:5173/__devlens__' });
 * const engine = createDetectionEngine({ reporter: createDashboardReporter(opener) });
 * ```
 */
export function createDashboardReporter(
  opener: DashboardOpenerInstance,
): Reporter {
  let opened = false;
  return {
    report(): void {
      if (!opened) {
        opener.open();
        opened = true;
      }
    },
  };
}
