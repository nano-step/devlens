import type { DetectedIssue } from '@devlens/core';
import type { DevLensMessage } from './protocol';
import { isDevLensMessage, createChannel } from './protocol';

const MAX_BUFFER = 1000;
const PING_INTERVAL = 3000;
const PONG_TIMEOUT = 5000;

export interface InspectorAdapter {
  send(message: DevLensMessage): void;
  start(targetWindow: Window): void;
  stop(): void;
  sendIssue(issue: DetectedIssue): void;
  sendClear(): void;
  readonly connected: boolean;
}

export function createAdapter(sessionId: string): InspectorAdapter {
  let channel = createChannel(sessionId);
  let targetWindow: Window | null = null;
  let connected = false;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let pongTimer: ReturnType<typeof setTimeout> | null = null;
  const buffer: DetectedIssue[] = [];

  function send(message: DevLensMessage): void {
    if (channel) {
      try {
        channel.postMessage(message);
        return;
      } catch {
        // fallback to postMessage
      }
    }
    if (targetWindow && !targetWindow.closed) {
      targetWindow.postMessage(message, '*');
    }
  }

  function handleMessage(data: unknown): void {
    if (!isDevLensMessage(data) || data.sessionId !== sessionId) return;

    if (data.type === 'devlens:ready') {
      connected = true;
      if (buffer.length > 0) {
        send({ type: 'devlens:sync', sessionId, payload: [...buffer] });
      }
    }

    if (data.type === 'devlens:pong') {
      if (pongTimer) {
        clearTimeout(pongTimer);
        pongTimer = null;
      }
    }
  }

  function startPing(): void {
    if (pingTimer) return;
    pingTimer = setInterval(() => {
      if (!connected) return;
      send({ type: 'devlens:ping', sessionId });
      pongTimer = setTimeout(() => {
        connected = false;
      }, PONG_TIMEOUT);
    }, PING_INTERVAL);
  }

  function start(win: Window): void {
    targetWindow = win;

    if (channel) {
      channel.onmessage = (e) => handleMessage(e.data);
    }

    window.addEventListener('message', (e) => {
      handleMessage(e.data);
    });

    startPing();
  }

  function stop(): void {
    connected = false;
    if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
    if (pongTimer) { clearTimeout(pongTimer); pongTimer = null; }
    if (channel) { channel.close(); channel = null; }
    targetWindow = null;
  }

  function sendIssue(issue: DetectedIssue): void {
    buffer.push(issue);
    if (buffer.length > MAX_BUFFER) {
      buffer.splice(0, buffer.length - MAX_BUFFER);
    }

    if (connected) {
      send({ type: 'devlens:issue', sessionId, payload: issue });
    }
  }

  function sendClear(): void {
    buffer.length = 0;
    send({ type: 'devlens:clear', sessionId });
  }

  return {
    send,
    start,
    stop,
    sendIssue,
    sendClear,
    get connected() { return connected; },
  };
}
