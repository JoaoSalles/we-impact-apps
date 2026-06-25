import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { SessionProvider, useSession } from '../../app/auth/session-context';
import { getAccessToken, clearAccessToken } from '../../app/auth/session';

beforeEach(() => {
  clearAccessToken();
  vi.stubEnv('VITE_VALIDATE_CREDENTIAL', 'http://api.test/validate');
  vi.stubEnv('VITE_REFRESH_TOKEN', 'http://api.test/refresh');
  vi.stubEnv('VITE_LOGOUT', 'http://api.test/logout');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function Probe() {
  const { status, signIn, signOut } = useSession();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <button onClick={() => signIn('cred', { sub: 'u1' })}>sign in</button>
      <button onClick={() => signOut()}>sign out</button>
    </div>
  );
}

function renderProbe() {
  return render(
    <SessionProvider>
      <Probe />
    </SessionProvider>,
  );
}

const status = () => screen.getByTestId('status').textContent;

test('restores an authenticated session on mount when refresh returns a token', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ accessToken: 'restored', expiresIn: 3600 }),
    }),
  );

  renderProbe();

  await waitFor(() => expect(status()).toBe('authenticated'));
  expect(getAccessToken()).toBe('restored');
});

test('becomes anonymous on mount when refresh returns 401', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));

  renderProbe();

  await waitFor(() => expect(status()).toBe('anonymous'));
  expect(getAccessToken()).toBeNull();
});

test('signIn validates the credential and becomes authenticated', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({ ok: false, status: 401 })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ accessToken: 'signed-in', expiresIn: 3600 }),
    });
  vi.stubGlobal('fetch', fetchMock);

  renderProbe();
  await waitFor(() => expect(status()).toBe('anonymous'));

  fireEvent.click(screen.getByText('sign in'));

  await waitFor(() => expect(status()).toBe('authenticated'));
  expect(getAccessToken()).toBe('signed-in');
});

test('an external clearAccessToken drops the session to anonymous', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ accessToken: 'restored', expiresIn: 3600 }),
    }),
  );

  renderProbe();
  await waitFor(() => expect(status()).toBe('authenticated'));

  act(() => clearAccessToken());

  await waitFor(() => expect(status()).toBe('anonymous'));
});
