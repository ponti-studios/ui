import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { textFieldTypeOptions } from "../../storybook/options";
import { TextField } from "./text-field";

const meta = {
  title: "Forms/TextField",
  component: TextField,
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text", description: "Label displayed above the field" },
    type: {
      control: { type: "select" },
      description: "Input type used by the field",
      options: textFieldTypeOptions,
      table: { defaultValue: { summary: "text" } },
    },
    placeholder: { control: "text", description: "Placeholder text shown when the field is empty" },
    helpText: { control: "text", description: "Supporting text shown below the field" },
    error: { control: "text", description: "Validation error text shown below the field" },
    disabled: {
      control: "boolean",
      description: "Prevents user interaction and applies disabled styling",
      table: { defaultValue: { summary: "false" } },
    },
    required: {
      control: "boolean",
      description: "Marks the field as required for form submission",
      table: { defaultValue: { summary: "false" } },
    },
  },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Email",
    placeholder: "you@example.com",
    type: "email",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Email");

    await userEvent.click(input);
    await userEvent.type(input, "you@example.com");

    await expect(input).toHaveFocus();
    await expect(input).toHaveValue("you@example.com");
  },
};

export const WithHelpText: Story = {
  args: {
    label: "Search",
    helpText: "Press Enter to submit",
    placeholder: "Search notes",
    type: "search",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("Press Enter to submit")).toBeInTheDocument();
    await expect(canvas.getByLabelText("Search")).toBeEnabled();
  },
};

export const Error: Story = {
  args: {
    label: "Password",
    error: "Password is required",
    type: "password",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Password");

    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(canvas.getByText("Password is required")).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    label: "Handle",
    placeholder: "@hominem",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText("Handle")).toBeDisabled();
  },
};
