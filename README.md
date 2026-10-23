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
release. It includes Tailwind v4, the shared stylesheet and source scanning,
strict TypeScript settings, and a first screen using the shared Button.

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

`prepack` (`make check`) runs as part of `pnpm install`/publish tooling and is the last gate before anything reaches npm — see "Generated files" below for the failure mode that most commonly trips it.

### Generated files must never be hand-edited

`src/styles/tokens/generated/**` and `.storybook/generated/**` are produced only by `make build` (style-dictionary) from the DTCG source in `src/styles/tokens/source/*.tokens.json`. `make check` enforces this with `git diff --exit-code -- src/styles/tokens/generated .storybook/generated` after a fresh rebuild — if the committed file doesn't byte-for-byte match what the tool just produced, the check (and therefore `prepack` and the publish) fails. This has happened in practice when a repo-wide formatter (oxfmt) reformatted a generated CSS file directly; `.oxfmtrc.json`'s `ignorePatterns` now excludes both generated directories specifically to prevent that recurring. If `make check` fails on a file you didn't intend to touch, run `make build` and commit the regenerated output — don't hand-format it back into place.

## Consumers

The package is public on npm, so consumers can install it without an
organization token:

```bash
pnpm add @ponti-studios/ui
```

### Ships TypeScript source, not a bundle

This package has no build output — every `exports` entry resolves to a file under `src/`. Consumers are expected to transpile the package themselves (Vite, Metro, Next, etc. all do this for workspace/npm packages by default). Tailwind v4 class detection for consumers of `./styles.css` requires an `@source` directive pointing at the installed package's `src/`, e.g.

```css
@import "tailwindcss";
@import "@ponti-studios/ui/styles.css";
@source "../../../node_modules/@ponti-studios/ui/src";
```

**Important:** `./styles.css` uses `@reference "tailwindcss"` (it does not import Tailwind itself). Your project owns the `@import "tailwindcss"` — place it before the UI stylesheet. Omitting it will cause missing CSS variables (e.g. `--tw-shadow-color`) and unresolved utilities.
