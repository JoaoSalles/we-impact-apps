import type { AuthProvider, GoogleIdTokenClaims } from './types';

const GSI_SRC = 'https://accounts.google.com/gsi/client';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

let gsiPromise: Promise<void> | null = null;

// Inject the Google Identity Services script once and resolve when ready.
function loadGsi(): Promise<void> {
  gsiPromise ??= new Promise<void>((resolve, reject) => {
    if (typeof window !== 'undefined' && 'google' in window) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
  return gsiPromise;
}

// Decode the JWT payload for DISPLAY ONLY — the signature is NOT verified here.
// The backend must verify the token before trusting any of these claims.
function decodeIdToken(jwt: string): GoogleIdTokenClaims | undefined {
  try {
    const payload = jwt.split('.')[1];
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(b64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json) as GoogleIdTokenClaims;
  } catch {
    return undefined;
  }
}

/**
 * Google "Sign in with Google" provider. Renders Google's official button; on
 * success Google returns a signed ID token (JWT) via the callback. We hand that
 * token up unchanged so the host can POST it to a backend for verification.
 *
 * Uses `google.accounts.id` (authentication / ID token) rather than the OAuth
 * token client (authorization / access token): only the signed ID token can be
 * verified server-side to prove who the user is.
 */
export const googleProvider: AuthProvider = {
  id: 'google',
  label: 'Continue with Google',
  mount(container, { onResult, onError }) {
    if (!CLIENT_ID) {
      onError(new Error('VITE_GOOGLE_CLIENT_ID is not set'));
      return;
    }
    let cancelled = false;
    loadGsi()
      .then(() => {
        if (cancelled) return;
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          ux_mode: 'popup',
          auto_select: false,
          callback: (resp) => {
            onResult({
              provider: 'google',
              credential: resp.credential,
              profile: decodeIdToken(resp.credential),
            });
          },
        });
        google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        });
      })
      .catch((e) => onError(e instanceof Error ? e : new Error(String(e))));

    return () => {
      cancelled = true;
    };
  },
};
