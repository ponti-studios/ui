import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { FilterChip } from "./filter-chip";

const meta = { title: "Filters/FilterChip", component: FilterChip, tags: ["autodocs"] } satisfies Meta<typeof FilterChip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: "Active", onRemove: () => {} } };

export const SortChip: Story = {
  args: { label: "Created date", onRemove: () => {}, onClick: () => {}, variant: "sort", direction: "desc" },
};

export const RemoveInteraction: Story = {
  args: { label: "Active", onRemove: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Remove filter: Active" }));
    await expect(args.onRemove).toHaveBeenCalledOnce();
  },
};
