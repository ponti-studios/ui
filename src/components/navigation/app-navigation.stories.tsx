import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

import { Navigation } from "./app-navigation";

const meta: Meta<typeof Navigation> = {
  title: "Navigation/AppNavigation",
  component: Navigation,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const defaultLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
];

/** Adds a little page content so the navigation can be viewed in context. */
function PageContent({
  message = "Page content appears below the sticky nav.",
}: {
  message?: string;
}) {
  return (
    <div className="p-8">
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => (
    <>
      <Navigation
        brand={
          <Navigation.Link href="/" brand>
            Acme
          </Navigation.Link>
        }
        links={defaultLinks.map((link) => (
          <Navigation.Link key={link.href} href={link.href}>
            {link.label}
          </Navigation.Link>
        ))}
        cta={
          <Navigation.Cta asChild variant="default">
            <a href="/get-started">Get started</a>
          </Navigation.Cta>
        }
      />
      <PageContent />
    </>
  ),
};

export const NoCta: Story = {
  render: () => (
    <>
      <Navigation
        brand={
          <Navigation.Link href="/" brand>
            Acme
          </Navigation.Link>
        }
        links={defaultLinks.map((link) => (
          <Navigation.Link key={link.href} href={link.href}>
            {link.label}
          </Navigation.Link>
        ))}
      />
      <PageContent message="Same nav, no CTA button." />
    </>
  ),
};

export const OutlineCta: Story = {
  render: () => (
    <>
      <Navigation
        brand={
          <Navigation.Link href="/" brand>
            Acme
          </Navigation.Link>
        }
        links={defaultLinks.map((link) => (
          <Navigation.Link key={link.href} href={link.href}>
            {link.label}
          </Navigation.Link>
        ))}
        cta={
          <Navigation.Cta asChild variant="outline">
            <a href="/get-started">Get started</a>
          </Navigation.Cta>
        }
      />
      <PageContent message="The outline CTA keeps the same navigation geometry with a quieter emphasis." />
    </>
  ),
};

/**
 * `Navigation.Link`/`Navigation.Cta` support the same `asChild` composition
 * as `Button`: pass your router's `Link` (or anything else) as the single
 * child, and the base styling/`aria-current`/mobile auto-close behavior
 * still apply. This story stands in for a router `Link` with a plain anchor
 * that no-ops on click, since Storybook has no router.
 */
export const WithCustomRouterLink: Story = {
  render: () => {
    const activeHref = "/pricing";
    return (
      <>
        <Navigation
          brand={
            <Navigation.Link asChild brand>
              <a href="/" data-router-link="stand-in" onClick={(e) => e.preventDefault()}>
                Acme
              </a>
            </Navigation.Link>
          }
          links={defaultLinks.map((link) => (
            <Navigation.Link key={link.href} asChild active={link.href === activeHref}>
              <a href={link.href} data-router-link="stand-in" onClick={(e) => e.preventDefault()}>
                {link.label}
              </a>
            </Navigation.Link>
          ))}
          cta={
            <Navigation.Cta asChild variant="default">
              <a href="/get-started" data-router-link="stand-in" onClick={(e) => e.preventDefault()}>
                Get started
              </a>
            </Navigation.Cta>
          }
        />
        <PageContent message="Every link here is a custom element composed via asChild - open the elements panel to see data-router-link on each one, and the /pricing link's aria-current." />
      </>
    );
  },
};
