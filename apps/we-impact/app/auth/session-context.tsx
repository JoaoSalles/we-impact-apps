// React bridge over the in-memory session. Restores the session on mount via
// /refresh, exposes signIn/signOut, and reacts to external token clears (e.g.
// from apiFetch's failed refresh) by dropping to anonymous.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  setAccessToken,
  clearAccessToken,
  getAccessToken,
  subscribe,
} from './session';
import { validate, refresh, logout, userMe } from '../api/auth-api';

export type SessionStatus = 'loading' | 'authenticated' | 'anonymous';

export interface Profile {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

interface SessionContextValue {
  status: SessionStatus;
  profile?: Profile;
  signIn: (credential: string, profile?: Profile, provider?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [profile, setProfile] = useState<Profile | undefined>(undefined);

  // Restore the session across reloads: the browser authenticates /refresh with
  // the HttpOnly cookie. Success → authenticated; 401/throw → anonymous.
  useEffect(() => {
    let cancelled = false;
    refresh()
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setAccessToken(result.accessToken, result.expiresIn);
          setStatus('authenticated');
          userMe().then((profile: any) => {
            if (!cancelled) setProfile(profile);
          });
        } else {
          setStatus('anonymous');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('anonymous');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // React to external token clears (e.g. apiFetch dropping the token after a
  // failed refresh): once the token is gone, fall back to anonymous.
  useEffect(() => {
    return subscribe(() => {
      if (getAccessToken() === null) {
        setProfile(undefined);
        setStatus('anonymous');
      }
    });
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      profile,
      async signIn(credential, nextProfile, provider) {
        const { accessToken, expiresIn } = await validate(credential, provider);
        setAccessToken(accessToken, expiresIn);
        setProfile(nextProfile);
        setStatus('authenticated');
      },
      async signOut() {
        try {
          await logout();
        } finally {
          clearAccessToken();
          setProfile(undefined);
          setStatus('anonymous');
        }
      }
    }),
    [status, profile],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
