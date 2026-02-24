import type { DetectedIssue, Reporter } from '@devlens/core';
import { generateSessionId } from './protocol';
import { createAdapter } from './adapter';
import { getInspectorHTML } from './inspector-html';

export interface InspectorConfig {
  width?: number;
  height?: number;
  sessionId?: string;
}

export interface InspectorInstance {
  sendIssue(issue: DetectedIssue): void;
  sendClear(): void;
  open(): void;
  close(): void;
  destroy(): void;
  readonly connected: boolean;
  readonly isOpen: boolean;
}

const NOOP_INSTANCE: InspectorInstance = {
  sendIssue: () => {},
  sendClear: () => {},
  open: () => {},
  close: () => {},
  destroy: () => {},
  connected: false,
  isOpen: false,
};

export function createDevLensInspector(config?: InspectorConfig): InspectorInstance {
  if (typeof document === 'undefined') {
    return NOOP_INSTANCE;
  }

  try {
    if (
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV === 'production'
    ) {
      return NOOP_INSTANCE;
    }
  } catch {
    // process may not exist in browser
  }

  const sessionId = config?.sessionId ?? generateSessionId();
  const width = config?.width ?? 1200;
  const height = config?.height ?? 800;
  const adapter = createAdapter(sessionId);

  let inspectorWindow: Window | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  function open(): void {
    if (inspectorWindow && !inspectorWindow.closed) {
      inspectorWindow.focus();
      return;
    }

    const html = getInspectorHTML(sessionId);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    inspectorWindow = window.open(
      url,
      `devlens-inspector-${sessionId}`,
      `width=${width},height=${height},menubar=no,toolbar=no,status=no`,
    );

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    if (inspectorWindow) {
      adapter.start(inspectorWindow);
      startPoll();
    }
  }

  function startPoll(): void {
    if (pollTimer) return;
    pollTimer = setInterval(() => {
      if (inspectorWindow && inspectorWindow.closed) {
        inspectorWindow = null;
        adapter.stop();
        if (pollTimer) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
      }
    }, 500);
  }

  function close(): void {
    if (inspectorWindow && !inspectorWindow.closed) {
      inspectorWindow.close();
    }
    inspectorWindow = null;
    adapter.stop();
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function destroy(): void {
    close();
  }

  return {
    sendIssue: (issue: DetectedIssue) => adapter.sendIssue(issue),
    sendClear: () => adapter.sendClear(),
    open,
    close,
    destroy,
    get connected() { return adapter.connected; },
    get isOpen() { return inspectorWindow !== null && !inspectorWindow.closed; },
  };
}

export function createInspectorReporter(inspector: InspectorInstance): Reporter {
  let opened = false;
  return {
    report(issue: DetectedIssue): void {
      if (!opened) {
        inspector.open();
        opened = true;
      }
      inspector.sendIssue(issue);
    },
  };
}
