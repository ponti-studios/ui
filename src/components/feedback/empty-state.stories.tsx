import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { EmptyState } from "./empty-state";

const meta = { title: "Feedback/EmptyState", component: EmptyState, tags: ["autodocs"] } satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "No projects yet",
    description: "Create a project to see it here.",
    action: <button type="button">Create project</button>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "No projects yet" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Create project" })).toBeInTheDocument();
  },
};

export const InlineSearch: Story = {
  args: { title: "No results", description: "Try another search.", layout: "inline", variant: "search" },
};
