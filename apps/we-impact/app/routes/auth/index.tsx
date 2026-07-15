// The /auth route. Wires the presentational AuthComponent to the session layer:
// a successful sign-in calls signIn(), and an already-authenticated visitor is
// bounced back home (so the guard + this route can't ping-pong).

import { Navigate } from 'react-router';
import { useSession } from '../../auth/session-context';
import AuthComponent from './auth';

export default function AuthRoute() {
  const { status, signIn } = useSession();

  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthComponent
      onAuthenticated={(result) =>
        signIn(result.credential, result.profile, result.provider)
      }
    />
  );
}
