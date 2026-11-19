"use client";

import { cn } from "../../lib/utils";
import type { ReactElement, ReactNode } from "react";

export interface DockNavItem {
  href: string;
  label: string;
  /** Any node: a lucide icon, an svg, an emoji. Sized by the caller. */
  icon: ReactNode;
  active?: boolean;
}

/** Props the dock hands to your link so it looks and behaves right. */
export interface DockNavLinkProps {
  className: string;
  children: ReactNode;
  "aria-current"?: "page";
  "data-active"?: true;
}

/**
 * Swap in your router's link. Spread `linkProps` on it and pass `item.href`
 * however your router wants it. Defaults to a plain `<a>`.
 */
export type RenderNavLink = (linkProps: DockNavLinkProps, item: DockNavItem) => ReactElement;

export interface DockNavProps {
  items: DockNavItem[];
  renderLink?: RenderNavLink;
  ariaLabel?: string;
  className?: string;
}

const ease = "motion-safe:ease-[cubic-bezier(.22,1,.36,1)]";

/** Label slot: collapsed until the tab is current, focused, or pressed. */
const labelOpen = "grid-cols-[1fr] grid-rows-[1fr] opacity-100";

/**
 * Floating glass pill pinned to the bottom of the screen. The current tab
 * always shows its label; the others are icons until focused or pressed, then
 * their label slides open underneath. Pure CSS, no motion library, and no
 * motion at all under `prefers-reduced-motion`.
 *
 * Built for 3 to 5 items on small screens. The pill grows with its items up
 * to the screen width less the gutter, and long labels truncate. Hide it from
 * `lg` up with `className="lg:hidden"`, and give the page `pb-24` so the
 * last content clears the dock.
 */
export function DockNav({
  items,
  renderLink = (linkProps, item) => <a href={item.href} {...linkProps} />,
  ariaLabel = "Main navigation",
  className,
}: DockNavProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(var(--spacing-scale-2),env(safe-area-inset-bottom))]",
        className,
      )}
    >
      <div className="bg-background supports-[backdrop-filter]:bg-background/70 pointer-events-auto flex w-fit max-w-full items-stretch justify-around gap-1 border-border rounded-full border p-1 shadow-lg supports-[backdrop-filter]:backdrop-blur-2xl supports-[backdrop-filter]:backdrop-saturate-150">
        {items.map((item) =>
          renderLink(
            {
              className: cn(
                "group focus-visible:ring-ring relative flex min-h-12 min-w-11 flex-col items-center justify-center rounded-full px-3 no-underline outline-none focus-visible:ring-2 motion-safe:transition-[color,background-color] motion-safe:duration-200",
                item.active
                  ? "text-accent-foreground bg-accent shrink-0"
                  : "text-muted-foreground shrink hover:text-foreground focus-visible:text-foreground focus-visible:bg-accent active:text-foreground",
              ),
              "aria-current": item.active ? "page" : undefined,
              "data-active": item.active ? true : undefined,
              children: (
                <span className="flex min-w-0 max-w-full flex-col items-center">
                  <span
                    className={cn(
                      "motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-focus-visible:scale-110 motion-safe:group-active:scale-95",
                      ease,
                    )}
                  >
                    {item.icon}
                  </span>
                  <span
                    className={cn(
                      "grid max-w-full grid-cols-[0fr] grid-rows-[0fr] opacity-0 motion-safe:transition-[grid-template-columns,grid-template-rows,opacity] motion-safe:duration-300 group-focus-visible:grid-cols-[1fr] group-focus-visible:grid-rows-[1fr] group-focus-visible:opacity-100 group-active:grid-cols-[1fr] group-active:grid-rows-[1fr] group-active:opacity-100",
                      item.active && labelOpen,
                      ease,
                    )}
                  >
                    <span className="overflow-hidden text-xs leading-tight font-medium">
                      <span className="block max-w-24 truncate pt-0.5">{item.label}</span>
                    </span>
                  </span>
                </span>
              ),
            },
            item,
          ),
        )}
      </div>
    </nav>
  );
}
