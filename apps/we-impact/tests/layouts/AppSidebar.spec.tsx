import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { SidebarProvider } from '../../app/components/ui/sidebar';
import { AppSidebar } from '../../app/layouts/AppSidebar';

const signOut = vi.fn();

vi.mock('../../app/auth/session-context', () => ({
  useSession: () => ({
    status: 'authenticated',
    profile: { sub: 'u1', name: 'Ada Lovelace' },
    signIn: vi.fn(),
    signOut,
  }),
}));

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
});

beforeEach(() => {
  signOut.mockClear();
});

function renderSidebar() {
  return render(
    <MemoryRouter>
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    </MemoryRouter>,
  );
}

test('renders nav items and the session display name', () => {
  renderSidebar();
  expect(screen.getByText('Home')).toBeTruthy();
  expect(screen.getByText('Institutions')).toBeTruthy();
  expect(screen.getByText('Ada Lovelace')).toBeTruthy();
});

test('sign-out control calls session.signOut', () => {
  renderSidebar();
  fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
  expect(signOut).toHaveBeenCalledTimes(1);
});
