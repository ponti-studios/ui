# @ponti-studios/ui

The canonical Ponti Studios UI package. It is published from this repository to npm.

## Design

The design system is documented in `docs/`:

- [Foundations](./docs/foundations.md) — color, spacing, radius, typography, elevation, iconography, motion tokens
- [Primitives](./docs/primitives.md) — component contracts (variants, sizes, states)
- [Patterns](./docs/patterns.md) — screen composition rules
- [Review gates](./docs/review-gates.md) — pass/fail review criteria

## React Native

Import native components and the shared token theme from `@ponti-studios/ui/native`.
This entry point requires `react-native` as a peer and uses the same light/dark
color, spacing, radius, type-size, and font-weight tokens as the web components.
The base package remains usable by web consumers that do not install React Native.

```tsx
import { NativeButton, NativeThemeProvider } from "@ponti-studios/ui/native";
```

## Localization

Built-in accessibility labels can be localized once with `UiTextProvider`.
Component props such as `loadingLabel`, `emptyLabel`, and visible labels remain
available and take precedence over provider defaults. Feature-specific copy stays
owned by the consuming application.

```tsx
import { UiTextProvider } from "@ponti-studios/ui";

<UiTextProvider messages={{
  "button.loading": "Chargement",
  "pagination.previous": "Page précédente",
  "pagination.next": "Page suivante",
}}>
  <App />
</UiTextProvider>
```

## Component registry

The shadcn-compatible registry is a curated set of independently installable
components plus the compiled Ponti theme. It is generated from source and
validated during `pnpm run check`; use the npm package for the complete,
maintained component library.

## Development

Common development workflows are available through the `Makefile`:

```bash
make build      # regenerate token artifacts and typecheck
make check      # build, then verify tokens/source contracts/lint
make test       # run light and dark Storybook/vitest tests (implies build)
make storybook  # build tokens and start Storybook
```

The `pnpm run` scripts (`check`, `build`, `test`, `storybook`, `format`) delegate to these targets for compatibility.

## Start a new web project

The package also ships a React + Vite starter wired to the current Ponti UI
release. It includes the shared theme and component styles, strict TypeScript
settings, and a first screen using the shared Button. The starter does not need
Tailwind installed.

Create a project and install its dependencies:

```bash
pnpm dlx --package @ponti-studios/ui create-ponti-project my-new-project
cd my-new-project
pnpm dev
```

The command refuses to write into a non-empty directory. Pass `--no-install`
to create the files without running `pnpm install`. From a local checkout, use
`pnpm run create:project <directory>`.

This starter is intentionally focused on web apps. Native apps use the same
token sources through the package's `/native` entry point and should keep their
platform-specific app setup in their own starter.

## Release

Releases are owned by [release-please](https://github.com/googleapis/release-please), not by hand-edited version numbers or manually pushed tags. The `.github/workflows/publish.yml` workflow runs after a successful `validate` push to `main`:

1. **`release-please`** — maintains a root-package release PR, updating `package.json`, `.release-please-manifest.json`, and `CHANGELOG.md` from Conventional Commit history.
2. **`publish`** — when that release PR is merged, checks out the exact release tag and publishes it to npm. `workflow_dispatch` is the break-glass recovery path for a previously created release tag.

**So the actual release flow is:**

1. Land commits using [Conventional Commits](https://www.conventionalcommits.org/) — `fix:` → patch, `feat:` → minor, and `feat!:` or a `BREAKING CHANGE:` footer → major. Use `fix:` when the intended release is a patch.
2. Once on `main`, find or wait for the `chore(main): release ui X.Y.Z` PR that Release Please opens or updates.
3. Review and merge it. That merge creates the `ui-v<version>` tag; after validation succeeds, the release workflow publishes that exact tag automatically.

`prepack` (`pnpm run check`) runs before packing or publishing and is the last gate before anything reaches npm — see "Generated files" below for the failure mode that most commonly trips it.

### Generated files must never be hand-edited

`src/styles/tokens/generated/**` and `.storybook/generated/**` are produced only by `make build` (style-dictionary) from the DTCG source in `src/styles/tokens/source/*.tokens.json`. `make check` enforces this with `git diff --exit-code -- src/styles/tokens/generated .storybook/generated` after a fresh rebuild — if the committed file doesn't byte-for-byte match what the tool just produced, the check (and therefore `prepack` and the publish) fails. This has happened in practice when a repo-wide formatter (oxfmt) reformatted a generated CSS file directly; `.oxfmtrc.json`'s `ignorePatterns` now excludes both generated directories specifically to prevent that recurring. If `make check` fails on a file you didn't intend to touch, run `make build` and commit the regenerated output — don't hand-format it back into place.

## Consumers

The package is public on npm, so consumers can install it without an
organization token:

```bash
pnpm add @ponti-studios/ui
```

### Use the shared web styles

Import the package once from your web app entry point to load the precompiled
theme and component styles:

```tsx
import "@ponti-studios/ui";
```

Components remain available through their named entry points, such as
`@ponti-studios/ui/primitives`. Consumers do not need Tailwind to use the
components' built-in styles. Tailwind is only needed if the app itself wants to
write Tailwind utility classes. The `/native` entry remains platform-specific
and does not load the web stylesheet.

The package publishes compiled ESM and TypeScript declarations, so consumer
bundlers do not need to transpile the library source. The root import loads the
precompiled stylesheet; explicit CSS consumers can use
`@ponti-studios/ui/styles.css`.
