import type { DetectedIssue } from '@devlens/core';

export type DevLensMessage =
  | { type: 'devlens:ready'; sessionId: string }
  | { type: 'devlens:issue'; sessionId: string; payload: DetectedIssue }
  | { type: 'devlens:sync'; sessionId: string; payload: DetectedIssue[] }
  | { type: 'devlens:clear'; sessionId: string }
  | { type: 'devlens:ping'; sessionId: string }
  | { type: 'devlens:pong'; sessionId: string };

const VALID_TYPES = new Set([
  'devlens:ready',
  'devlens:issue',
  'devlens:sync',
  'devlens:clear',
  'devlens:ping',
  'devlens:pong',
]);

export function isDevLensMessage(data: unknown): data is DevLensMessage {
  if (typeof data !== 'object' || data === null) return false;
  const msg = data as Record<string, unknown>;
  return (
    typeof msg.type === 'string' &&
    VALID_TYPES.has(msg.type) &&
    typeof msg.sessionId === 'string'
  );
}

export function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

export function createChannel(sessionId: string): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  try {
    return new BroadcastChannel(`devlens-${sessionId}`);
  } catch {
    return null;
  }
}
