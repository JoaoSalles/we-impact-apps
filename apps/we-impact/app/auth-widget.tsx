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

export function AuthWidget() {
  const validateURL = import.meta.env.VITE_VALIDATE_CREDENTIAL ?? '';
  return (
    <Suspense fallback={<p>Loading sign-in…</p>}>
      <AuthApp
        onAuthenticated={async (result) => {
          // Send the Google-signed ID token to YOUR backend. The backend must
          // verify the JWT signature (Google's public keys) + aud/iss/exp,
          // then issue its own session. Do NOT trust result.profile here.
            const credentials = await fetch(validateURL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential: result.credential }),
            });
          console.log('google id token (send to backend):', result);
          console.log('return from backend:', credentials);
        }}
      />
    </Suspense>
  );
}
