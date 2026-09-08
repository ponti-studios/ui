# 002 — Upgrade to the latest Vitest and TypeScript

- **Status**: READY (research + dry-run probes done, not yet executed — uncommitted)
- **Severity**: LOW (toolchain chore, no runtime/API surface changes; fully covered by existing `make check` / `make test`)
- **Category**: Tooling
- **Estimated scope**: 2 config files (`package.json`, `tsconfig.json`) + `pnpm-lock.yaml`; zero `src/` changes

## Problem

The repo is on an older toolchain that no longer matches what the ecosystem considers "latest":

| Package | Current (repo) | Latest on npm | Gap |
| --- | --- | --- | --- |
| `vitest` | `4.1.10` | `5.0.0` (`V4` tag → `4.1.11`) | 1 major |
| `@vitest/browser` | `4.1.10` | `5.0.0` | 1 major |
| `@vitest/browser-playwright` | `4.1.10` | `5.0.0` | 1 major |
| `typescript` | `6.0.3` | `7.0.2` (native Go port, released 2026-07-08) | 1 major |

Every test in this repo (43 `.stories.tsx` files) runs through `storybookTest()` from `@storybook/addon-vitest` in browser mode (see `vitest.config.ts`: one inline project, Playwright/chromium, plus a second pass with `VITE_STORYBOOK_THEME=dark` via the `Makefile`). That coupling drives the upgrade strategy below.

## Target

- `typescript` → **`7.0.2`** (native, ~8–12× faster `tsc`; repo `tsc --noEmit` is currently ~3.6s). `tsconfig.json` cleaned up so it compiles cleanly under 7.0.2.
- Vitest trio → **`4.1.11`** (the newest **4.x** release, `V4` dist-tag, published 2026-09-05) — pinned exactly and lockstep.
- Vitest **5.0.0** documented as **deferred/blocked** (see "Deferred: Vitest 5.0.0" below) with a ready-to-run migration checklist for when upstream unblocks it.
- Result: `make check` and `make test` stay green with no `src/` changes.

## Facts & research (verified 2026-09-08)

### TypeScript 7.0.2 — verified compatible with a 2-line tsconfig cleanup

The native port is a *hard* break on anything deprecated in 6.0 — no programmatic API ships in 7.0 (`typescript-eslint`, Volar, etc. still need 6.x). That does **not** matter here: `tsc` is invoked only via CLI (`make build` → `pnpm exec tsc --noEmit`), there is **no** `import ... from 'typescript'` anywhere in the repo (grep-verified), lint is `oxlint` (Rust) and format is `oxfmt` (Rust), and Vite/Storybook transpile via esbuild — none use the TypeScript compiler API.

Probe results (throwaway install of `typescript@7.0.2` in `/tmp/ts7probe`; repo untouched):

1. `tsc7 --noEmit -p tsconfig.json` (current file) → **only** error: `TS5102: Option 'baseUrl' has been removed`.
2. `tsc7 --noEmit -p <tsconfig minus baseUrl minus ignoreDeprecations>` → **exit 0, clean**.
3. `tsc6.0.3 --noEmit -p <same adjusted config>` → **exit 0, clean** (no behavior change vs. today).

So the only required changes are deleting two lines from `tsconfig.json`:
- `"baseUrl": "./"` → removed (TS 7 hard error). `paths` are already written relative to the project root (`"./src/*"`, `"./src/index.ts"`), and since `baseUrl` was `"./"` they resolve identically after removal — no path rewrite needed.
- `"ignoreDeprecations": "6.0"` → removed. The TS 7 docs state compatibility is guaranteed only *without* this flag set; it was masking nothing (probe 2 compiled clean without it).

Other TS 7 default changes were audited and are **non-issues** here:
- `strict` (already `true`), `module: esnext`, `moduleResolution: bundler`, `rootDir: ./src` (explicit), `target: ES2020` — all fine; `es5`/`node10`/`amd`/`baseUrl`/`downlevelIteration` (the hard-error list) are all absent.
- `types` now defaults to `[]` (no auto-inclusion of `@types/*`). Verified `src/` has **no** reliance on ambient globals (`process`/`Buffer`/`require`/`__dirname` — grep-verified) and pulls React types in explicitly via imports; `DOM` libs cover `window`/`document`. Probe compiled clean with no `types` entry.
- `esModuleInterop: true` is fine (TS 7 only forbids setting it to `false`).
- `tsc --noEmit` is the only invocation; TS 7 emit/`declaration` differences never run in this repo's CI.

### Vitest — newest supported = 4.1.11; 5.0.0 is genuinely blocked

- `vitest@4.1.11`, `@vitest/browser@4.1.11`, `@vitest/browser-playwright@4.1.11` all exist (companions ship lockstep with `vitest`; the `V4` dist-tag points at `4.1.11`).
- `vitest@4.1.11` engines `^20 || ^22 || >=24` → satisfied (Node `24.18.0` via `.mise.toml`).
- **Vitest 5.0.0 blocker:** `@storybook/addon-vitest` peer-deps are `vitest: ^3 || ^4`, `@vitest/browser: ^3 || ^4`, `@vitest/browser-playwright: ^4`, `@vitest/runner: ^3 || ^4` — across every published version including the latest stable `10.6.0` and even `11.0.0-alpha.0`. The addon's plugin imports `@vitest/browser-playwright` and `vitest/config` and relies on v4 internals; Vitest 5.0 also **deprecates/decouples `@vitest/runner`** (which the addon still peer-depends on). All 43 story tests run through `storybookTest()` → dropping in vitest 5 would fail the peer check and likely break the addon at runtime.
- **Do not** work around it with pnpm `overrides`/`auto-install-peers` forcing — the addon's runtime imports of v4 internals make that a breakage, not a resolution.
- `vitest@5.0.0` requirements (Node `^22.12 || ^24 || >=26`; Vite `^6.4 || ^7 || ^8`) are already satisfied (Node 24.18.0, Vite 8.1.5) — the **only** missing link is addon-vitest's `vitest: ^5` peer.

## Repo conventions to follow

- Vitest companions are already pinned **exact** (`@vitest/browser: "4.1.10"`, `@vitest/browser-playwright: "4.1.10"`); keep that style — pin all three to exact `4.1.11` so the trio can never drift apart.
- `typescript` is pinned exact (`"6.0.3"`); keep it exact at `"7.0.2"`.
- `tsconfig.json` `include: ["src"]` and `paths` are unchanged; only delete `baseUrl` and `ignoreDeprecations`.
- Do **not** hand-edit anything under `src/styles/tokens/generated/`, `.storybook/generated/`, or the lockfile — generated/lockfile changes come from running the build/install commands.
- Toolchain determinism: `make check` / `make test` are the source of truth for "green".

## Steps

### Phase 1 — TypeScript 6.0.3 → 7.0.2 (independent, do first)

1. In `package.json`, set `"typescript": "7.0.2"`.
2. In `tsconfig.json`, delete exactly two lines: `"ignoreDeprecations": "6.0",` and `"baseUrl": "./",`. Leave `paths`, `include`, and everything else untouched.
3. `pnpm install` (updates `pnpm-lock.yaml`; resolves the new `typescript`).
4. Sanity: `pnpm exec tsc --noEmit` → must exit 0. Optionally time it (expect well under the ~3.6s of TS 6 — a good smoke check that the native binary is actually being used: `pnpm exec tsc --version` should print `Version 7.0.2`).
5. `pnpm exec oxlint src` → must pass.
6. Commit.

### Phase 2 — Vitest trio 4.1.10 → 4.1.11 (newest supported 4.x)

7. In `package.json`, set all three to exact `4.1.11`: `vitest`, `@vitest/browser`, `@vitest/browser-playwright`. (Leave `@storybook/addon-vitest` at `10.5.6` — its peers `vitest ^4` are satisfied and it's already in `pnpm-workspace.yaml`'s `minimumReleaseAgeExclude`.)
8. `pnpm install`. **Watch for a release-age hold:** if pnpm refuses/ warns on `4.1.11` (published 2026-09-05, may be inside the workspace's minimum release-age window), add `vitest@4.1.11`, `@vitest/browser@4.1.11`, and `@vitest/browser-playwright@4.1.11` to `minimumReleaseAgeExclude` in `pnpm-workspace.yaml` (mirroring the existing storybook entries) and re-run.
9. Verify resolution is lockstep: `pnpm why vitest @vitest/browser @vitest/browser-playwright` all report `4.1.11`.
10. Run the **full** suite: `make test` (build → storybook light pass + `VITE_STORYBOOK_THEME=dark` pass). All 43 story suites must pass in both themes.
11. Commit.

### Phase 3 — Vitest 5.0.0 (DEFERRED — do NOT attempt until unblocked)

Re-trigger condition: a `@storybook/addon-vitest` release whose peer range includes `vitest: ^5.0.0` (and, in turn, `@vitest/browser: ^5`, `@vitest/browser-playwright: ^5`, and drops/relaxes `@vitest/runner`). Check `npm view @storybook/addon-vitest@latest peerDependencies` before starting; if `^5` is not present, stop.

Status re-checked 2026-09-08: still blocked. `@storybook/addon-vitest` peer-deps remain `vitest ^3 || ^4` on both `latest` (10.6.0) and `next` (11.0.0-alpha.0). Upstream tracking issues (open): `storybookjs/storybook#36082` (adapt `vitest@5` breaking changes for `projects[].extends`) and `storybookjs/storybook#35752` (adapt `vitest@5` for `testNamePattern`). Re-check after either issue closes or a new addon-vitest release appears.

Migration checklist (from the official Vitest 5.0 migration guide, distilled) to run when unblocked:
- Prereqs already OK: Node ≥22.12 (24.18), Vite ≥6.4 (8.1.5).
- Bump `vitest` + `@vitest/browser` + `@vitest/browser-playwright` to exact `5.0.0` (lockstep); keep `@storybook/addon-vitest` on a `^5`-supporting version.
- Config (`vitest.config.ts`): inline projects now default `extends: true` (config already sets it) and `sharedViteServer: true` (config-file/plugin `config` hooks run once instead of per project); `browser.api` removed → move any `browser.api.port` to top-level `api` (repo sets neither — no-op). Config no longer auto-looked-up from parent dirs — the `Makefile` already passes `--config vitest.config.ts`, fine.
- Behavior to grep for after upgrade:
  - `clearMocks` now defaults `true` (mock call history wiped per test) — verify no story/setup records calls outside the test body that later assert on them; set `clearMocks: false` only if needed.
  - Browser locators **strict by default** (`getByText` exact) → expect `expect.element(...)` strictness surprises in story interaction assertions.
  - `toHaveTextContent` is now strict equality (no substring/regex) → substring/regex cases move to `toMatchTextContent`.
  - `vi.mock`/`vi.hoisted` must be **top-level** (nested calls now throw) — check `.stories.tsx`/`.storybook` for nested calls.
  - Unawaited `resolves`/`rejects`/`toMatchFileSnapshot` now **fail the test**; `expect.poll` fails on timeout; `toThrow('')` matches any message.
  - Reporter artifacts move under `.vitest/` (JSON/JUnit now write files by default); worker/`VITEST_POOL_ID` ids are 1-based; `vitest/*` removed entrypoints (`vitest/config` still exists).
- Re-run `make test` (light + dark) and `make check`.

## Boundaries

- Do NOT bump `vite`, `storybook`, `@storybook/*`, React, or any other dependency — only the four packages named in Phases 1–2.
- Do NOT add pnpm `overrides`/peer-force to force vitest 5 in early (Phase 3 only after addon-vitest declares `^5`).
- Do NOT replace or drop `@storybook/addon-vitest`, and do not convert the 43 story tests to hand-written browser tests — out of scope for this plan.
- Do NOT change `tsconfig.json` beyond deleting `baseUrl` and `ignoreDeprecations` (no `paths` rewrites, no `types` entry, no `target`/`module`/`lib` edits).
- Do NOT hand-edit `pnpm-lock.yaml` or generated files.
- If any file drifted from what's described (e.g. `tsconfig.json` no longer has `baseUrl`/`ignoreDeprecations`, or `package.json` versions differ), stop and report instead of improvising.

## Verification

- **Mechanical:**
  - `pnpm exec tsc --version` → `Version 7.0.2`.
  - `pnpm exec tsc --noEmit` → exit 0, no `TS5102`/deprecation errors.
  - `pnpm exec oxlint src` → pass.
  - `make check` → pass (build: style-dictionary + `tsc --noEmit` + generated-file diff + `check-foundations.mjs` + `check-source.mjs` + oxlint).
  - `make test` → pass (all story suites, light + `VITE_STORYBOOK_THEME=dark`).
  - `pnpm why vitest @vitest/browser @vitest/browser-playwright` → all `4.1.11`.
- **Diff scope:** the only source-controlled changes are `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, and (only if the release-age hold hit) `pnpm-workspace.yaml`; nothing under `src/`.
- **Done when:** `make check` and `make test` are green on `typescript@7.0.2` + vitest trio `4.1.11`, and Phase 3 (vitest 5) is confirmed deferred with the addon-vitest peer range documented in this plan.

## Rollback

- `git checkout -- package.json tsconfig.json pnpm-lock.yaml` (plus `pnpm-workspace.yaml` if touched), then `pnpm install` to restore the installed tree. No `src/` files are affected, so there is nothing to restore there.
- If a Phase 3 (vitest 5) attempt misbehaves after the re-trigger condition is met, the same rollback applies for the bump commit; the addon-vitest version should be reverted to the last `^4`-supporting one.

## Deferred: Vitest 5.0.0 (summary for the record)

Newest `vitest` on npm is `5.0.0`, but adopting it is currently **blocked upstream**: `@storybook/addon-vitest` (even `11.0.0-alpha.0`) peer-depends on `vitest ^3 || ^4` / `@vitest/browser ^3 || ^4` / `@vitest/runner ^3 || ^4`, and vitest 5 deprecates/decouples `@vitest/runner`. All 43 story tests in this repo are run through that addon, so the safe "newest adoptable" Vitest is `4.1.11` (the `V4` tag). This plan ships Phases 1–2 now and Phase 3 as a tracked, ready-to-run migration for the moment the addon declares `vitest: ^5`.
