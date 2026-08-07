import { Menu } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import * as React from "react";

import { cn } from "../../lib/utils";
import { Slot } from "../../lib/slot";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "../overlays/sheet";
import { Button } from "../primitives/button";

/** True while rendering inside the mobile Sheet copy of the nav content. */
const MobileMenuContext = React.createContext(false);

export interface NavigationRootProps {
  children: ReactNode;
  ariaLabel?: string;
  className?: string;
}

/**
 * Sticky nav shell. Compose it with `Navigation.Brand`, `Navigation.List`
 * (containing `Navigation.Item`s), and any other content — a CTA `Button`,
 * a search input, a notification bell — as plain children. `Navigation`
 * only owns the responsive chrome: `Navigation.Brand` stays visible at
 * every width, everything else collapses into a Sheet-based mobile menu
 * below `sm`, reusing the exact elements you composed (not a parallel data
 * shape) so `Navigation.Item`'s active state and `asChild` composition
 * behave identically in both places.
 */
function NavigationRoot({
  children,
  ariaLabel = "Primary navigation",
  className,
}: NavigationRootProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const items = React.Children.toArray(children);
  const brand = items.find(
    (child) => React.isValidElement(child) && child.type === NavigationBrand,
  );
  const rest = items.filter((child) => child !== brand);

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 flex w-full justify-center border-b px-4 backdrop-blur">
      <nav
        className={cn(
          "flex min-h-14 w-full max-w-7xl items-center justify-between gap-6",
          className,
        )}
        aria-label={ariaLabel}
      >
        <div className="flex min-w-0 items-center">{brand}</div>

        <div className="ml-auto hidden min-w-0 items-center gap-6 sm:flex">{rest}</div>

        <div className="ml-auto flex items-center sm:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                <Menu className="size-4" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <div className="mt-8 flex flex-1 flex-col gap-4">
                <MobileMenuContext.Provider value={true}>{rest}</MobileMenuContext.Provider>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}

export interface NavigationBrandProps {
  children: ReactNode;
  className?: string;
}

/** Always visible, at every viewport width — compose your own link/logo markup directly. */
function NavigationBrand({ children, className }: NavigationBrandProps) {
  return <div className={cn("flex items-center font-semibold", className)}>{children}</div>;
}

export interface NavigationListProps {
  children: ReactNode;
  className?: string;
}

/** Semantic `<ul>` of `Navigation.Item`s. Lays out horizontally on desktop, stacks inside the mobile Sheet. */
function NavigationList({ children, className }: NavigationListProps) {
  const isMobile = React.useContext(MobileMenuContext);
  return (
    <ul
      className={cn(
        "flex items-center gap-1",
        isMobile && "flex-col items-stretch gap-1",
        className,
      )}
    >
      {children}
    </ul>
  );
}

interface NavigationItemOwnProps {
  active?: boolean;
  /** Apply the item styling to a single child (e.g. your router's `Link`) instead of rendering an `<a>`. */
  asChild?: boolean;
}

export type NavigationItemProps = NavigationItemOwnProps &
  Omit<ComponentPropsWithoutRef<"a">, keyof NavigationItemOwnProps>;

/** A single nav link, wrapped in `<li>`. Auto-closes the mobile Sheet on click when rendered there. */
function NavigationItem({
  active = false,
  asChild = false,
  className,
  children,
  ...props
}: NavigationItemProps) {
  const isMobile = React.useContext(MobileMenuContext);
  const itemClassName = cn(
    "inline-flex h-9 max-h-9 shrink-0 items-center px-3 py-2 text-sm font-medium hover:bg-muted hover:text-muted-foreground data-[active]:font-semibold data-[active]:text-foreground",
    className,
  );

  const content = asChild ? (
    <Slot
      {...props}
      data-active={active || undefined}
      aria-current={active ? "page" : undefined}
      className={itemClassName}
    >
      {children}
    </Slot>
  ) : (
    <a
      {...props}
      data-active={active || undefined}
      aria-current={active ? "page" : undefined}
      className={itemClassName}
    >
      {children}
    </a>
  );

  return <li>{isMobile ? <SheetClose asChild>{content}</SheetClose> : content}</li>;
}

export interface NavigationActionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Layout wrapper for a CTA, avatar menu, theme toggle, etc. — bring your
 * own `Button`, no dedicated CTA component needed. Content here does not
 * auto-close the mobile Sheet on click (it may hold more than one
 * element, or non-navigational controls) — use `Navigation.Item` instead
 * for a link that should close the menu when tapped.
 */
function NavigationAction({ children, className }: NavigationActionProps) {
  const isMobile = React.useContext(MobileMenuContext);
  return (
    <div
      className={cn(
        "flex items-center gap-3",
        isMobile && "mt-2 flex-col items-stretch gap-3 border-t pt-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

type NavigationComponent = typeof NavigationRoot & {
  Brand: typeof NavigationBrand;
  List: typeof NavigationList;
  Item: typeof NavigationItem;
  Action: typeof NavigationAction;
};

export const Navigation: NavigationComponent = Object.assign(NavigationRoot, {
  Brand: NavigationBrand,
  List: NavigationList,
  Item: NavigationItem,
  Action: NavigationAction,
});

/** @deprecated Use `Navigation` instead. */
export const AppNavigation = Navigation;
