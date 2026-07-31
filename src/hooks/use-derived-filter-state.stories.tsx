import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useRef } from 'react';

import { useDerivedFilterState, type FilterConfig } from './use-derived-filter-state';

function createMemorySync(initial: Record<string, string>) {
  const store = { ...initial };
  return {
    read: () => ({ ...store }),
    write: (values: Record<string, string>) => Object.assign(store, values),
  };
}

const fields = {
  status: { default: "", label: (v: string) => `Status: ${v}` } satisfies FilterConfig,
  search: { default: "" } satisfies FilterConfig,
};

function Harness() {
  const sync = useRef(createMemorySync({ status: "", search: "" }));
  const { values, setValue, activeFilters, clearAll, hasActive } =
    useDerivedFilterState({ fields, sync: sync.current });

  return (
    <div data-testid="harness">
      <span data-testid="values">{JSON.stringify(values)}</span>
      <span data-testid="active-filters">
        {activeFilters.map((f) => f.label).join(',')}
      </span>
      <span data-testid="has-active">{String(hasActive)}</span>
      <button
        data-testid="set-status"
        onClick={() => setValue('status', 'active')}
      >
        Set status
      </button>
      <button
        data-testid="set-search"
        onClick={() => setValue('search', 'hello')}
      >
        Set search
      </button>
      <button
        data-testid="clear-status"
        onClick={() => setValue('status', '')}
      >
        Clear status
      </button>
      <button data-testid="clear-all" onClick={() => clearAll()}>
        Clear all
      </button>
    </div>
  );
}

const meta: Meta<typeof Harness> = {
  title: 'Internal/useDerivedFilterState',
  component: Harness,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const InitialState: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('values')).toHaveTextContent(
      '{"status":"","search":""}',
    );
    await expect(canvas.getByTestId('has-active')).toHaveTextContent('false');
    await expect(canvas.getByTestId('active-filters')).toHaveTextContent('');
  },
};

export const SetValueCreatesActiveFilter: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId('set-status'));
    await expect(canvas.getByTestId('values')).toHaveTextContent(
      '{"status":"active","search":""}',
    );
    await expect(canvas.getByTestId('active-filters')).toHaveTextContent(
      'Status: active',
    );
    await expect(canvas.getByTestId('has-active')).toHaveTextContent('true');
  },
};

export const ClearValueRemovesActiveFilter: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId('set-status'));
    await userEvent.click(canvas.getByTestId('clear-status'));
    await expect(canvas.getByTestId('values')).toHaveTextContent(
      '{"status":"","search":""}',
    );
    await expect(canvas.getByTestId('has-active')).toHaveTextContent('false');
  },
};

export const ClearAllResetsEverything: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId('set-status'));
    await userEvent.click(canvas.getByTestId('set-search'));
    await userEvent.click(canvas.getByTestId('clear-all'));
    await expect(canvas.getByTestId('values')).toHaveTextContent(
      '{"status":"","search":""}',
    );
    await expect(canvas.getByTestId('has-active')).toHaveTextContent('false');
    await expect(canvas.getByTestId('active-filters')).toHaveTextContent('');
  },
};

export const ActiveFilterOnRemoveClearsValue: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId('set-status'));
    await expect(canvas.getByTestId('active-filters')).toHaveTextContent(
      'Status: active',
    );
  },
};

export const MultipleActiveFilters: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId('set-status'));
    await userEvent.click(canvas.getByTestId('set-search'));
    await expect(canvas.getByTestId('active-filters')).toHaveTextContent(
      'Status: active,search: hello',
    );
  },
};
