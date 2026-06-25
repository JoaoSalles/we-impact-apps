import { init, loadRemote } from '@module-federation/runtime';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

// We deliberately use the Module Federation *runtime* API instead of the
// @module-federation/vite build plugin on the host: that plugin rewrites
// module imports in a way that conflicts with React Router's route-module
// pipeline (routes resolve to an empty component). The runtime API leaves
// Vite/React Router untouched and loads the remote purely at runtime.
//
// `lib: () => React` hands the host's own React/ReactDOM into the shared scope
// so the federated remote renders with the *same* React instance — required
// for hooks and context to work across the boundary.

const AUTH_REMOTE_ENTRY =
  import.meta.env.VITE_AUTH_REMOTE_ENTRY ??
  'http://localhost:4201/remoteEntry.js';

let initialized = false;

function ensureInit() {
  if (initialized) return;
  initialized = true;
  init({
    name: 'we_impact_host',
    remotes: [
      {
        name: 'auth',
        // `entry` points at the remote's ESM container served by the auth app.
        // `type: 'esm'` makes the runtime load it via ESM import rather than a
        // classic <script> (which fails with "Cannot use import statement…").
        type: 'esm',
        entry: AUTH_REMOTE_ENTRY,
      },
    ],
    shared: {
      react: {
        version: React.version,
        lib: () => React,
        shareConfig: { singleton: true, requiredVersion: false },
      },
      'react-dom': {
        version: ReactDOM.version,
        lib: () => ReactDOM,
        shareConfig: { singleton: true, requiredVersion: false },
      },
    },
  });
}

/**
 * Load an exposed module from a federated remote, initializing the MF runtime
 * on first use. `T` is the shape of the remote module (e.g. `{ default: ... }`).
 */
export async function loadRemoteModule<T>(id: string): Promise<T> {
  ensureInit();
  const mod = await loadRemote<T>(id);
  if (!mod) throw new Error(`Failed to load remote module: ${id}`);
  return mod;
}
