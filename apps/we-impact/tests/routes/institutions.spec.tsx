import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import InstitutionsComponent from '../../app/routes/institutions/Institutions';

vi.mock('../../app/api/institution-api', () => ({
  listInstitutions: vi.fn().mockResolvedValue({
    items: [],
    pageNumber: 0,
    pageSize: 20,
    hasNext: false,
  }),
  createInstitution: vi.fn(),
}));

function renderAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <InstitutionsComponent />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

test('renders both tab triggers', () => {
  renderAt('/institutions');
  expect(screen.getByRole('tab', { name: 'Creation' })).toBeTruthy();
  expect(screen.getByRole('tab', { name: 'List' })).toBeTruthy();
});

test('defaults to the List tab when no tab param is present', () => {
  renderAt('/institutions');
  expect(
    screen.getByRole('tab', { name: 'List' }).getAttribute('aria-selected'),
  ).toBe('true');
});

test('?tab=list selects the List tab', () => {
  renderAt('/institutions?tab=list');
  expect(
    screen.getByRole('tab', { name: 'List' }).getAttribute('aria-selected'),
  ).toBe('true');
});

test('both panels stay mounted so their state is preserved (forceMount)', () => {
  renderAt('/institutions?tab=list');
  // Both queries find elements even when Radix marks the inactive panel hidden:
  // "Create institution" is unique to the create panel, the Next button to the list panel.
  expect(screen.getByText('Create institution')).toBeTruthy();
  expect(screen.getByRole('button', { name: /next/i })).toBeTruthy();
});

test('clicking a trigger switches the active tab', async () => {
  const user = userEvent.setup();
  renderAt('/institutions');
  await user.click(screen.getByRole('tab', { name: 'List' }));
  expect(
    screen.getByRole('tab', { name: 'List' }).getAttribute('aria-selected'),
  ).toBe('true');
});
