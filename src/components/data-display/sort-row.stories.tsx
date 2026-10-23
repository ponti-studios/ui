import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { SortRow } from "./sort-row";
import type { SortField } from "../../hooks/sort.types";

const sortableFields: SortField[] = ["createdAt", "name"];
const meta = { title: "Data Display/SortRow", component: SortRow, tags: ["autodocs"] } satisfies Meta<typeof SortRow>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    sortOption: { field: "createdAt", direction: "asc" }, index: 0, sortableFields, usedFields: ["createdAt"],
    updateSortOption: () => {}, removeSortOption: () => {},
  },
};

export const RemoveInteraction: Story = {
  args: {
    sortOption: { field: "createdAt", direction: "asc" }, index: 0, sortableFields, usedFields: ["createdAt"],
    updateSortOption: fn(), removeSortOption: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Remove sort criterion" }));
    await expect(args.removeSortOption).toHaveBeenCalledWith(0);
  },
};
