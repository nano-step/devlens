import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import sirv from 'sirv';

export interface DevLensPluginOptions {
  /**
   * Base path for the dashboard.
   * @default '/__devlens__'
   */
  base?: string;
}

const _dirname = typeof __dirname !== 'undefined'
  ? __dirname
  : dirname(fileURLToPath(import.meta.url));

// Pre-built dashboard client lives in ../client (relative to dist/)
const DIR_CLIENT = resolve(_dirname, '../client');

export default function devlens(options: DevLensPluginOptions = {}): Plugin {
  const basePath = options.base ?? '/__devlens__';
  let config: ResolvedConfig;

  return {
    name: 'devlens',
    apply: 'serve', // dev only

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    configureServer(server: ViteDevServer) {
      const base = config.base || '/';
      const dashboardPath = `${base}${basePath.replace(/^\//, '')}`;

      // Serve pre-built dashboard static files
      server.middlewares.use(dashboardPath, sirv(DIR_CLIENT, {
        single: true,
        dev: true,
      }));

      // Print dashboard URL alongside Vite's dev server URLs
      const _print = server.printUrls;
      server.printUrls = () => {
        _print();
        const colorUrl = `\x1b[36m${dashboardPath}\x1b[0m`;
        console.log(`  \x1b[32m➜\x1b[0m  \x1b[1mDevLens\x1b[0m: ${colorUrl}`);
      };
    },
  };
}

export { devlens };
