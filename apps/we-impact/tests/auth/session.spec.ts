import {
  setAccessToken,
  getAccessToken,
  clearAccessToken,
  subscribe,
} from '../../app/auth/session';

beforeEach(() => {
  clearAccessToken();
});

test('getAccessToken returns the token after setAccessToken', () => {
  setAccessToken('tok-123', 3600);
  expect(getAccessToken()).toBe('tok-123');
});

test('getAccessToken returns null after clearAccessToken', () => {
  setAccessToken('tok-123', 3600);
  clearAccessToken();
  expect(getAccessToken()).toBeNull();
});

test('subscribe listener fires on set and on clear', () => {
  const calls: Array<string | null> = [];
  const unsubscribe = subscribe(() => calls.push(getAccessToken()));

  setAccessToken('tok-123', 3600);
  clearAccessToken();
  unsubscribe();
  setAccessToken('tok-after-unsub', 3600);

  expect(calls).toEqual(['tok-123', null]);
});
