// Client-side auth guard ("middleware"). In SPA mode the session lives in the
// in-memory React context (see session-context.tsx), so gating happens here on
// render rather than in a React Router loader middleware (which runs outside
// React and would only ever see the pre-restore "loading" state).
//
// While the session is restoring we hold (no redirect, avoids an /auth flash).
// Once anonymous, every non-public route bounces to /auth.

import { Navigate, useLocation, type Location } from 'react-router';
import type { ReactNode } from 'react';
import { useSession } from './session-context';

// Routes reachable while signed out.
const PUBLIC_PATHS = new Set(['/auth']);

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const location: Location = useLocation();
  const isPublic = PUBLIC_PATHS.has(location.pathname);

  if (status === 'loading') {
    return <p>Loading…</p>;
  }

  if (status === 'anonymous' && !isPublic) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
