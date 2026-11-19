import type { Meta, StoryObj } from "@storybook/react-vite";
import { BarChart3, Coins, GraduationCap, Settings, Users } from "lucide-react";
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
const settings: Omit<DockNavItem, "active"> = {
  href: "#settings",
  label: "Settings",
  icon: <Settings className={icon} aria-hidden />,
};

function Interactive({
  source = base,
  initial,
  children,
}: {
  source?: Omit<DockNavItem, "active">[];
  initial?: string;
  children?: React.ReactNode;
}) {
  const [current, setCurrent] = React.useState(initial);
  const items = source.map((item) => ({ ...item, active: item.href === current }));
  return (
    <div className="min-h-[300px] p-8 pb-24">
      {children ?? (
        <p className="text-muted-foreground text-sm">Tab or press a pill to reveal its label.</p>
      )}
      <DockNav
        items={items}
        renderLink={(linkProps, item) => (
          <a
            href={item.href}
            {...linkProps}
            onClick={(e) => {
              e.preventDefault();
              setCurrent(item.href);
            }}
          />
        )}
      />
    </div>
  );
}

/** The current tab always shows its label; selecting another moves it. */
export const Dock: Story = {
  render: () => <Interactive initial="#overview" />,
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole("navigation", { name: "Main navigation" });
    const overview = within(nav).getByRole("link", { name: "Overview" });
    await expect(overview).toHaveAttribute("aria-current", "page");
    const spend = within(nav).getByRole("link", { name: "Spend" });
    await userEvent.click(spend);
    await expect(spend).toHaveAttribute("aria-current", "page");
    await expect(overview).not.toHaveAttribute("aria-current");
  },
};

/** No tab is current, e.g. on a page the dock does not link to. All icons only. */
export const NoActive: Story = { render: () => <Interactive /> };

export const ThreeItems: Story = {
  render: () => <Interactive source={base.slice(0, 3)} initial="#team" />,
};

export const FiveItems: Story = {
  render: () => <Interactive source={[...base, settings]} initial="#learning" />,
};

/** Labels past the cap truncate instead of stretching the pill. */
export const LongLabel: Story = {
  render: () => (
    <Interactive
      source={[base[0]!, { ...base[1]!, label: "Team performance reviews" }, base[2]!, base[3]!]}
      initial="#team"
    />
  ),
};

/** Dark theme: the border and shadow keep the pill's edge readable. */
export const DarkTheme: Story = {
  globals: { theme: "dark" },
  render: () => <Interactive initial="#overview" />,
};

/** Content scrolls under the glass; the last row clears the dock via `pb-24`. */
export const OverContent: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  render: () => (
    <Interactive initial="#overview">
      <ul className="space-y-3">
        {Array.from({ length: 30 }, (_, n) => (
          <li key={n} className="bg-card border-border rounded-xl border p-4 text-sm">
            Row {n + 1}
          </li>
        ))}
      </ul>
    </Interactive>
  ),
};
