import { useCallback, useEffect, useRef, useState } from 'react';
import { providers } from './auth/providers';
import type { AuthHandlers, AuthProvider, AuthResult } from './auth/types';

export interface AuthAppProps {
  /** Called with the provider result (incl. the Google-signed ID token). */
  onAuthenticated?: (result: AuthResult) => void;
}

// Mounts one provider's sign-in UI into a container div. Google renders its
// official button here; the effect runs once per provider, reading the latest
// handlers via a ref so changing callbacks doesn't re-mount the button.
function ProviderSlot({
  provider,
  handlers,
}: {
  provider: AuthProvider;
  handlers: AuthHandlers;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cleanup = provider.mount(el, {
      onResult: (r) => handlersRef.current.onResult(r),
      onError: (e) => handlersRef.current.onError(e),
    });
    return () => {
      if (typeof cleanup === 'function') cleanup();
      el.replaceChildren();
    };
  }, [provider]);

  return <div ref={ref} />;
}

/**
 * The federated auth widget. Lists sign-in providers (Google first) and runs
 * each provider's client-side flow in the browser. Exposed to the host via
 * Module Federation as `auth/AuthApp`.
 */
export function AuthApp({ onAuthenticated }: AuthAppProps) {
  const [error, setError] = useState<string | null>(null);

  const onResult = useCallback(
    (result: AuthResult) => {
      setError(null);
      onAuthenticated?.(result);
    },
    [onAuthenticated],
  );
  const onError = useCallback((e: Error) => setError(e.message), []);

  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 320 }}>
      <h2 style={{ margin: 0 }}>Sign in</h2>
      {providers.map((provider) => (
        <ProviderSlot
          key={provider.id}
          provider={provider}
          handlers={{ onResult, onError }}
        />
      ))}
      {error && <p style={{ color: 'crimson', margin: 0 }}>{error}</p>}
    </div>
  );
}

export default AuthApp;
