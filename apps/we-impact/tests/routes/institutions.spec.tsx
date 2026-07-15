import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import InstitutionsComponent from '../../app/routes/institutions/Institutions';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <InstitutionsComponent />
    </MemoryRouter>,
  );
}

test('renders both tab triggers', () => {
  renderAt('/institutions');
  expect(screen.getByRole('tab', { name: 'Creation' })).toBeTruthy();
  expect(screen.getByRole('tab', { name: 'List' })).toBeTruthy();
});

test('defaults to the Creation tab when no tab param is present', () => {
  renderAt('/institutions');
  expect(
    screen.getByRole('tab', { name: 'Creation' }).getAttribute('aria-selected'),
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
  // getByText finds elements even when Radix marks the inactive panel hidden
  expect(screen.getByText('Create institution')).toBeTruthy();
  expect(screen.getByText('Institutions list')).toBeTruthy();
});

test('clicking a trigger switches the active tab', async () => {
  const user = userEvent.setup();
  renderAt('/institutions');
  await user.click(screen.getByRole('tab', { name: 'List' }));
  expect(
    screen.getByRole('tab', { name: 'List' }).getAttribute('aria-selected'),
  ).toBe('true');
});
