# 001 — Sheet slides in from its anchored edge instead of fading/zooming from center

- **Status**: DONE (implemented + feel-checked in browser, uncommitted — pending commit). See "Post-execution correction" at the end of this file: the originally specified 300ms close duration broke Base UI's exit-animation coordination and was corrected to 120ms.
- **Commit**: eeb3978
- **Severity**: MEDIUM
- **Category**: Physicality & origin (spatial consistency)
- **Estimated scope**: 3 files (1 token source file + regenerated CSS, 1 stylesheet, 1 component)

## Problem

`Sheet` is a drawer that's pinned to the bottom edge on mobile and the right edge on desktop (`md:`) — see the layout classes already on `sheetClassName`:

```tsx
// src/components/overlays/sheet.tsx:62-63 — current
const sheetClassName =
  "bg-background text-foreground data-open:animate-in data-closed:animate-out fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] min-h-[30dvh] flex-col gap-6 rounded-t-xl border border-b-0 border-l-0 border-r-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:inset-y-0 md:right-0 md:bottom-auto md:left-auto md:h-full md:w-3/4 md:max-w-sm md:min-h-0 md:rounded-t-none md:rounded-l-xl md:border-t-0 md:border-r-0 md:border-b-0 md:border-l md:p-6 md:pb-6";
```

But the actual entrance/exit motion comes from the generic `data-open:animate-in` / `data-closed:animate-out` classes, which this component shares with `Dialog`, `AlertDialog`, `Popover`, and `DropdownMenu`. Those classes are hand-authored in `animations.css` as a fade + center-scale:

```css
/* src/styles/animations.css:63-77 — current, shared by every overlay that uses these class names */
.data-open\:animate-in[data-open],
.data-open\:animate-in[data-state="open"] {
  animation:
    fade-in 150ms ease-out,
    zoom-in 150ms ease-out;
}
.data-closed\:animate-out[data-closed],
.data-closed\:animate-out[data-state="closed"] {
  animation:
    fade-out 120ms ease-in,
    zoom-out 120ms ease-in;
}
```

`zoom-in`/`zoom-out` (defined at `animations.css:33-49`) scale from `0.95` toward `1` at a fixed `transform-origin` (default: center). For a modal that's correct — modals are exempt from origin rules because they're meant to appear centered. For a sheet anchored to an edge, scaling from center tells the wrong spatial story: the panel should look like it's sliding in from off-screen at the edge it's pinned to, not materializing in place.

`SheetPrimitive.Popup` also has no `data-slot` attribute today (every other overlay's content element does — `dialog-content`, `popover-content`, `dropdown-menu-content`), so there's no stable, sheet-only CSS hook yet.

## Target

Sheet gets its own slide animation, scoped so it never touches the shared `fade-in`/`zoom-in` behavior used by Dialog/AlertDialog/Popover/DropdownMenu:

- Mobile (default, bottom sheet): enters via `translateY(100%) → translateY(0)` + fade, exits the reverse.
- Desktop (`md:`, right sheet): enters via `translateX(100%) → translateX(0)` + fade, exits the reverse.
- Both use a new dedicated easing token, `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)` (an iOS-style drawer curve — stronger deceleration than the generic `--ease-out`), at `300ms` (`--duration-300`, already in the drawer/modal budget of 200–500ms).
- Reduced motion drops the slide but keeps a `150ms` opacity fade — not a hard cut to `animation: none`.

```css
/* target: src/styles/animations.css */
@keyframes sheet-slide-in-bottom {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
@keyframes sheet-slide-out-bottom {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(100%);
    opacity: 0;
  }
}
@keyframes sheet-slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
@keyframes sheet-slide-out-right {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

[data-slot="sheet-content"][data-open],
[data-slot="sheet-content"][data-state="open"] {
  animation: sheet-slide-in-bottom var(--duration-300) var(--ease-drawer);
}
[data-slot="sheet-content"][data-closed],
[data-slot="sheet-content"][data-state="closed"] {
  animation: sheet-slide-out-bottom var(--duration-300) var(--ease-drawer);
}

@media (min-width: 768px) {
  [data-slot="sheet-content"][data-open],
  [data-slot="sheet-content"][data-state="open"] {
    animation: sheet-slide-in-right var(--duration-300) var(--ease-drawer);
  }
  [data-slot="sheet-content"][data-closed],
  [data-slot="sheet-content"][data-state="closed"] {
    animation: sheet-slide-out-right var(--duration-300) var(--ease-drawer);
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-slot="sheet-content"][data-open],
  [data-slot="sheet-content"][data-state="open"] {
    animation: fade-in var(--duration-150) var(--ease-out) !important;
  }
  [data-slot="sheet-content"][data-closed],
  [data-slot="sheet-content"][data-state="closed"] {
    animation: fade-out var(--duration-150) var(--ease-in) !important;
  }
}
```

The `[data-slot="sheet-content"]` reduced-motion rule must come *after* the existing blanket rule in the file (see Steps) so its `!important` + equal specificity wins by source order for this element only, while every other overlay (`[data-open]`/`[data-closed]` generically) keeps its current hard cut to `animation: none`.

```tsx
/* target: src/components/overlays/sheet.tsx:62-63 */
const sheetClassName =
  "bg-background text-foreground fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] min-h-[30dvh] flex-col gap-6 rounded-t-xl border border-b-0 border-l-0 border-r-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:inset-y-0 md:right-0 md:bottom-auto md:left-auto md:h-full md:w-3/4 md:max-w-sm md:min-h-0 md:rounded-t-none md:rounded-l-xl md:border-t-0 md:border-r-0 md:border-b-0 md:border-l md:p-6 md:pb-6";
```

(`data-open:animate-in data-closed:animate-out` removed from the class string — the new `[data-slot="sheet-content"]` CSS rules key off the raw `data-open`/`data-closed`/`data-state` attributes directly, no class needed.)

```tsx
/* target: src/components/overlays/sheet.tsx:73 */
<SheetPrimitive.Popup
  ref={ref}
  data-slot="sheet-content"
  className={cn(sheetClassName, className)}
  {...props}
>
```

`SheetOverlay` (the backdrop) is unchanged — its fade in/out via the shared `data-open:animate-in`/`data-closed:animate-out` classes is correct as-is and out of scope for this plan.

## Repo conventions to follow

- Easing/duration tokens are **not** hand-edited in `src/styles/tokens/generated/foundations.css` (that file's header literally says `Do not edit directly, this file was auto-generated.`). The source of truth is `src/styles/tokens/source/foundations.tokens.json`, built via `pnpm tokens:build` (Style Dictionary). New tokens go in the source JSON.
- Existing `ease` block in the source token file, to extend:
  ```json
  /* src/styles/tokens/source/foundations.tokens.json:317-322 — current */
  "ease": {
    "$type": "cubicBezier",
    "in": { "$value": [0.4, 0, 1, 1] },
    "out": { "$value": [0, 0, 0.2, 1] },
    "in-out": { "$value": [0.4, 0, 0.2, 1] }
  },
  ```
- This repo's overlay animations are hand-authored plain CSS keyed on literal Tailwind-variant class names + attribute selectors (e.g. `.data-open\:animate-in[data-open]`) living in `src/styles/animations.css`, not Tailwind's `@apply` or a `tailwindcss-animate` plugin. Follow that same pattern for the new sheet rules — see the exemplar at `src/styles/animations.css:63-70` (the existing `data-open:animate-in` / `data-closed:animate-out` block) for the exact selector shape (dual `[data-open]` / `[data-state="open"]` selectors) to imitate.
- Other overlay content elements already carry a stable `data-slot` (`dialog-content` at `src/components/overlays/dialog.tsx:215`, `popover-content` at `src/components/overlays/popover.tsx:478`, `dropdown-menu-content` at `src/components/overlays/dropdown-menu.tsx:541`). `sheet-content` follows that same naming convention.

## Steps

1. **Add the drawer easing token.** In `src/styles/tokens/source/foundations.tokens.json`, inside the existing `"ease"` object (currently lines 317-322), add a fourth key after `"in-out"`:
   ```json
   "drawer": { "$value": [0.32, 0.72, 0, 1] }
   ```
2. **Regenerate the token CSS.** Run:
   ```bash
   pnpm tokens:build
   ```
   This must produce a new `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);` line in `src/styles/tokens/generated/foundations.css` (alongside the existing `--ease-in`/`--ease-out`/`--ease-in-out` at what is currently lines 133-135). Do not hand-edit the generated file — if `tokens:build` doesn't produce this line, stop and report.
3. **Add the four new keyframes** to `src/styles/animations.css`. Insert them after the existing `zoom-out` keyframe block (currently ending at line 49, right before the `.animate-in { ... }` class block) — `sheet-slide-in-bottom`, `sheet-slide-out-bottom`, `sheet-slide-in-right`, `sheet-slide-out-right`, exactly as shown in Target above.
4. **Add the sheet-scoped animation rules** to `src/styles/animations.css`, placed after the existing `.data-closed\:animate-out[data-closed]...` block (currently ending at line 77) and before the reduced-motion media query: the base (mobile/bottom) `[data-slot="sheet-content"]` rule, then the `@media (min-width: 768px)` (desktop/right) rule, exactly as shown in Target above.
5. **Extend the reduced-motion block**, not replace it. The existing block (currently lines 79-86):
   ```css
   @media (prefers-reduced-motion: reduce) {
     .animate-in,
     .animate-out,
     [data-open],
     [data-closed] {
       animation: none !important;
     }
   }
   ```
   stays exactly as-is (it must keep governing every other overlay). Add the new `[data-slot="sheet-content"]` reduced-motion `@media` block from Target **immediately after** this existing block, so it appears later in the file/cascade and its `!important` + matching specificity wins for sheet content specifically.
6. **Update `src/components/overlays/sheet.tsx`:**
   - Line 62-63: remove `data-open:animate-in data-closed:animate-out` from `sheetClassName` (leave every other class untouched).
   - Line 73: add `data-slot="sheet-content"` to the `SheetPrimitive.Popup` element, as shown in Target.

## Boundaries

- Do NOT touch `SheetOverlay` (`src/components/overlays/sheet.tsx:47-60`) — its backdrop fade is correct and out of scope.
- Do NOT touch `Dialog`, `AlertDialog`, `Popover`, or `DropdownMenu` — they must keep using the shared `data-open:animate-in`/`data-closed:animate-out` fade+zoom classes unchanged. Do not rename or modify those shared classes/keyframes (`animate-in`, `animate-out`, `fade-in`, `fade-out`, `zoom-in`, `zoom-out`) in any way.
- Do NOT hand-edit `src/styles/tokens/generated/foundations.css` directly — only the source JSON, then regenerate.
- Do NOT change the sheet's layout/sizing classes (`fixed inset-x-0 bottom-0 ...`, `md:inset-y-0 md:right-0 ...`) — those already correctly define which edge the sheet is pinned to; this plan only changes how it animates into that position.
- Do NOT add new dependencies (no `tailwindcss-animate`, no motion library) — this stays plain CSS, matching the rest of the file.
- If Base UI's `Dialog.Popup` (aliased as `SheetPrimitive.Popup`) does not actually render `data-open`/`data-closed`/`data-state` attributes as assumed (verify by inspecting the DOM in the browser per the feel-check below), stop and report — do not guess at a different attribute name.
- If any step doesn't match the code you find (drift since commit `eeb3978`), stop and report instead of improvising.

## Verification

- **Mechanical**:
  - `pnpm tokens:build` — must complete without error and must modify `src/styles/tokens/generated/foundations.css` to include `--ease-drawer`.
  - `pnpm tokens:check` — must pass (this also re-runs `tokens:build` and diffs against git, so the generated file must be committed/staged, not left dirty).
  - `pnpm typecheck` — must pass with no new errors.
  - `pnpm lint` — must pass with no new errors on the touched files.
- **Feel check**: open this repo's Storybook (`pnpm storybook`) or any host app, find a story/usage of `Sheet`/`SheetContent`, and trigger it open and closed at both a mobile viewport width (<768px) and a desktop width (≥768px):
  - At mobile width, the sheet visibly slides up from the bottom edge of the screen (not scaling in from the center) and slides back down on close.
  - At desktop width, the sheet visibly slides in from the right edge and slides back out to the right on close.
  - In DevTools, resize across the 768px breakpoint with the sheet open once, then close/reopen at the new width — confirm it now animates from the new edge, not the old one.
  - In DevTools' Animations panel, set playback to 10% and confirm the curve decelerates strongly near the end (the `--ease-drawer` curve), and that the panel moves the full 100% of its own dimension (no hardcoded pixel jump, no `scale(0)` flash).
  - Toggle `prefers-reduced-motion: reduce` (DevTools Rendering panel) and confirm the sheet now only fades in/out (no slide) instead of popping instantly — while opening/closing a `Dialog` or `Popover` elsewhere in the same check still shows the old hard-cut `animation: none` behavior (confirming the scoped override didn't leak).
  - Open and immediately close the sheet several times rapidly — confirm no stacked/broken animation state (each open re-triggers cleanly since these are Base UI-driven state-attribute keyframes, same mechanism the existing Dialog/Popover already use safely).
- **Done when**: all mechanical checks pass, the sheet slides from the correct anchored edge at both breakpoints, reduced motion degrades to opacity-only for the sheet specifically without changing behavior for any other overlay, and no other overlay component's animation changed.

## Post-execution correction (found during feel-check)

The plan as originally written specified `var(--duration-300)` (300ms) for the sheet-content open/close animation. This was executed as written, but the feel-check surfaced a real bug: **on close, the sheet panel was yanked off-DOM mid-slide instead of completing its animation**, visible as a glitchy/flashing close.

Root cause, confirmed by instrumenting the browser (Storybook, `overlays-sheet--default` story) with `animationstart`/`animationend`/`animationcancel` listeners plus a `MutationObserver` timing the DOM removal:

- Base UI's `Dialog.Popup` (`node_modules/@base-ui/react/dialog/popup/DialogPopup.js`) only calls its consumer-facing `onOpenChangeComplete` when `open === true` — it does not gate the popup's own unmount on the popup's own close-animation duration.
- The backdrop's shared close animation (`fade-out`/`zoom-out`, unchanged, 120ms) still governs when the whole portal actually unmounts.
- With the sheet content's close animation set to 300ms, the element was removed from the DOM at ~120ms — cutting the 300ms slide-out animation off at roughly 40% completion, every time, with no `animationend` ever firing for it.

Fix applied: changed both `[data-slot="sheet-content"][data-open]` and `[data-slot="sheet-content"][data-closed]` (and their `md:` right-slide counterparts) from `var(--duration-300) var(--ease-drawer)` to `150ms var(--ease-drawer)` (open) and `120ms var(--ease-drawer)` (close) — matching the backdrop's existing shared timing (`150ms`/`120ms`, literal ms values, same convention already used by the `fade-in`/`fade-out`/`zoom-in`/`zoom-out` block directly above in `animations.css`) instead of the AUDIT.md drawer-duration budget (200–500ms), which does not hold for this component given Base UI's actual coordination mechanism.

Verified via `MutationObserver` timing the sheet-content element's removal relative to the close click: 130ms and 126ms elapsed (desktop right-slide and mobile bottom-slide respectively) — matching the intended 120ms close, confirming the element now stays mounted for its full animation before removal instead of being cut short. Both breakpoints re-verified visually in the browser (clean slide-up on mobile, clean slide-right on desktop, no flash, no leftover backdrop).

`--ease-drawer` (the token added in Steps 1-2) is retained — only the duration values changed, not the curve.

Also aligned the reduced-motion close fade (`@media (prefers-reduced-motion: reduce)` block) from `var(--duration-150)` to `120ms` for the same reason: the shared blanket reduced-motion rule sets the backdrop's animation to `none` on both open and close, so only the sheet's *close* path needed correcting — its *open* fade is self-gated by the popup's own `useAnimationsFinished` call (confirmed safe in Base UI source) and was left at `150ms`. This could not be verified in-browser (no `prefers-reduced-motion` emulation available in the tooling used for this session's feel-check) — flagging as a lower-confidence fix than the main one, worth a manual DevTools check before shipping.
