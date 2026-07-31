import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useFilterState } from './use-filter-state';

type Filters = Record<string, string>;

function Harness({
  initialFilters,
  debounceMs,
}: {
  initialFilters: Filters;
  debounceMs?: number;
}) {
  const { filters, updateFilter, setFilters, clearFilters } = useFilterState<Filters>({
    initialFilters,
    debounceMs,
  });

  return (
    <div data-testid="harness">
      <span data-testid="filters">{JSON.stringify(filters)}</span>
      <button
        data-testid="update-status"
        onClick={() => updateFilter('status', 'active')}
      >
        Set status to active
      </button>
      <button
        data-testid="update-search"
        onClick={() => updateFilter('search', 'hello')}
      >
        Set search to hello
      </button>
      <button
        data-testid="set-filters"
        onClick={() => setFilters({ status: 'rejected', search: 'test' })}
      >
        Set all filters
      </button>
      <button data-testid="clear" onClick={() => clearFilters()}>
        Clear
      </button>
    </div>
  );
}

const meta: Meta<typeof Harness> = {
  title: 'Internal/useFilterState',
  component: Harness,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const InitialState: Story = {
  args: {
    initialFilters: { status: '', search: '' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const output = canvas.getByTestId('filters');
    await expect(output).toHaveTextContent('{"status":"","search":""}');
  },
};

export const UpdateSingleFilter: Story = {
  args: {
    initialFilters: { status: '', search: '' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId('update-status'));
    const output = canvas.getByTestId('filters');
    await expect(output).toHaveTextContent('{"status":"active","search":""}');
  },
};

export const SetAllFilters: Story = {
  args: {
    initialFilters: { status: '', search: '' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId('set-filters'));
    const output = canvas.getByTestId('filters');
    await expect(output).toHaveTextContent('{"status":"rejected","search":"test"}');
  },
};

export const ClearResetsToInitial: Story = {
  args: {
    initialFilters: { status: 'pending', search: 'default' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId('update-status'));
    await userEvent.click(canvas.getByTestId('clear'));
    const output = canvas.getByTestId('filters');
    await expect(output).toHaveTextContent('{"status":"pending","search":"default"}');
  },
};
