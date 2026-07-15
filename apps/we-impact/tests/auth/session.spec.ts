import {
  setAccessToken,
  getAccessToken,
  clearAccessToken,
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
