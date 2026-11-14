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

const ease = "ease-[cubic-bezier(.22,1,.36,1)]";

/**
 * Floating glass pill pinned to the bottom of the screen. Icons only until a
 * tab is focused or pressed, then its label slides open underneath. Pure CSS,
 * no motion library. Meant for small screens: hide it from `lg` up with
 * `className="lg:hidden"`.
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
        "pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(.75rem,env(safe-area-inset-bottom))]",
        className,
      )}
    >
      <div className="bg-background/60 pointer-events-auto flex w-full max-w-xs items-stretch justify-around rounded-full p-1.5 shadow-[0_0_0_1px_rgba(0,0,0,.08),0_8px_32px_-8px_rgba(0,0,0,.2)] backdrop-blur-2xl backdrop-saturate-150">
        {items.map((item) =>
          renderLink(
            {
              className: cn(
                "group focus-visible:ring-ring relative flex min-h-12 min-w-14 flex-1 flex-col items-center justify-center rounded-full no-underline outline-none transition-[color,background-color] duration-200 focus-visible:bg-black/[.05] focus-visible:ring-2",
                item.active
                  ? "text-foreground bg-black/[.07] dark:bg-white/10"
                  : "text-muted-foreground hover:text-foreground focus-visible:text-foreground active:text-foreground",
              ),
              "aria-current": item.active ? "page" : undefined,
              "data-active": item.active ? true : undefined,
              children: (
                <span className="flex flex-col items-center">
                  <span
                    className={cn(
                      "transition-transform duration-300 group-focus-visible:scale-110 group-active:scale-95",
                      ease,
                    )}
                  >
                    {item.icon}
                  </span>
                  <span
                    className={cn(
                      "grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-300 group-focus-visible:grid-rows-[1fr] group-focus-visible:opacity-100 group-active:grid-rows-[1fr] group-active:opacity-100",
                      ease,
                    )}
                  >
                    <span className="overflow-hidden text-[11px] leading-tight font-medium">
                      <span className="block pt-0.5">{item.label}</span>
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
