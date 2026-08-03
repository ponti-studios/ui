import { Menu } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import * as React from "react";

import { cn } from "../../lib/utils";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "../overlays/sheet";
import { Button } from "../primitives/button";

export interface AppNavigationLink {
  href: string;
  label: string;
}

export interface AppNavigationCta {
  href: string;
  label: string;
  variant?: "default" | "outline";
}

export interface AppNavigationProps {
  brand?: React.ReactNode;
  brandHref?: string;
  endContent?: React.ReactNode;
  links?: AppNavigationLink[];
  cta?: AppNavigationCta;
  ariaLabel?: string;
  /** Current pathname used to highlight the active link. */
  activeHref?: string;
}

interface NavigationLinkOwnProps {
  active?: boolean;
  brand?: boolean;
}

export type NavigationLinkProps = NavigationLinkOwnProps &
  Omit<ComponentPropsWithoutRef<"a">, keyof NavigationLinkOwnProps>;

function NavigationLink({
  children,
  active = false,
  brand = false,
  className,
  ...props
}: NavigationLinkProps) {
  return (
    <a
      {...props}
      className={cn(
        "inline-flex h-9 max-h-9 shrink-0 items-center px-3 py-2 text-sm font-medium",
        !brand && "hover:bg-muted hover:text-muted-foreground",
        className,
      )}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </a>
  );
}

function NavigationCta({ href, label }: AppNavigationCta) {
  return (
    <Button asChild size="md">
      <a href={href}>{label}</a>
    </Button>
  );
}

function NavigationRoot({
  brand,
  brandHref = "/",
  endContent,
  links,
  cta,
  ariaLabel = "Primary navigation",
  activeHref,
}: AppNavigationProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const isActive = (href: string) => {
    if (!activeHref) return false;
    if (href === activeHref) return true;
    // Nested routes (e.g. /work/123) keep the parent link active.
    return href !== "/" && activeHref.startsWith(`${href}/`);
  };

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 flex w-full justify-center border-b px-4 backdrop-blur">
      <nav className="w-full max-w-7xl" aria-label={ariaLabel}>
        <div className="flex min-h-14 items-center justify-between gap-6">
          <div className="flex min-w-0 items-center">
            {brand && (
              <NavigationLink href={brandHref} brand>
                {brand}
              </NavigationLink>
            )}
          </div>

          <div className="ml-auto hidden min-w-0 items-center gap-1 sm:flex">
            {links?.map((link) => (
              <NavigationLink key={link.href} href={link.href} active={isActive(link.href)}>
                {link.label}
              </NavigationLink>
            ))}
            {cta && <NavigationCta {...cta} />}
            {endContent}
          </div>

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

                <div className="mt-8 flex flex-1 flex-col gap-1">
                  {links?.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <NavigationLink href={link.href} active={isActive(link.href)}>
                        {link.label}
                      </NavigationLink>
                    </SheetClose>
                  ))}
                </div>

                {(cta || endContent) && (
                  <div className="flex flex-col gap-4 border-t pt-4">
                    {cta && (
                      <SheetClose asChild>
                        <NavigationCta {...cta} />
                      </SheetClose>
                    )}
                    {endContent && <div className="flex items-center gap-3">{endContent}</div>}
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}

type NavigationComponent = typeof NavigationRoot & {
  Link: typeof NavigationLink;
};

export const Navigation: NavigationComponent = Object.assign(NavigationRoot, {
  Link: NavigationLink,
});

/** @deprecated Use `Navigation` instead. */
export const AppNavigation = Navigation;
