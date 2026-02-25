import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // Use relative paths so dashboard works when served at any base path
  // (e.g. /__devlens__/ via the Vite plugin)
  base: './',
  resolve: {
    alias: {
      '@devlens/core': path.resolve(__dirname, '../core/src/index.ts'),
    },
  },
  server: {
    port: 5174,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
