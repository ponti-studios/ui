import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from '../forms/input';
import { FilterSelect } from './filter-select';
import { SearchFilterBar } from './search-filter-bar';

const meta = {
  title: 'Filters/SearchFilterBar',
  component: SearchFilterBar,
  tags: ['autodocs'],
} satisfies Meta<typeof SearchFilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Legacy: Story = {
  args: {
    activeFilters: [],
  },
  render: () => (
    <div className="w-[720px]">
      <SearchFilterBar
        activeFilters={[
          { id: 'status', label: 'Status: Active', onRemove: () => {} },
        ]}
        onClearAll={() => {}}
        search={<Input placeholder="Search..." aria-label="Search" />}
        filters={[
          <FilterSelect
            key="status"
            value="active"
            options={[{ value: 'active', label: 'Active' }]}
            onChange={() => {}}
            placeholder="All"
            label="Status"
          />,
        ]}
      />
    </div>
  ),
};
