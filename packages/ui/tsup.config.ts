import { defineConfig } from 'tsup';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// Read @devlens/core version at build time to stamp into the panel footer
const coreVersion: string = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return (require('../core/package.json') as { version: string }).version;
  } catch {
    return '';
  }
})();

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  minify: false,
  define: {
    __DEV__: 'true',
    __DEVLENS_VERSION__: JSON.stringify(coreVersion),
  },
});
