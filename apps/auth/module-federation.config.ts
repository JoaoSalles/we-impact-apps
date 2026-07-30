import { createModuleFederationConfig } from '@module-federation/vite';

export default createModuleFederationConfig({
  name: 'auth',
  // Emit a mf-manifest.json so the host can discover exposes/shared at runtime.
  manifest: true,
  filename: 'remoteEntry.js',
  exposes: {
    './AuthApp': './src/AuthApp.tsx',
  },
  // react / react-dom must be singletons so the remote and host share one
  // React instance (hooks/context break otherwise).
  shared: {
    'react': { singleton: true, requiredVersion: '*' },
    'react-dom': { singleton: true, requiredVersion: '*' },
  },
  // tsconfig.json is Nx's solution-style root config (lib: es2022, no DOM).
  // The DOM lib the exposed AuthApp needs only lives in tsconfig.app.json,
  // so point the DTS generator there or it fails on window/document/atob.
  dts: {
    tsConfigPath: './tsconfig.app.json',
  },
});
