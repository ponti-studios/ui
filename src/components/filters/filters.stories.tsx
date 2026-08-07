import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { Input } from "../forms/input";
import { Filters } from "./filters";

const meta = {
  title: "Filters/Compound",
  component: Filters,
  tags: ["autodocs"],
  args: {
    children: null,
  },
} satisfies Meta<typeof Filters>;

export default meta;
type Story = StoryObj<typeof meta>;

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
];

export const Default: Story = {
  render: () => (
    <div className="w-[720px]">
      <Filters>
        <Filters.Search label="Search">
          <Input placeholder="Search applications..." aria-label="Search applications" />
        </Filters.Search>
        <Filters.Select
          value="active"
          options={statusOptions}
          onChange={() => {}}
          placeholder="All statuses"
          label="Status"
        />
        <Filters.Select
          value=""
          options={[{ value: "engineer", label: "Engineer" }]}
          onChange={() => {}}
          placeholder="All roles"
          label="Role"
        />
        <Filters.Active
          filters={[
            { id: "status", label: "Status: Active", onRemove: () => {} },
            { id: "sort", label: "Date", onRemove: () => {}, variant: "sort", direction: "desc" },
          ]}
          onClearAll={() => {}}
        />
      </Filters>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("Search")).toBeInTheDocument();
    await expect(canvas.getByRole("textbox", { name: "Search applications" })).toBeInTheDocument();

    await expect(canvas.getByText("Status")).toBeInTheDocument();
    await expect(canvas.getByRole("combobox", { name: "Status" })).toBeInTheDocument();

    await expect(canvas.getByText("Role")).toBeInTheDocument();
    await expect(canvas.getByRole("combobox", { name: "Role" })).toBeInTheDocument();

    await expect(canvas.getByText("Status: Active")).toBeInTheDocument();
    await expect(canvas.getByText("Date")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Clear all" })).toBeInTheDocument();
  },
};
