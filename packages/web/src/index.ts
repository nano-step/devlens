import type { DevLensConfig, DevLensEngine } from '@devlens/core';
import {
  createDetectionEngine,
  createNetworkInterceptor,
  createGlobalCatcher,
} from '@devlens/core';

export interface DevLensWebConfig extends DevLensConfig {}

interface Cleanup {
  uninstall(): void;
}

export interface DevLensWebInstance {
  engine: DevLensEngine;
  destroy(): void;
}

function isProductionEnv(): boolean {
  try {
    return (
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV === 'production'
    );
  } catch {
    return false;
  }
}

export function initDevLens(config: DevLensWebConfig = {}): DevLensWebInstance {
  const engine = createDetectionEngine(config);
  const cleanups: Cleanup[] = [];

  if (config.enabled === false || isProductionEnv()) {
    return {
      engine,
      destroy() {},
    };
  }

  const networkConfig =
    config.modules?.network === false ? undefined : config.modules?.network;
  const catcherConfig =
    config.modules?.catcher === false ? undefined : config.modules?.catcher;

  if (networkConfig !== undefined || config.modules?.network !== false) {
    const network = createNetworkInterceptor(engine, networkConfig);
    network.install();
    cleanups.push(network);
  }

  if (catcherConfig !== undefined || config.modules?.catcher !== false) {
    const catcher = createGlobalCatcher(engine, catcherConfig);
    catcher.install();
    cleanups.push(catcher);
  }

  return {
    engine,
    destroy() {
      for (const cleanup of cleanups) {
        cleanup.uninstall();
      }
      engine.destroy();
    },
  };
}

export type {
  DevLensConfig,
  DetectedIssue,
  DevLensEngine,
  Severity,
  IssueCategory,
} from '@devlens/core';
