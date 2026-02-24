import type { App, InjectionKey } from 'vue';
import type { DevLensConfig, DevLensEngine } from '@devlens/core';
import {
  createDetectionEngine,
  createNetworkInterceptor,
  createGlobalCatcher,
} from '@devlens/core';

export const DevLensKey: InjectionKey<DevLensEngine> = Symbol('devlens');

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

export interface DevLensPluginOptions extends DevLensConfig {}

export function createDevLensPlugin(options: DevLensPluginOptions = {}) {
  let engine: DevLensEngine | null = null;
  const cleanups: Array<{ uninstall(): void }> = [];

  return {
    install(app: App): void {
      if (options.enabled === false || isProductionEnv()) {
        return;
      }

      engine = createDetectionEngine(options);
      app.provide(DevLensKey, engine);

      const networkConfig =
        options.modules?.network === false ? undefined : options.modules?.network;
      const catcherConfig =
        options.modules?.catcher === false ? undefined : options.modules?.catcher;

      if (networkConfig !== undefined || options.modules?.network !== false) {
        const network = createNetworkInterceptor(engine, networkConfig);
        network.install();
        cleanups.push(network);
      }

      if (catcherConfig !== undefined || options.modules?.catcher !== false) {
        const catcher = createGlobalCatcher(engine, catcherConfig);
        catcher.install();
        cleanups.push(catcher);
      }

      app.config.errorHandler = (err, instance, info) => {
        if (!engine?.isEnabled()) return;

        const error = err instanceof Error ? err : new Error(String(err));
        const componentName =
          (instance?.$options?.name) ??
          (instance?.$options?.__name) ??
          'AnonymousComponent';

        engine.report({
          id: `unhandled-error:vue:${error.message}`,
          timestamp: Date.now(),
          severity: 'error',
          category: 'unhandled-error',
          message: `Vue error in ${componentName}: ${error.message}`,
          details: {
            component: componentName,
            lifecycleHook: info,
          },
          stack: error.stack,
          source: `Vue:${componentName}`,
          suggestion: `Error in ${info} of ${componentName} — check the component logic`,
        });
      };

      app.config.warnHandler = (msg, instance, trace) => {
        if (!engine?.isEnabled()) return;

        const componentName =
          (instance?.$options?.name) ??
          (instance?.$options?.__name) ??
          'AnonymousComponent';

        engine.report({
          id: `unhandled-error:vue-warn:${msg.slice(0, 80)}`,
          timestamp: Date.now(),
          severity: 'warn',
          category: 'unhandled-error',
          message: `Vue warning in ${componentName}: ${msg}`,
          details: {
            component: componentName,
            trace,
          },
          source: `Vue:${componentName}`,
          suggestion: 'Check the Vue warning above — it may indicate a potential issue',
        });
      };
    },

    uninstall(): void {
      for (const cleanup of cleanups) {
        cleanup.uninstall();
      }
      cleanups.length = 0;
      engine = null;
    },

    getEngine(): DevLensEngine | null {
      return engine;
    },
  };
}
