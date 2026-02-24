import type { DetectedIssue } from '@devlens/core';

const STORAGE_KEY = 'devlens:issues';
const MAX_PERSISTED = 200;

export interface PersistenceManager {
  save(issues: DetectedIssue[]): void;
  load(): DetectedIssue[];
  clear(): void;
}

export function createPersistenceManager(): PersistenceManager {
  function isAvailable(): boolean {
    try {
      const testKey = '__devlens_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  const available = typeof window !== 'undefined' && isAvailable();

  function save(issues: DetectedIssue[]): void {
    if (!available) return;
    try {
      const trimmed = issues.slice(-MAX_PERSISTED);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // quota exceeded or other storage error — silently ignore
    }
  }

  function load(): DetectedIssue[] {
    if (!available) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed as DetectedIssue[];
    } catch {
      return [];
    }
  }

  function clear(): void {
    if (!available) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // silently ignore
    }
  }

  return { save, load, clear };
}
