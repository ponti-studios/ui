# Animation plans

| # | Title | Severity | Status |
| --- | --- | --- | --- |
| [001](001-sheet-slide-from-edge.md) | Sheet slides in from its anchored edge instead of fading/zooming from center | MEDIUM | DONE (uncommitted) |
| [002](002-vitest-typescript-upgrade.md) | Upgrade to latest Vitest (4.1.11 now; 5.0.0 deferred) and TypeScript (7.0.2) | LOW | READY (research done, not executed) |

## Execution order

- **001** runs standalone: `improve-animations execute 001-sheet-slide-from-edge.md`, or hand `plans/001-sheet-slide-from-edge.md` to any agent directly.
- **002** is independent of 001. Run it standalone: hand `plans/002-vitest-typescript-upgrade.md` to any agent. It is self-contained — no dependencies. Note that its Phase 3 (Vitest 5.0.0) is intentionally deferred pending `@storybook/addon-vitest` adding a `vitest: ^5` peer range.
