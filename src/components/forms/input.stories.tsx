import type { Meta, StoryObj } from "@storybook/react-vite";

import { inputTypeOptions } from "../../storybook/options";
import { Input } from "./input";

const meta = {
  title: "Forms/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: { type: "select" },
      description: "HTML input type attribute",
      options: inputTypeOptions,
      table: { defaultValue: { summary: "text" } },
    },
    placeholder: { control: "text", description: "Placeholder text shown when the input is empty" },
    disabled: {
      control: "boolean",
      description: "Prevents user interaction and applies disabled styling",
      table: { defaultValue: { summary: "false" } },
    },
    required: {
      control: "boolean",
      description: "Marks the input as required for form submission",
      table: { defaultValue: { summary: "false" } },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: "Enter text…" },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-2">
      <label htmlFor="email" className="text-foreground text-sm leading-none font-medium">
        Email
      </label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-4">
      <Input aria-label="Default input" placeholder="Default" />
      <Input aria-label="Disabled input" placeholder="Disabled" disabled />
      <Input aria-label="Input with value" defaultValue="With value" />
    </div>
  ),
};
