let accessToken: string | null = null;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

// expiresIn is accepted for forward-compatibility with proactive refresh, but
// nothing reads it yet — refresh is reactive to 401 (see app/auth/api.ts).
export function setAccessToken(token: string, _expiresIn: number): void {
  accessToken = token;
  notify();
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken(): void {
  accessToken = null;
  notify();
}

// Subscribe to token changes. Lets the React layer (SessionProvider) react to
// external clears — e.g. apiFetch dropping the token after a failed refresh —
// and fall back to anonymous. Returns an unsubscribe function.
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

