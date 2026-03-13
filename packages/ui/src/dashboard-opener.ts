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

const STORAGE_KEY = 'devlens-dashboard-open';

function generateSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Check if a dashboard window is already open by trying to reference it.
 * Uses sessionStorage to persist knowledge across page refreshes.
 */
function isDashboardAlreadyOpen(windowName: string): boolean {
  try {
    // Try to reference the existing window by name
    const existing = window.open('', windowName);
    if (existing && !existing.closed && existing.location.href !== 'about:blank') {
      // Window exists and has navigated — dashboard is open
      return true;
    }
  } catch {
    // Cross-origin or popup blocked — check sessionStorage fallback
  }

  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function persistOpenState(isOpen: boolean): void {
  try {
    if (isOpen) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // sessionStorage unavailable
  }
}

/**
 * Creates a controller that opens the DevLens hosted dashboard in a new browser
 * window/tab and tracks whether that window is still open.
 *
 * **Singleton behavior**: Only one dashboard window is allowed at a time.
 * If a dashboard is already open (even from a previous page load), calling
 * `open()` will focus it instead of opening a new one.
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
        persistOpenState(false);
        if (pollTimer !== null) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
      }
    }, 500);
  }

  function open(): void {
    // If we already have a live reference, just focus
    if (win && !win.closed) {
      win.focus();
      return;
    }

    // Open (or reuse) the named window — browsers reuse windows with the same name
    win = window.open(dashboardLink, windowName);
    if (win) {
      persistOpenState(true);
      startPoll();
    }
  }

  function close(): void {
    if (win && !win.closed) {
      win.close();
    }
    win = null;
    persistOpenState(false);
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
      if (win !== null && !win.closed) return true;
      // Fallback: check sessionStorage for cross-refresh awareness
      return isDashboardAlreadyOpen(windowName);
    },
    sessionId,
    dashboardLink,
  };
}

/**
 * Creates a `Reporter` adapter that automatically opens the DevLens dashboard
 * the first time an issue is detected. Respects singleton — if a dashboard
 * window is already open (even from a previous page load), it will NOT open
 * another one.
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
  let triggered = false;
  return {
    report(): void {
      if (!triggered) {
        triggered = true;
        // Only open if no dashboard is currently open
        if (!opener.isOpen) {
          opener.open();
        }
      }
    },
  };
}
