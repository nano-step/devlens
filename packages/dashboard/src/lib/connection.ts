import type { DetectedIssue } from '@devlens/core';
import type { DevLensMessage } from './protocol';
import { isDevLensMessage, createChannel } from './protocol';

export interface ConnectionCallbacks {
  onIssue: (issue: DetectedIssue) => void;
  onSync: (issues: DetectedIssue[]) => void;
  onClear: () => void;
  onConnected: (connected: boolean) => void;
}

export interface DashboardConnection {
  start: () => void;
  stop: () => void;
  send: (message: DevLensMessage) => void;
  sendClear: () => void;
}

/**
 * Dashboard-side connection handler.
 * 
 * The dashboard acts as the RECEIVER:
 * 1. Opens a BroadcastChannel for the given sessionId
 * 2. Listens for postMessage from opener window
 * 3. Sends 'devlens:ready' to announce presence
 * 4. Responds to 'devlens:ping' with 'devlens:pong'
 * 5. Receives issues via 'devlens:issue' and 'devlens:sync'
 */
export function createDashboardConnection(
  sessionId: string,
  callbacks: ConnectionCallbacks,
): DashboardConnection {
  let channel: BroadcastChannel | null = null;
  let messageHandler: ((e: MessageEvent) => void) | null = null;

  function send(message: DevLensMessage): void {
    if (channel) {
      try {
        channel.postMessage(message);
        return;
      } catch {
        // fallback to postMessage
      }
    }
    if (window.opener) {
      (window.opener as Window).postMessage(message, '*');
    }
  }

  function handleMessage(data: unknown): void {
    if (!isDevLensMessage(data) || data.sessionId !== sessionId) return;

    switch (data.type) {
      case 'devlens:issue':
        callbacks.onConnected(true);
        callbacks.onIssue(data.payload);
        break;
      case 'devlens:sync':
        callbacks.onConnected(true);
        callbacks.onSync(data.payload);
        break;
      case 'devlens:clear':
        callbacks.onClear();
        break;
      case 'devlens:ping':
        send({ type: 'devlens:pong', sessionId });
        break;
      case 'devlens:ready':
        // Another instance came online — acknowledge
        callbacks.onConnected(true);
        break;
    }
  }

  function start(): void {
    // BroadcastChannel — works for same-origin tabs
    channel = createChannel(sessionId);
    if (channel) {
      channel.onmessage = (e) => handleMessage(e.data);
    }

    // postMessage — works for popup/opener pattern
    messageHandler = (e: MessageEvent) => handleMessage(e.data);
    window.addEventListener('message', messageHandler);

    // Announce ourselves as ready
    send({ type: 'devlens:ready', sessionId });
  }

  function stop(): void {
    if (channel) {
      channel.close();
      channel = null;
    }
    if (messageHandler) {
      window.removeEventListener('message', messageHandler);
      messageHandler = null;
    }
    callbacks.onConnected(false);
  }

  function sendClear(): void {
    send({ type: 'devlens:clear', sessionId });
  }

  return { start, stop, send, sendClear };
}
