import { Children, isValidElement, type ReactNode } from "react";

import { cn } from "../../lib/utils";
import { ActiveFiltersBar, type ActiveFiltersBarProps } from "./active-filters-bar";
import { FilterSelect, type FilterSelectProps } from "./filter-select";
import { Label } from "../primitives/label";

export function FiltersSearch({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const id = `filters-search-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="flex-1 space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
FiltersSearch.slot = "search";

export function FiltersSelect(props: FilterSelectProps) {
  return <FilterSelect {...props} label={props.label ?? props.placeholder} />;
}
FiltersSelect.slot = "select";

export function FiltersActive(props: ActiveFiltersBarProps) {
  return <ActiveFiltersBar {...props} />;
}
FiltersActive.slot = "active";

export interface FiltersProps {
  children: ReactNode;
  className?: string;
}

function FiltersRoot({ children, className }: FiltersProps) {
  const search: ReactNode[] = [];
  const selects: ReactNode[] = [];
  const active: ReactNode[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const slot = (child.type as any)?.slot;
    if (slot === "search") search.push(child);
    else if (slot === "select") selects.push(child);
    else if (slot === "active") active.push(child);
  });

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        {search}
        {selects.map((s, i) => (
          <div key={i} className="sm:w-48">
            {s}
          </div>
        ))}
      </div>
      {active}
    </div>
  );
}

type FiltersComponent = typeof FiltersRoot & {
  Search: typeof FiltersSearch;
  Select: typeof FiltersSelect;
  Active: typeof FiltersActive;
};

export const Filters: FiltersComponent = Object.assign(FiltersRoot, {
  Search: FiltersSearch,
  Select: FiltersSelect,
  Active: FiltersActive,
});
