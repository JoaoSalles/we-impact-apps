/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { reactRouter } from '@react-router/dev/vite';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/we-impact',
  server:{
    port: 4200,
    host: 'localhost',
    // Dev-only proxy: the browser calls same-origin `/api/...` on :4200 and Vite
    // forwards to the backend on :8080. This sidesteps CORS entirely in dev and
    // lets HttpOnly cookies (credentials: 'include') work as same-origin.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        // Strip the `/api` prefix so the backend receives its real path,
        // e.g. /api/v1/validate/Oauth -> http://localhost:8080/validate/Oauth.
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Bind any Set-Cookie from the backend to localhost (drop its Domain).
        cookieDomainRewrite: '',
      },
    },
  },
  preview:{
    port: 4300,
    host: 'localhost',
  },
  plugins: [!process.env.VITEST && reactRouter()],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [],
  // },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    name: '@we-impact/we-impact',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    }
  },
}));
