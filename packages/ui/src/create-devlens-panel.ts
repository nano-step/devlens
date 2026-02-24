import type { Reporter } from '@devlens/core';
import type { PanelConfig, PanelInstance } from './types';
import { createPanel } from './panel';
import { createPanelReporter } from './panel-reporter';

export function createDevLensPanel(config?: PanelConfig): {
  panel: PanelInstance;
  reporter: Reporter;
  destroy: () => void;
} {
  if (typeof document === 'undefined') {
    const noop = (): void => {};
    const noopPanel: PanelInstance = {
      open: noop,
      close: noop,
      toggle: noop,
      addIssue: noop,
      clear: noop,
      getIssues: () => [],
      destroy: noop,
    };
    return {
      panel: noopPanel,
      reporter: { report: noop },
      destroy: noop,
    };
  }

  try {
    if (
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV === 'production'
    ) {
      const noop = (): void => {};
      const noopPanel: PanelInstance = {
        open: noop,
        close: noop,
        toggle: noop,
        addIssue: noop,
        clear: noop,
        getIssues: () => [],
        destroy: noop,
      };
      return {
        panel: noopPanel,
        reporter: { report: noop },
        destroy: noop,
      };
    }
  } catch {
    // process may not exist in browser
  }

  const host = document.createElement('div');
  host.id = 'devlens-ui-root';
  host.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;top:0;left:0;width:100vw;height:100vh;overflow:visible;';
  document.body.appendChild(host);

  const panel = createPanel(host, config);
  const reporter = createPanelReporter(panel);

  function destroy(): void {
    panel.destroy();
    host.remove();
  }

  return { panel, reporter, destroy };
}
