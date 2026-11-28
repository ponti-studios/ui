import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Stepper } from "./stepper";

const meta = {
  title: "Forms/Stepper",
  component: Stepper,
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: { type: "number" },
      description: "Current value",
      table: { defaultValue: { summary: "1" } },
    },
    min: {
      control: { type: "number" },
      description: "Minimum allowed value",
      table: { defaultValue: { summary: "0" } },
    },
    max: {
      control: { type: "number" },
      description: "Maximum allowed value",
      table: { defaultValue: { summary: "100" } },
    },
    step: {
      control: { type: "number" },
      description: "Amount to change per click",
      table: { defaultValue: { summary: "1" } },
    },
    disabled: {
      control: "boolean",
      description: "Prevents user interaction",
      table: { defaultValue: { summary: "false" } },
    },
    onChange: { control: false, table: { disable: true } },
  },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

function StepperPreview({
  value,
  min,
  max,
  step,
  disabled,
  format,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  format?: (value: number) => string;
}) {
  const [currentValue, setCurrentValue] = useState(value);

  return (
    <Stepper
      value={currentValue}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      format={format}
      onChange={setCurrentValue}
    />
  );
}

export const Default: Story = {
  args: {
    value: 1,
    min: 0,
    max: 10,
    step: 1,
    onChange: () => {},
  },
  render: (args) => (
    <StepperPreview value={args.value} min={args.min} max={args.max} step={args.step} />
  ),
};

export const AtMin: Story = {
  args: {
    value: 0,
    min: 0,
    max: 10,
    onChange: () => {},
  },
  render: (args) => <StepperPreview value={args.value} min={args.min} max={args.max} />,
};

export const AtMax: Story = {
  args: {
    value: 10,
    min: 0,
    max: 10,
    onChange: () => {},
  },
  render: (args) => <StepperPreview value={args.value} min={args.min} max={args.max} />,
};

export const Disabled: Story = {
  args: {
    value: 3,
    disabled: true,
    onChange: () => {},
  },
  render: (args) => <StepperPreview value={args.value} disabled={args.disabled} />,
};

export const CustomFormat: Story = {
  args: {
    value: 5,
    min: 0,
    max: 20,
    onChange: () => {},
  },
  render: (args) => (
    <StepperPreview
      value={args.value}
      min={args.min}
      max={args.max}
      format={(value) => `${value} guests`}
    />
  ),
};
