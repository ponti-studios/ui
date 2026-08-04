import { mergeProps } from "@base-ui/react/merge-props";
import { Menu } from "lucide-react";
import type { ComponentPropsWithRef, ComponentPropsWithoutRef, ReactElement, ReactNode } from "react";
import * as React from "react";

import { cn } from "../../lib/utils";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "../overlays/sheet";
import { Button } from "../primitives/button";

export interface AppNavigationProps {
  /** The brand/logo slot — typically a `Navigation.Link asChild`. */
  brand?: ReactNode;
  /** The primary link list — one or more `Navigation.Link` elements. Rendered in both the desktop bar and the mobile menu. */
  links?: ReactNode;
  /** The call-to-action slot — typically a `Navigation.Cta asChild`. */
  cta?: ReactNode;
  endContent?: ReactNode;
  ariaLabel?: string;
}

interface NavigationLinkOwnProps {
  active?: boolean;
  brand?: boolean;
  /**
   * Apply the link styling to a single child element instead of rendering
   * an `<a>` — pass your router's `Link` (or anything else) as `children`
   * to compose it directly, e.g.:
   *
   * ```tsx
   * <Navigation.Link asChild active={pathname === "/work"}>
   *   <RouterLink to="/work">Work</RouterLink>
   * </Navigation.Link>
   * ```
   */
  asChild?: boolean;
}

export type NavigationLinkProps = NavigationLinkOwnProps &
  Omit<ComponentPropsWithoutRef<"a">, keyof NavigationLinkOwnProps>;

/**
 * Styled link container used for `Navigation`'s brand and primary links.
 * Renders a plain `<a>` by default; pass `asChild` with a single child
 * element to apply the same styling/`aria-current` wiring to that element
 * instead, so the app controls which link component renders and how it's
 * further styled — `Navigation` only owns the base container styling.
 */
const NavigationLink = React.forwardRef<HTMLAnchorElement, NavigationLinkProps>(
  ({ children, active = false, brand = false, asChild = false, className, ...props }, ref) => {
    const linkClassName = cn(
      "inline-flex h-9 max-h-9 shrink-0 items-center px-3 py-2 text-sm font-medium",
      !brand && "hover:bg-muted hover:text-muted-foreground",
      className,
    );

    if (asChild && React.isValidElement(children)) {
      const child = children as ReactElement<ComponentPropsWithRef<"a">>;
      // mergeProps chains event handlers (e.g. a parent SheetClose's
      // auto-close onClick) instead of one overwriting the other, and
      // concatenates className instead of replacing it.
      const merged = mergeProps<"a">(props as ComponentPropsWithRef<"a">, child.props, {
        className: linkClassName,
        "aria-current": active ? "page" : undefined,
      });
      return React.cloneElement(child, merged);
    }

    return (
      <a
        ref={ref}
        {...props}
        className={linkClassName}
        aria-current={active ? "page" : undefined}
      >
        {children}
      </a>
    );
  },
);
NavigationLink.displayName = "NavigationLink";

export type NavigationCtaProps = Omit<React.ComponentProps<typeof Button>, "size">;

/**
 * Call-to-action slot for `Navigation` — a thin, nav-sized wrapper around
 * `Button`. Exists to wrap a link, so `asChild` defaults to `true` (unlike
 * `Button`, where it defaults to `false`) — pass your router's `Link` (or
 * an `<a>`) as the single child. Pass `asChild={false}` explicitly for the
 * rare case of a CTA that isn't a link.
 */
function NavigationCta({ variant, asChild = true, children, ...props }: NavigationCtaProps) {
  return (
    <Button size="md" variant={variant} asChild={asChild} {...props}>
      {children}
    </Button>
  );
}

function NavigationRoot({ brand, links, cta, endContent, ariaLabel = "Primary navigation" }: AppNavigationProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // The mobile menu renders the same link elements the app already composed
  // for the desktop bar — each one gets wrapped so tapping it also closes
  // the sheet, without the app needing to build two separate lists.
  const mobileLinks = React.Children.map(links, (link) =>
    React.isValidElement(link) ? <SheetClose asChild>{link}</SheetClose> : link,
  );

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 flex w-full justify-center border-b px-4 backdrop-blur">
      <nav className="w-full max-w-7xl" aria-label={ariaLabel}>
        <div className="flex min-h-14 items-center justify-between gap-6">
          <div className="flex min-w-0 items-center">{brand}</div>

          <div className="ml-auto hidden min-w-0 items-center gap-1 sm:flex">
            {links}
            {cta}
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

                <div className="mt-8 flex flex-1 flex-col gap-1">{mobileLinks}</div>

                {(cta || endContent) && (
                  <div className="flex flex-col gap-4 border-t pt-4">
                    {cta && <SheetClose asChild>{cta}</SheetClose>}
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
  Cta: typeof NavigationCta;
};

export const Navigation: NavigationComponent = Object.assign(NavigationRoot, {
  Link: NavigationLink,
  Cta: NavigationCta,
});

/** @deprecated Use `Navigation` instead. */
export const AppNavigation = Navigation;
