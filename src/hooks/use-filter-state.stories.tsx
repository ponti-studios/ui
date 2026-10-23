import { useFilterState } from "./use-filter-state";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

function FilterStateExample({ onFiltersChange }: { onFiltersChange: (filters: { query: string }) => void }) {
  const { filters, updateFilter, clearFilters } = useFilterState({
    initialFilters: { query: "" },
    onFiltersChange,
    debounceMs: 40,
  });
  return (
    <div>
      <output aria-label="Current query">{filters.query || "empty"}</output>
      <button type="button" onClick={() => updateFilter("query", "updated")}>Update</button>
      <button type="button" onClick={clearFilters}>Clear</button>
    </div>
  );
}

const meta = { title: "Hooks/useFilterState", component: FilterStateExample } satisfies Meta<typeof FilterStateExample>;
export default meta;
type Story = StoryObj<typeof meta>;

export const DebouncedAndCleared: Story = {
  args: { onFiltersChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Update" }));
    await userEvent.click(canvas.getByRole("button", { name: "Clear" }));
    await new Promise((resolve) => setTimeout(resolve, 70));
    await expect(args.onFiltersChange).toHaveBeenCalledTimes(1);
    await expect(args.onFiltersChange).toHaveBeenCalledWith({ query: "" });
  },
};
