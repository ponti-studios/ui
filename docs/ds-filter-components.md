---
tags: [design-system, components, refactor, plan, tdd]
---

# Design System — Filter & Search Components Refactor (TDD)

## Problem

Three new components (`FilterSelect`, `ActiveFiltersBar`, `SearchFilterBar`) were moved from career into `@ponti-studios/ui`. They work, but carry inherited design debt: duplicate concerns (EntitySelect), brittle compound-component patterns, inconsistent "all"/empty-value conventions, missing accessibility, bugs in shared hooks (`useFilterState`), and ~50 lines of duplicated boilerplate per consumer route.

Their stories have no `play` functions — they're visual-only and untestable.

---

## Testing infrastructure

| Layer | Tool | How it's used |
|---|---|---|
| Interaction tests | `storybook/test` + Vitest | `play()` functions assert behavior at the browser level |
| Test runner | `@storybook/addon-vitest` | Pulls `play()` from stories into Vitest with headless Chromium |
| Accessibility | `@storybook/addon-a11y` | `test: "error"` — every story must pass axe-core or CI fails |
| Visual regression | `@chromatic-com/storybook` | Chromatic snapshots every story variant |
| Unit tests (hooks) | Vitest (`.test.ts` files) | For `useFilterState` and `useDerivedFilterState` — pure logic, no DOM needed |

### Conventions

- Imports from `"storybook/test"` (not `@storybook/test`)
- Default export: `satisfies Meta<typeof Component>`
- Stateful stories use internal `render` functions (not `args`), since filter components are controlled
- Every public variant gets a named story with a `play` function
- Stories target the `"Forms"`, `"DataDisplay"`, `"Layout"` sort order

### Test commands

```bash
pnpm test          # vitest --run (storybook interaction tests)
pnpm test:a11y     # vitest --run (same config, a11y addon enforces axe)
pnpm typecheck     # tsc --noEmit
pnpm lint          # oxlint src --fix
```

---

## Analysis

### 1. FilterSelect + EntitySelect — two components, same problem

| | FilterSelect | EntitySelect |
|---|---|---|
| Options shape | `{ value: T, label }` (generic) | `{ id: string, name }` |
| "All" convention | `''` → internal `__all__` | `"all"` as literal value |
| `isLoading` / `emptyLabel` | Missing | Has both |
| `disabled` | Missing | Missing |
| Label rendering | Raw `<label>` tag | DS `<Label>` primitive |
| `className` prop | Missing (`flex-1` hardcoded) | Supported |
| Used in production? | Yes (career × 4 routes) | **No — dead code** |

The generic `<T extends string>` is decorative: `onChange` fires `T | ''`, which erases to `string` at the call site. No consumer gets discriminated typing.

EntitySelect renders loading/empty states as disabled `<SelectItem>` entries — selecting one closes the dropdown with no visual feedback. These should be non-interactive footer sections inside `<SelectContent>`.

### 2. "All" / empty-value — three conventions, no consistency

| Convention | Where |
|---|---|
| `''` (empty string) | FilterSelect `onChange`; career URL param defaults |
| `"all"` | EntitySelect; finance Zustand store default |
| `__all__` | FilterSelect internal sentinel |

`null` is TypeScript's idiomatic absence-of-value. The `__all__` sentinel must stay internal because the base `<Select>` component (from `@base-ui/react`) rejects `null` via `if (value !== null) onValueChange?.(value)`. External API uses `null`; the component maps to `'__all__'` internally.

### 3. SearchFilterBar — compound-component footguns

**`.Search` sub-component is pure indirection.** It adds a `child.type ===` slot-detection check that breaks with `memo()`, `forwardRef()`, or any HOC — just to wrap `<Input>` and convert an event, which is one line of consumer code.

**`.Results` is just a positioned `<div>`** — a prop pretending to be a sub-component.

**Architecture problem — mixed paradigms.** The compound pattern offers no value beyond what three named props + CSS can do. Kill it entirely.

**Other issues:** Clear button has no `aria-label`. Responsive breakpoints are hardcoded (`lg:flex-row`, `sm:w-48`, `lg:ml-auto`).

### 4. ActiveFiltersBar — missing ergonomics + sort/filter conflation

- No `className` prop, no `onClearAll`, no ARIA roles
- Finance pushes sort chips into the same `filters` array. `ActiveFilter` has no discriminator — a sort chip and a filter chip are structurally identical, but `onRemove` means different things
- The filter chip's `role="group"` on each chip is at odds with treating the bar as a `role="list"`

### 5. `useFilterState` — silent bugs

1. `clearFilters` and `resetFilters` are 100% identical — remove `resetFilters`
2. Stale closure in debounced `setFilters` — the `useCallback` captures `filters` from render, debounce fires with stale state
3. `onFiltersChange` fires twice per change (immediate + debounced) — should fire exactly once after the debounce window when `debounceMs` is set

### 6. Consumer boilerplate — ~50 lines repeated per route

Every career route hand-codes URL-synced filter state, `activeFilters` array construction, `clearFilters`, and `hasActiveFilters`. Identical pattern across 4 files.

---

## Plan

### Order of operations

```
P0: FilterSelect (rewrite + stories with play + delete EntitySelect)
  ↓
P0: SearchFilterBar (rewrite + stories with play)
  ↓
P1: ActiveFiltersBar (enhance + stories with play)
  ↓
P1: useFilterState (fix bugs + .test.ts)
  ↓
P2: useDerivedFilterState (create + .test.ts)
  ↓
P3: Mobile filter UX (design spec only, no code)
```

---

## P0 — FilterSelect rewrite (TDD)

### Test contract

Every state gets a named story. Each story has a `play` function that asserts behavior at the DOM level. Stories are the test cases — there are no separate `.test.tsx` files for components.

#### Story: `Default`
- **Render:** `value={null}`, 3 options, label="Status", placeholder="All statuses"
- **Play:** Verifies the trigger has accessible name "Status". Opens the select. Verifies "All statuses" item is present and marked as selected. Verifies all 3 options are present in the dropdown.

#### Story: `WithValue`
- **Render:** `value="active"`, same options
- **Play:** Verifies the trigger displays "Active" (the selected option's label). Opens the select. Verifies "Active" is selected. Selects "Interview". Verifies `onChange` was called with `"interview"`. Verifies trigger now displays "Interview".

#### Story: `WithNullValue` (selects "All")
- **Render:** `value="active"`, same options
- **Play:** Opens the select. Selects the "All statuses" placeholder item. Verifies `onChange` was called with `null`.

#### Story: `NoLabel`
- **Render:** `value={null}`, no `label` prop, placeholder="Filter by role"
- **Play:** Verifies the trigger has accessible name "Filter by role" (falls back to placeholder for `aria-label`). No `<label>` element in the DOM.

#### Story: `Loading`
- **Render:** `value={null}`, `isLoading={true}`, options=[] (ignored during loading)
- **Play:** Opens the select. Verifies "Loading…" text is visible in the content. Verifies no `<SelectItem>` for loading (it's a non-interactive div, not a selectable option). Verifies the "All" placeholder item is still present.

#### Story: `Empty`
- **Render:** `value={null}`, `isLoading={false}`, `options=[]`, `emptyLabel="No statuses found"`
- **Play:** Opens the select. Verifies "No statuses found" text is visible. Verifies no options are rendered. Verifies the placeholder/All item is still present.

#### Story: `Disabled`
- **Render:** `value="active"`, `disabled={true}`
- **Play:** Verifies the trigger button is disabled. Clicks the trigger and verifies the dropdown does NOT open (or the trigger cannot receive interaction).

#### Story: `WithClassName`
- **Render:** `value={null}`, `className="w-64"`
- **Play:** Verifies the root wrapper element has class `w-64` (not hardcoded `flex-1`).

#### Story: `Accessibility`
- **Play:** Runs axe-core automatically via `@storybook/addon-a11y` (`test: "error"` config). No manual assertions needed — the addon enforces this. If axe-core finds violations, the story fails.

### Target API

```
FilterSelect
├── value: string | null              ← null = "show all" (replace '')
├── onChange: (value: string | null) => void
├── options: { value: string; label: string }[]   ← drop generic <T>
├── label?: string                    ← rendered with <Label> primitive
├── placeholder?: string
├── disabled?: boolean                ← new
├── isLoading?: boolean               ← new (from EntitySelect)
├── emptyLabel?: string               ← new (from EntitySelect)
├── className?: string                ← new (replaces hardcoded flex-1)
├── id?: string
```

**Loading/empty rendering:** Non-interactive footer sections inside `<SelectContent>` — a `<div>` that doesn't participate in selection, not a disabled `<SelectItem>`.

**Internal `__all__` mapping:** External `value={null}` maps to internal `selectValue='__all__'`. Selecting the sentinel fires `onChange(null)`. The sentinel string must not be valid as a user-supplied option value (enforced: `__all__` is reserved, options cannot use it).

### Consumer changes (career, 4 files)

Each `value=''` → `value={null}`; each `onChange('')` → `onChange(null)`.

### Files

| Action | Path |
|---|---|
| **Rewrite** | `src/components/forms/filter-select.tsx` |
| **Rewrite** | `src/components/forms/filter-select.stories.tsx` |
| **Delete** | `src/components/forms/entity-select.tsx` |
| **Delete** | `src/components/forms/entity-select.stories.tsx` |
| **Edit** | `src/components/forms/index.ts` (remove EntitySelect exports) |
| **Edit** | `docs/primitives.md` (remove EntitySelect section) |

### Storybook story structure

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useState } from 'react';
import { FilterSelect } from './filter-select';

const meta = {
  title: 'Forms/FilterSelect',
  component: FilterSelect,
  tags: ['autodocs'],
  args: {
    options: [
      { value: 'active', label: 'Active' },
      { value: 'interview', label: 'Interview' },
      { value: 'offer', label: 'Offer' },
      { value: 'rejected', label: 'Rejected' },
      { value: 'archived', label: 'Archived' },
    ],
    placeholder: 'All statuses',
  },
} satisfies Meta<typeof FilterSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: null, label: 'Status' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Status' });
    await expect(trigger).toBeInTheDocument();

    await userEvent.click(trigger);
    const listbox = canvas.getByRole('listbox');
    await expect(listbox).toBeInTheDocument();
    await expect(within(listbox).getByRole('option', { name: 'All statuses' })).toHaveAttribute('aria-selected', 'true');
    for (const opt of meta.args.options) {
      await expect(within(listbox).getByRole('option', { name: opt.label })).toBeInTheDocument();
    }
  },
};

export const WithValue: Story = {
  args: { value: 'active', label: 'Status' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Status' });
    await expect(trigger).toHaveTextContent('Active');

    await userEvent.click(trigger);
    const listbox = canvas.getByRole('listbox');
    await expect(within(listbox).getByRole('option', { name: 'Active' })).toHaveAttribute('aria-selected', 'true');
  },
};

export const SelectsAll: Story = {
  args: { value: 'active', label: 'Status' },
  render: function Render(args) {
    const [value, setValue] = useState<string | null>('active');
    return <FilterSelect {...args} value={value} onChange={setValue} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('combobox', { name: 'Status' }));
    const listbox = canvas.getByRole('listbox');
    await userEvent.click(within(listbox).getByRole('option', { name: 'All statuses' }));
    // After selecting "All", the trigger should display the placeholder
    const trigger = canvas.getByRole('combobox', { name: 'Status' });
    await expect(trigger).toHaveTextContent('All statuses');
  },
};

export const Loading: Story = {
  args: { value: null, isLoading: true, options: [], label: 'Status' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('combobox', { name: 'Status' }));
    const listbox = canvas.getByRole('listbox');
    await expect(within(listbox).getByText('Loading…')).toBeInTheDocument();
    // The All placeholder should still be present
    await expect(within(listbox).getByRole('option', { name: 'All statuses' })).toBeInTheDocument();
    // No selectable options rendered during loading
    expect(within(listbox).queryAllByRole('option').length).toBe(1); // only "All"
  },
};

export const Empty: Story = {
  args: { value: null, options: [], emptyLabel: 'No statuses found', label: 'Status' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('combobox', { name: 'Status' }));
    const listbox = canvas.getByRole('listbox');
    await expect(within(listbox).getByText('No statuses found')).toBeInTheDocument();
    expect(within(listbox).queryAllByRole('option').length).toBe(1); // only "All"
  },
};

export const Disabled: Story = {
  args: { value: 'active', disabled: true, label: 'Status' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Status' });
    await expect(trigger).toBeDisabled();
    await userEvent.click(trigger);
    // Dropdown should not open — assert no listbox appears
    expect(canvas.queryByRole('listbox')).toBeNull();
  },
};

export const WithClassName: Story = {
  args: { value: null, className: 'w-64', label: 'Status' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The root wrapper div should have the custom class
    const root = canvas.getByRole('combobox', { name: 'Status' }).closest('.w-64');
    await expect(root).toBeInTheDocument();
  },
};

export const NoLabel: Story = {
  args: { value: null, placeholder: 'Filter by role' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Filter by role' });
    await expect(trigger).toBeInTheDocument();
    // No <label> element in DOM
    expect(canvas.queryByRole('label')).toBeNull();
  },
};
```

---

## P0 — SearchFilterBar rewrite (TDD)

### Design decision: Kill compound pattern entirely

Three named props (`search`, `filters`, `results`) plus `children` replace the brittle compound-component slots. No `child.type` checks. Works with memo/forwardRef/HOCs. Type-safe. Explicit.

### Target API

```
SearchFilterBar
├── search?: ReactNode               ← replaces .Search compound slot
├── filters?: ReactNode[]            ← replaces .Filters compound slot
│                                      (each element auto-wrapped in sm:w-48 div)
├── results?: ReactNode              ← replaces .Results compound slot
├── children?: ReactNode             ← arbitrary content appended after filters, before clear button
├── activeFilters: ActiveFilter[]    ← unchanged
├── onClearAll?: () => void          ← renamed from onClear
├── className?: string               ← new (root layout control)
├── filterItemClassName?: string     ← new (override sm:w-48 on individual filter wrappers)
```

### Test contract

#### Story: `Default` (all slots populated)
- **Render:** search input, 2 filter selects, results pagination text, active filter chips, onClearAll handler
- **Play:**
  1. Verifies search input is rendered (by aria-label "Search applications")
  2. Verifies both filter selects render with correct accessible names
  3. Verifies results text "42 results" is present
  4. Verifies filter chips appear (at least one chip visible)
  5. Verifies "Clear all filters" button is visible and has accessible name
  6. Clicks "Clear all filters" — verifies it is enabled and clickable

#### Story: `WithoutClear` (no onClearAll, active filters present)
- **Render:** active filters exist, but `onClearAll` is undefined
- **Play:** Verifies no clear button is rendered. Filter chips are still visible.

#### Story: `Minimal` (no optional props)
- **Render:** only `activeFilters={[]}`, no search, no filters, no results, no onClearAll
- **Play:** Verifies the root renders without errors. Verifies no clear button, no filter chips, no stray elements.

#### Story: `WithChildren` (arbitrary children)
- **Render:** `children={<span>Extra content</span>}`
- **Play:** Verifies "Extra content" is rendered in the bar.

#### Story: `EmptyResults` (no results node)
- **Render:** search + filters but no `results` prop
- **Play:** Verifies search and filters render. Verifies no results container exists.

#### Story: `WithCustomFilterWidth`
- **Render:** `filterItemClassName="sm:w-64"`
- **Play:** Verifies at least one filter wrapper has class `sm:w-64` (not default `sm:w-48`).

#### Story: `Accessibility`
- **Play:** axe-core auto-enforced. Clear button must have `aria-label="Clear all filters"`.

### Consumer API (before → after)

```tsx
// Before: compound slots
<SearchFilterBar activeFilters={filters} onClear={clearAll}>
  <SearchFilterBar.Search id="search" value={search} onChange={setSearch} placeholder="Search..." ariaLabel="Search" />
  <SearchFilterBar.Filters>
    <FilterSelect value={status} options={opts} onChange={setStatus} placeholder="All" />
  </SearchFilterBar.Filters>
  <SearchFilterBar.Results>
    <PaginationControls ... />
  </SearchFilterBar.Results>
</SearchFilterBar>

// After: all props
<SearchFilterBar
  activeFilters={filters}
  onClearAll={clearAll}
  search={<Input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." aria-label="Search" />}
  filters={[
    <FilterSelect key="status" value={status} options={opts} onChange={setStatus} placeholder="All" />,
  ]}
  results={<PaginationControls ... />}
/>
```

### Consumer changes (career, 4 files)

Replace compound children with props. The diff is mechanical.

### Files

| Action | Path |
|---|---|
| **Rewrite** | `src/components/layout/search-filter-bar.tsx` |
| **Rewrite** | `src/components/layout/search-filter-bar.stories.tsx` |

---

## P1 — ActiveFiltersBar enhancements (TDD)

### Changes

1. Add `className` prop on the container `<div>`
2. Add optional `onClearAll` callback — renders a "Clear all" chip/button when filters with `variant: 'filter'` exist
3. Add `role="list"` on container, `role="listitem"` on each chip wrapper
4. Add `variant?: 'filter' | 'sort'` discriminator to `ActiveFilter` (defaults to `'filter'`)
5. On `onClearAll`, only fire for `variant: 'filter'` entries (ignores sort chips)
6. Visual distinction: sort chips use dashed/muted styling vs solid for filter chips

### Target types

```ts
interface ActiveFilter {
  id: string;
  label: string;
  onRemove: () => void;
  onClick?: () => void;
  variant?: 'filter' | 'sort';
}
```

### Test contract

#### Story: `Default`
- **Render:** 2 filter chips, 1 sort chip, `onClearAll` handler, no label
- **Play:**
  1. Verifies container has `role="list"`
  2. Verifies 3 items with `role="listitem"` (one per chip + clear chip)
  3. Verifies filter chips render with solid styling (no `border-dashed`)
  4. Verifies sort chip renders with dashed/muted styling
  5. Clicks sort chip's remove button — verifies parent `onRemove` was called
  6. Clicks filter chip's remove button — verifies parent `onRemove` was called

#### Story: `WithClearAll`
- **Render:** 2 filter chips, `onClearAll` handler
- **Play:**
  1. Verifies "Clear all" chip/button is visible and has accessible name
  2. Clicks "Clear all" — verifies the `onClearAll` callback was invoked
  3. The clear chip should have a distinct visual treatment (e.g., `border-dashed` or `variant="ghost"`)

#### Story: `WithSortOnly` (no filter chips, only sort chips)
- **Render:** 1 sort chip with `variant: 'sort'`, `onClearAll` handler
- **Play:** Verifies no "Clear all" chip is rendered (onClearAll only targets filter variant). Verifies the sort chip is present.

#### Story: `Empty`
- **Render:** `filters={[]}`
- **Play:** Verifies the component returns null (nothing rendered to DOM).

#### Story: `WithLabel`
- **Render:** 2 filter chips, `label="Active filters"`
- **Play:** Verifies "Active filters" text is visible before the chip list.

#### Story: `WithClassName`
- **Render:** 2 chips, `className="mt-4"`
- **Play:** Verifies the root list element has class `mt-4`.

#### Story: `Accessibility`
- **Play:** axe-core auto-enforced. Container must have `role="list"`. Each chip wrapper must have `role="listitem"`.

### Consumer impact

Additive. Finance can optionally pass `className`, `variant: 'sort'` on sort chips, and `onClearAll`.

Longer-term (P3): extract sort display into a `SortHint` component adjacent to the filter bar, removing sort chips from the filter array entirely.

### Files

| Action | Path |
|---|---|
| **Rewrite** | `src/components/data-display/active-filters-bar.tsx` |
| **Rewrite** | `src/components/data-display/active-filters-bar.stories.tsx` |

---

## P1 — Fix `useFilterState` (TDD)

### Changes

1. Remove `resetFilters` (identical to `clearFilters`)
2. Fix stale closure: use a ref for the latest `onFiltersChange` to avoid capturing stale state in `useCallback`
3. Clarify debounce: when `debounceMs` is set, `onFiltersChange` fires exactly once after the debounce window (not immediately + debounced)

### Test contract (unit tests, `.test.ts` file)

These are **unit tests**, not stories. They test hook logic directly with `@testing-library/react-hooks` or `renderHook` from the React testing utilities.

```
describe('useFilterState', () => {
  describe('initialization', () => {
    it('returns the initial filter values')
    // setFiltersState(initialFilters) — values match
  });

  describe('updateFilter', () => {
    it('updates a single key without affecting others')
    // updateFilter('status', 'active') — only 'status' changes
  });

  describe('setFilters', () => {
    it('replaces the entire filter state')
    // setFilters({ status: 'active', search: 'foo' }) — replaces all keys
  });

  describe('clearFilters', () => {
    it('resets to initial values')
    // clearFilters() — state === initialFilters
    it('calls onFiltersChange with initial values')
    // clearFilters() — onFiltersChange called with initialFilters
  });

  describe('onFiltersChange callback', () => {
    it('fires synchronously when debounceMs is not set')
    // updateFilter('status', 'active') — onFiltersChange called immediately
    it('debounces when debounceMs is set')
    // updateFilter('status', 'active') with debounceMs=100 — onFiltersChange NOT called immediately
    // wait 100ms — onFiltersChange called once
    it('does not double-fire (no immediate + debounced)')
    // updateFilter with debounceMs set — onFiltersChange called exactly 1 time after debounce
    it('uses the latest onFiltersChange reference, not a stale closure')
    // change onFiltersChange prop, update a filter — new callback fires, not old
  });

  describe('cleanup', () => {
    it('clears the debounce timer on unmount')
    // unmount during debounce window — onFiltersChange never fires
  });
});
```

### Files

| Action | Path |
|---|---|
| **Rewrite** | `src/hooks/use-filter-state.ts` |
| **Create** | `src/hooks/use-filter-state.test.ts` |
| **Edit** | `src/hooks/index.ts` (remove `resetFilters` from return type if exposed separately) |
| **Edit** | `src/index.ts` (same) |

### Consumer impact

None. `useFilterState` is consumed by career routes — they already use `clearFilters`. `resetFilters` is exported but verified unused in the codebase; removing it is safe.

---

## P2 — Create `useDerivedFilterState` hook (TDD)

### Design

A generic hook that encapsulates derived filter state. Accepts a sync adapter so it works with URL search params (career), Zustand stores (finance), or any backing store. Lives in `@ponti-studios/ui` to prevent app-level duplication.

```
useDerivedFilterState<T extends Record<string, FilterConfig>>(config: {
  fields: T
  sync: {
    read: () => Record<string, string | null>
    write: (values: Record<string, string | null>) => void
  }
}) → {
  values: Record<string, string | null>
  setValue: (key: string, value: string | null) => void
  activeFilters: ActiveFilter[]
  clearAll: () => void
  hasActive: boolean
}
```

### Test contract (unit tests, `.test.ts` file)

```
describe('useDerivedFilterState', () => {
  describe('initialization', () => {
    it('reads initial values from sync.read()')
    // sync.read returns { status: 'active', search: null }
    // values === { status: 'active', search: null }
  });

  describe('setValue', () => {
    it('updates a value and calls sync.write()')
    // setValue('status', 'archived')
    // sync.write called with { status: 'archived', search: null }
    it('sets value to null (clears the filter)')
    // setValue('status', null)
    // sync.write called with { status: null, search: null }
  });

  describe('activeFilters', () => {
    it('generates ActiveFilter objects for non-null values')
    // values === { status: 'active', search: 'foo' }
    // activeFilters.length === 2
    // activeFilters[0].id, label, onRemove are correct
    it('excludes null values from activeFilters')
    // values === { status: null, search: null }
    // activeFilters.length === 0
    it('uses custom label formatter when provided')
    // label: (v) => `Status: ${v}`
    // activeFilters[0].label === 'Status: active'
  });

  describe('clearAll', () => {
    it('sets all values to null and calls sync.write()')
    // clearAll() — all values === null, sync.write called with all nulls
  });

  describe('hasActive', () => {
    it('is true when any value is non-null')
    // setValue('status', 'active') — hasActive === true
    it('is false when all values are null')
    // clearAll() — hasActive === false
  });

  describe('resilience', () => {
    it('handles sync.read returning undefined keys gracefully')
    // sync.read returns { } — values fall back to defaults
    it('does not crash when sync.write is a no-op')
    // sync.write is () => {} — no error thrown
  });
});
```

### Files

| Action | Path |
|---|---|
| **Create** | `src/hooks/use-derived-filter-state.ts` |
| **Create** | `src/hooks/use-derived-filter-state.test.ts` |
| **Edit** | `src/hooks/index.ts` (add export) |
| **Edit** | `src/index.ts` (add export) |

### Consumer changes (career, 4 files)

Each route swaps hand-written filter-state management for the hook. Eliminates ~40 lines per route.

### Consumer changes (finance, eventually)

Transaction filters page swaps Zustand filter logic for the hook with a Zustand sync adapter.

---

## P3 — Mobile filter UX (spec only)

On mobile, a row of filter selects + search input + results takes up the entire viewport above the fold. The pattern should be:

- A "Filters" button (with active-count badge) that opens a bottom sheet or dialog
- Inside the sheet: all filter selects + "Apply" / "Clear all" actions
- Active chips render below the toolbar as they do now

This requires no breaking API changes to the P0/P1 designs. The `filters` array prop on `SearchFilterBar` can optionally be hidden via a `showFilters` prop (controlled by the sheet toggle). The sheet wrapper can be built as a consumer composition using existing `Sheet` or `Dialog` primitives, or as a `SearchFilterBar.FiltersSheet` convenience compound in the future.

No code changes at this tier. The P0/P1 API shapes must not close the door to this pattern.

---

## Consumer impact summary

| File | Changes |
|---|---|
| `career/ApplicationsFilters.tsx` | Props replace compound children; `value=''` → `value={null}`; optional `useDerivedFilterState` |
| `career/routes/projects.tsx` | Same |
| `career/routes/work.tsx` | Same |
| `career/routes/testimonials.tsx` | Same |
| `finance/transaction-filters.tsx` | Optional `className` on ActiveFiltersBar; optional `variant: 'sort'` on sort chips |
| **EntitySelect consumers** | **None** — dead code |

## Naming decisions

| Before | After | Reason |
|---|---|---|
| `onClear` (SearchFilterBar) | `onClearAll` | Consistent with ActiveFiltersBar; explicit scope |
| `filtersClassName` (proposed) | `filterItemClassName` | "filters" sounds like the container; this controls individual item width |
| `SearchFilterBar.Search` | `search` prop | Kill compound slot |
| `SearchFilterBar.Filters` | `filters` prop | Kill compound slot |
| `SearchFilterBar.Results` | `results` prop | Kill compound slot |
| `useFilterUrlSync` (career) | `useDerivedFilterState` (ui package) | Generic sync adapter, not URL-specific |
| `resetFilters` (useFilterState) | **removed** | Duplicate of `clearFilters` |

## Full files manifest

| Action | Path | Notes |
|---|---|---|
| **Rewrite** | `src/components/forms/filter-select.tsx` | P0 |
| **Rewrite** | `src/components/forms/filter-select.stories.tsx` | P0 — 8 stories with `play` |
| **Delete** | `src/components/forms/entity-select.tsx` | P0 |
| **Delete** | `src/components/forms/entity-select.stories.tsx` | P0 |
| **Edit** | `src/components/forms/index.ts` | P0 — remove EntitySelect exports |
| **Rewrite** | `src/components/layout/search-filter-bar.tsx` | P0 |
| **Rewrite** | `src/components/layout/search-filter-bar.stories.tsx` | P0 — 7 stories with `play` |
| **Rewrite** | `src/components/data-display/active-filters-bar.tsx` | P1 |
| **Rewrite** | `src/components/data-display/active-filters-bar.stories.tsx` | P1 — 7 stories with `play` |
| **Rewrite** | `src/hooks/use-filter-state.ts` | P1 — fix bugs |
| **Create** | `src/hooks/use-filter-state.test.ts` | P1 — unit tests |
| **Create** | `src/hooks/use-derived-filter-state.ts` | P2 |
| **Create** | `src/hooks/use-derived-filter-state.test.ts` | P2 — unit tests |
| **Edit** | `src/hooks/index.ts` | P1+P2 — remove resetFilters export, add useDerivedFilterState |
| **Edit** | `src/index.ts` | P1+P2 — same |
| **Edit** | `docs/primitives.md` | P0 — remove EntitySelect section |

## Test commands

```bash
pnpm test          # All storybook interaction tests (play functions) + hook unit tests
pnpm typecheck     # TypeScript
pnpm lint          # Oxlint
```

### CI/CD gate

All three must pass before merge. `test:a11y` is baked into `test` via the `@storybook/addon-a11y` configuration (`test: "error"`). Chromatic runs separately as a visual regression gate on PRs.
