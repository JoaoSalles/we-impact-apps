/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { federation } from '@module-federation/vite';
import mfConfig from './module-federation.config';

// The auth app is a Module Federation *remote*. It runs on its own port and
// exposes `./AuthApp`; the host (we-impact) loads it at runtime via the
// remoteEntry.js served from `origin` below.
const PORT = 4201;
const origin = `http://localhost:${PORT}`;

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/auth',
  base: `${origin}/`,
  server: {
    port: PORT,
    host: 'localhost',
    origin,
    // The host dev server loads remote chunks cross-origin.
    cors: true,
  },
  preview: {
    port: PORT,
    host: 'localhost',
  },
  plugins: [
    react(),
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']),
    federation(mfConfig),
  ],
  build: {
    outDir: '../../dist/apps/auth',
    emptyOutDir: true,
    reportCompressedSize: true,
    // Module Federation emits top-level await; chrome89 target supports it.
    target: 'chrome89',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    name: 'auth',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/auth',
      provider: 'v8' as const,
    },
  },
}));
