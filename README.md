# @ponti-studios/ui

The canonical Ponti Studios UI package. It is published from this repository to GitHub Packages.

## Design

The design system is documented in `docs/`:

- [Foundations](./docs/foundations.md) — color, spacing, radius, typography, elevation, iconography, motion tokens
- [Primitives](./docs/primitives.md) — component contracts (variants, sizes, states)
- [Patterns](./docs/patterns.md) — screen composition rules
- [Review gates](./docs/review-gates.md) — pass/fail review criteria

## Development

Common development workflows are available through the `Makefile`:

```bash
make check          # tokens, source contracts, and typecheck
make tokens-build   # regenerate token artifacts
make storybook      # build Storybook themes and start Storybook
make test-a11y      # run light and dark accessibility tests
```

The existing `pnpm run` scripts delegate to these targets for compatibility.

## Release

Releases are owned by [release-please](https://github.com/googleapis/release-please), not by hand-edited version numbers or manually pushed tags. The `.github/workflows/publish.yml` workflow runs after a successful `validate` push to `main`:

1. **`release-please`** — maintains a root-package release PR, updating `package.json`, `.release-please-manifest.json`, and `CHANGELOG.md` from Conventional Commit history.
2. **`publish`** — when that release PR is merged, checks out the exact release tag and publishes it to GitHub Packages. `workflow_dispatch` is the break-glass recovery path for a previously created release tag.

**So the actual release flow is:**

1. Land commits using [Conventional Commits](https://www.conventionalcommits.org/) — `fix:` → patch, `feat:` → minor, and `feat!:` or a `BREAKING CHANGE:` footer → major. Use `fix:` when the intended release is a patch.
2. Once on `main`, find or wait for the `chore(main): release ui X.Y.Z` PR that Release Please opens or updates.
3. Review and merge it. That merge creates the `ui-v<version>` tag; after validation succeeds, the release workflow publishes that exact tag automatically.

`prepack` (`tokens:check && check:source && typecheck`) runs as part of `pnpm install`/publish tooling and is the last gate before anything reaches npm — see "Generated files" below for the failure mode that most commonly trips it.

### Generated files must never be hand-edited

`src/styles/tokens/generated/**` and `.storybook/generated/**` are produced only by `pnpm run tokens:build` (style-dictionary) from the DTCG source in `src/styles/tokens/source/*.tokens.json`. `tokens:check` enforces this with `git diff --exit-code -- src/styles/tokens/generated` after a fresh rebuild — if the committed file doesn't byte-for-byte match what the tool just produced, the check (and therefore `prepack` and the publish) fails. This has happened in practice when a repo-wide formatter (oxfmt) reformatted a generated CSS file directly; `.oxfmtrc.json`'s `ignorePatterns` now excludes both generated directories specifically to prevent that recurring. If `tokens:check` fails on a file you didn't intend to touch, run `pnpm run tokens:build` and commit the regenerated output — don't hand-format it back into place.

## Consumers

Configure the npm registry in the consumer repository:

```ini
@ponti-studios:registry=https://npm.pkg.github.com
```

Consumers that need authentication should configure a token outside the committed project `.npmrc`:

```bash
pnpm config set --location=user //npm.pkg.github.com/:_authToken "$NODE_AUTH_TOKEN"
```

CI consumers should use a secret-backed npm token with read access.

### Ships TypeScript source, not a bundle

This package has no build output — every `exports` entry resolves to a file under `src/`. Consumers are expected to transpile the package themselves (Vite, Metro, Next, etc. all do this for workspace/npm packages by default). Tailwind v4 class detection for consumers of `./styles.css` requires an `@source` directive pointing at the installed package's `src/`, e.g.

```css
@import "tailwindcss";
@import "@ponti-studios/ui/styles.css";
@source "../../../node_modules/@ponti-studios/ui/src";
```

**Important:** `./styles.css` uses `@reference "tailwindcss"` (it does not import Tailwind itself). Your project owns the `@import "tailwindcss"` — place it before the UI stylesheet. Omitting it will cause missing CSS variables (e.g. `--tw-shadow-color`) and unresolved utilities.

### `./native` subpath

`@ponti-studios/ui/native` is the only part of the package that imports `react-native`. Web consumers never pull it in; native consumers get `createMakeStyles`, `nativeShadows`, `useColorMode`, and `useThemeColors`. `react-native` is an optional peer dependency — only declare it in your own `package.json` if you actually import from this subpath.
