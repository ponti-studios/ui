import type { Meta, StoryObj } from "@storybook/react-vite";
import { BarChart3, Coins, GraduationCap, Users } from "lucide-react";
import * as React from "react";
import { expect, userEvent, within } from "storybook/test";

import { DockNav, type DockNavItem } from "./dock-nav";

const meta: Meta<typeof DockNav> = {
  title: "Navigation/DockNav",
  component: DockNav,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof meta>;

const icon = "size-4";
const base: Omit<DockNavItem, "active">[] = [
  { href: "#overview", label: "Overview", icon: <BarChart3 className={icon} aria-hidden /> },
  { href: "#team", label: "Team", icon: <Users className={icon} aria-hidden /> },
  { href: "#learning", label: "Learning", icon: <GraduationCap className={icon} aria-hidden /> },
  { href: "#spend", label: "Spend", icon: <Coins className={icon} aria-hidden /> },
];

function useItems(): [DockNavItem[], (href: string) => void] {
  const [current, setCurrent] = React.useState("#overview");
  return [base.map((item) => ({ ...item, active: item.href === current })), setCurrent];
}

export const Dock: Story = {
  render: () => {
    const [items, select] = useItems();
    return (
      <div className="min-h-[300px] p-8">
        <p className="text-muted-foreground text-sm">Tab to a pill to reveal its label.</p>
        <DockNav
          items={items}
          renderLink={(linkProps, item) => (
            <a
              href={item.href}
              {...linkProps}
              onClick={(e) => {
                e.preventDefault();
                select(item.href);
              }}
            />
          )}
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole("navigation", { name: "Main navigation" });
    const spend = within(nav).getByRole("link", { name: "Spend" });
    await userEvent.click(spend);
    await expect(spend).toHaveAttribute("aria-current", "page");
  },
};
