import { apiFetch } from '../../app/api/api';
import {
  setAccessToken,
  getAccessToken,
  clearAccessToken,
} from '../../app/auth/session';

beforeEach(() => {
  clearAccessToken();
  vi.stubEnv('VITE_REFRESH_TOKEN', 'http://api.test/refresh');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

test('attaches Authorization: Bearer and credentials:include when a token exists', async () => {
  setAccessToken('tok-1', 3600);
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
  vi.stubGlobal('fetch', fetchMock);

  await apiFetch('http://api.test/data');

  const [, init] = fetchMock.mock.calls[0];
  expect(new Headers(init.headers).get('Authorization')).toBe('Bearer tok-1');
  expect(init.credentials).toBe('include');
});

test('sends no Authorization header when there is no token', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
  vi.stubGlobal('fetch', fetchMock);

  await apiFetch('http://api.test/data');

  const [, init] = fetchMock.mock.calls[0];
  expect(new Headers(init.headers).get('Authorization')).toBeNull();
});

test('on 401, refreshes once, stores the new token, and retries the request', async () => {
  setAccessToken('stale', 3600);
  const fetchMock = vi
    .fn()
    // 1st: original request → 401
    .mockResolvedValueOnce({ ok: false, status: 401 })
    // 2nd: refresh → new token
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ accessToken: 'fresh', expiresIn: 3600 }),
    })
    // 3rd: retried original request → 200
    .mockResolvedValueOnce({ ok: true, status: 200 });
  vi.stubGlobal('fetch', fetchMock);

  const response = await apiFetch('http://api.test/data');

  expect(response.status).toBe(200);
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(getAccessToken()).toBe('fresh');
  // retried request carries the fresh bearer
  const [, retryInit] = fetchMock.mock.calls[2];
  expect(new Headers(retryInit.headers).get('Authorization')).toBe('Bearer fresh');
});

test('on 401 with failed refresh, clears the token and returns the 401', async () => {
  setAccessToken('stale', 3600);
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({ ok: false, status: 401 })
    // refresh → 401 (cookie gone)
    .mockResolvedValueOnce({ ok: false, status: 401 });
  vi.stubGlobal('fetch', fetchMock);

  const response = await apiFetch('http://api.test/data');

  expect(response.status).toBe(401);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(getAccessToken()).toBeNull();
});
