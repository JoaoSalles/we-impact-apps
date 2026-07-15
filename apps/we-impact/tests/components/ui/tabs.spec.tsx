import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../app/components/ui/tabs';

function renderTabs() {
  return render(
    <Tabs defaultValue="a">
      <TabsList>
        <TabsTrigger value="a">Alpha</TabsTrigger>
        <TabsTrigger value="b">Bravo</TabsTrigger>
      </TabsList>
      <TabsContent value="a">Panel A</TabsContent>
      <TabsContent value="b">Panel B</TabsContent>
    </Tabs>,
  );
}

test('renders triggers and the default panel, switches on click', async () => {
  const user = userEvent.setup();
  renderTabs();
  expect(screen.getByRole('tab', { name: 'Alpha' }).getAttribute('aria-selected')).toBe('true');
  expect(screen.getByText('Panel A')).toBeTruthy();

  await user.click(screen.getByRole('tab', { name: 'Bravo' }));
  expect(screen.getByRole('tab', { name: 'Bravo' }).getAttribute('aria-selected')).toBe('true');
  expect(screen.getByText('Panel B')).toBeTruthy();
});
