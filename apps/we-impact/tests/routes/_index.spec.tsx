import { createRoutesStub } from 'react-router';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../../app/app';
import { SessionProvider } from '../../app/auth/session-context';

beforeEach(() => {
  // App renders <AuthControls/>, which needs a session; on mount it calls
  // /refresh. Stub it to a 401 so the session settles to anonymous offline.
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('renders loader data', async () => {
  const ReactRouterStub = createRoutesStub([
    {
      path: '/',
      Component: App,
    },
  ]);

  render(
    <SessionProvider>
      <ReactRouterStub />
    </SessionProvider>,
  );

  await waitFor(() => screen.findByText('Hello there,'));
});
