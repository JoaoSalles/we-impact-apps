import { lazy, Suspense, type ComponentType } from 'react';
import { loadRemoteModule } from './mf-runtime';

// Mirrors AuthResult exposed by apps/auth/src/auth/types.ts.
export interface AuthResult {
  provider: string;
  /** Google-signed ID token (JWT) — send to the backend for verification. */
  credential: string;
  /** Unverified claims decoded client-side, for display only. */
  profile?: { sub: string; email?: string; name?: string; picture?: string };
}

interface AuthAppProps {
  onAuthenticated?: (result: AuthResult) => void;
}

// Lazily pull the federated auth widget from the `auth` remote via the MF
// runtime. The remote's JS is only fetched when this component first renders,
// so the auth bundle stays out of we-impact's main entry chunk.
const AuthApp = lazy(() =>
  loadRemoteModule<{ default: ComponentType<AuthAppProps> }>('auth/AuthApp'),
);

// The widget no longer talks to the backend itself — it forwards the Google
// result up via onAuthenticated. The `validate` call lives in auth-api.ts and
// is invoked by the session layer's signIn (see app/auth/session-context.tsx).
export function AuthWidget({ onAuthenticated }: AuthAppProps) {
  return (
    <Suspense fallback={<p>Loading sign-in…</p>}>
      <AuthApp onAuthenticated={onAuthenticated} />
    </Suspense>
  );
}
