import { validate, refresh, logout } from '../../app/api/auth-api';

beforeEach(() => {
  vi.stubEnv('VITE_AUTH_API', 'http://api.test');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function mockFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, ...response });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

test('validate POSTs the credential with credentials:include and returns the body', async () => {
  const fetchMock = mockFetch({
    json: async () => ({ accessToken: 'tok-1', expiresIn: 3600 }),
  });

  const result = await validate('google-jwt', 'google');

  expect(result).toEqual({ accessToken: 'tok-1', expiresIn: 3600 });
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe('http://api.test/validate/oauth');
  expect(init.method).toBe('POST');
  expect(init.credentials).toBe('include');
  expect(JSON.parse(init.body)).toMatchObject({ credential: 'google-jwt' });
});

test('refresh returns null on 401', async () => {
  mockFetch({ ok: false, status: 401 });
  expect(await refresh()).toBeNull();
});

test('refresh returns the new token on success', async () => {
  mockFetch({ json: async () => ({ accessToken: 'tok-2', expiresIn: 60 }) });
  expect(await refresh()).toEqual({ accessToken: 'tok-2', expiresIn: 60 });
});

test('logout POSTs to the logout URL with credentials:include', async () => {
  const fetchMock = mockFetch({});
  await logout();
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe('http://api.test/logout');
  expect(init.credentials).toBe('include');
});
