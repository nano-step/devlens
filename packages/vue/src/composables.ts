import { inject, ref, watch, type Ref } from 'vue';
import type { DevLensEngine, DetectedIssue } from '@devlens/core';
import { createDataGuardian } from '@devlens/core';
import { DevLensKey } from './plugin';

export function useDevLens(): DevLensEngine | null {
  return inject(DevLensKey, null);
}

export function useGuardedRef<T extends object>(
  initialValue: T,
  label?: string,
): Ref<T> {
  const engine = useDevLens();
  const source = ref(initialValue) as Ref<T>;

  if (!engine || !engine.isEnabled()) {
    return source;
  }

  const guardian = createDataGuardian(engine);
  const guarded = ref(guardian.guard(source.value, label)) as Ref<T>;

  watch(source, (newVal) => {
    if (newVal === null || newVal === undefined || typeof newVal !== 'object') {
      guarded.value = newVal;
      return;
    }
    const freshGuardian = createDataGuardian(engine);
    guarded.value = freshGuardian.guard(newVal, label);
  }, { deep: true });

  return guarded;
}

export function useGuardedWatch(
  data: Record<string, unknown>,
  label?: string,
): void {
  const engine = useDevLens();
  if (!engine || !engine.isEnabled()) return;

  const resolvedLabel = label ?? 'useGuardedWatch';

  const dataRef = ref(data);

  watch(dataRef, (current) => {
    for (const [key, value] of Object.entries(current)) {
      if (value === null || value === undefined) {
        const issue: DetectedIssue = {
          id: `render-data:${resolvedLabel}:${key}`,
          timestamp: Date.now(),
          severity: 'warn',
          category: 'render-data',
          message: `"${key}" is ${value === null ? 'null' : 'undefined'} in ${resolvedLabel}`,
          path: `${resolvedLabel}.${key}`,
          foundValue: value,
          expectedType: 'non-nullish value',
          source: resolvedLabel,
          suggestion: `"${key}" is ${value === null ? 'null' : 'undefined'} — check data loading in ${resolvedLabel}`,
        };
        engine.report(issue);
      }
    }
  }, { immediate: true, deep: true });
}
