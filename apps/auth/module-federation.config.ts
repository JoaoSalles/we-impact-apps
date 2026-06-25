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
});
