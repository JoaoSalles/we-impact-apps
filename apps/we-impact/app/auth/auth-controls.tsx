// Gates the sign-in UI on session status: shows the widget while anonymous,
// a greeting + Sign out while authenticated.

import { AuthWidget } from '../auth-widget';
import { useSession } from './session-context';

export function AuthControls() {
  const { status, profile, signIn, signOut } = useSession();

  if (status === 'loading') {
    return <p>Loading…</p>;
  }

  if (status === 'authenticated') {
    const who = profile?.name ?? profile?.email;
    return (
      <div>
        <span>Signed in{who ? ` as ${who}` : ''}</span>{' '}
        <button type="button" onClick={() => signOut()}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <AuthWidget
      onAuthenticated={(result) => {
        signIn(result.credential, result.profile, result.provider)
      }}
    />
  );
}
