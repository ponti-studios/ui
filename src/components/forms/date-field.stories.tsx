import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, within } from "storybook/test";

import { DateField } from "./date-field";

const meta = {
  title: "Forms/DateField",
  component: DateField,
  tags: ["autodocs"],
} satisfies Meta<typeof DateField>;

export default meta;
type Story = StoryObj<typeof meta>;

function hiddenValue(canvasElement: HTMLElement, name: string): string | null {
  const input = canvasElement.querySelector(`input[name="${name}"]`) as HTMLInputElement | null;
  return input?.value ?? null;
}

async function nextMonth(dialog: HTMLElement) {
  await userEvent.click(within(dialog).getByRole("button", { name: "Go to the Next Month" }));
}

// The trigger button's accessible name comes from its <label> (htmlFor), so
// stories query the button by label and assert the visible date text separately.
export const WithStringDefaultValue: Story = {
  args: {
    name: "startDate",
    defaultValue: "2020-01-15",
    label: "Start date",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The hidden input carries the local "YYYY-MM-DD" value, and the trigger
    // shows the formatted date.
    await expect(hiddenValue(canvasElement, "startDate")).toBe("2020-01-15");
    const trigger = canvas.getByRole("button", { name: "Start date" });
    await expect(trigger).toHaveTextContent("Jan 15, 2020");

    // The calendar opens on the selected month, not the current one.
    await userEvent.click(trigger);
    const dialog = await screen.findByRole("dialog");
    await expect(within(dialog).getByText("January 2020")).toBeInTheDocument();

    // Real click on the Next chevron navigates the month.
    await nextMonth(dialog);
    await expect(within(dialog).getByText("February 2020")).toBeInTheDocument();

    // Picking a day updates the trigger and the hidden input.
    await userEvent.click(within(dialog).getByText("15"));
    await expect(canvas.getByRole("button", { name: "Start date" })).toHaveTextContent(
      "Feb 15, 2020",
    );
    await expect(hiddenValue(canvasElement, "startDate")).toBe("2020-02-15");
  },
};

export const WithDateDefaultValue: Story = {
  args: {
    name: "endDate",
    defaultValue: new Date(2020, 0, 15),
    label: "End date",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(hiddenValue(canvasElement, "endDate")).toBe("2020-01-15");
    await expect(canvas.getByRole("button", { name: "End date" })).toHaveTextContent(
      "Jan 15, 2020",
    );
  },
};

export const Empty: Story = {
  args: {
    name: "startDate",
    label: "Start date",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(hiddenValue(canvasElement, "startDate")).toBe("");
    await expect(canvas.getByRole("button", { name: "Start date" })).toHaveTextContent(
      "Pick a date",
    );
  },
};

export const Disabled: Story = {
  args: {
    name: "startDate",
    defaultValue: "2020-01-15",
    label: "Start date",
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("button", { name: "Start date" })).toBeDisabled();
    await expect(hiddenValue(canvasElement, "startDate")).toBe("2020-01-15");
  },
};

// No play function — this one is for manually driving the interaction
// (e.g. screen recordings), not automated assertions.
export const DropdownEmpty: Story = {
  args: {
    name: "startDate",
    label: "Start date",
    captionLayout: "dropdown",
  },
};

export const WithDropdownCaption: Story = {
  args: {
    mode: "range",
    startName: "startDate",
    endName: "endDate",
    defaultValue: { from: "2018-03-01" },
    label: "Employment period",
    captionLayout: "dropdown",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Jumping back to a date years ago is a month/year select, not repeated
    // prev-month clicks.
    const trigger = canvas.getByRole("button", { name: "Employment period" });
    await userEvent.click(trigger);
    const dialog = await screen.findByRole("dialog");

    const yearSelect = within(dialog).getByRole("combobox", { name: /year/i });
    await userEvent.selectOptions(yearSelect, "2009");
    const monthSelect = within(dialog).getByRole("combobox", { name: /month/i });
    await userEvent.selectOptions(monthSelect, "May");

    await userEvent.click(within(dialog).getByText("12"));
    await expect(hiddenValue(canvasElement, "startDate")).toBe("2009-05-12");
  },
};

export const WithRangeDefaultValue: Story = {
  args: {
    mode: "range",
    startName: "startDate",
    endName: "endDate",
    defaultValue: { from: "2020-01-15", to: "2020-06-30" },
    label: "Active period",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Both hidden inputs carry local date strings; the trigger shows the range.
    await expect(hiddenValue(canvasElement, "startDate")).toBe("2020-01-15");
    await expect(hiddenValue(canvasElement, "endDate")).toBe("2020-06-30");
    const trigger = canvas.getByRole("button", { name: "Active period" });
    await expect(trigger).toHaveTextContent("Jan 15, 2020");
    await expect(trigger).toHaveTextContent("Jun 30, 2020");

    // The range calendar opens on the start month.
    await userEvent.click(trigger);
    const dialog = await screen.findByRole("dialog");
    await expect(within(dialog).getByText("January 2020")).toBeInTheDocument();

    // Real-click the Next chevron, then pick a new from date.
    await nextMonth(dialog);
    await expect(within(dialog).getByText("February 2020")).toBeInTheDocument();
    await userEvent.click(within(dialog).getByText("20"));
    await expect(canvas.getByRole("button", { name: "Active period" })).toHaveTextContent(
      "From Feb 20, 2020",
    );
    await expect(hiddenValue(canvasElement, "startDate")).toBe("2020-02-20");
    await expect(hiddenValue(canvasElement, "endDate")).toBe("");

    // Picking an end date fills the second hidden input.
    await userEvent.click(within(dialog).getByText("25"));
    await expect(canvas.getByRole("button", { name: "Active period" })).toHaveTextContent(
      "Feb 20, 2020 – Feb 25, 2020",
    );
    await expect(hiddenValue(canvasElement, "startDate")).toBe("2020-02-20");
    await expect(hiddenValue(canvasElement, "endDate")).toBe("2020-02-25");
  },
};

export const EmptyRange: Story = {
  args: {
    mode: "range",
    startName: "startDate",
    endName: "endDate",
    label: "Active period",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(hiddenValue(canvasElement, "startDate")).toBe("");
    await expect(hiddenValue(canvasElement, "endDate")).toBe("");
    await expect(canvas.getByRole("button", { name: "Active period" })).toHaveTextContent(
      "Pick a date range",
    );
  },
};
