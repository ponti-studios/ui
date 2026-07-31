import { type ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { ActiveFiltersBar, type ActiveFilter } from './active-filters-bar';

export interface SearchFilterBarProps {
  activeFilters: ActiveFilter[];
  onClearAll?: () => void;
  search?: ReactNode;
  filters?: ReactNode[];
  results?: ReactNode;
  children?: ReactNode;
  className?: string;
  filterItemClassName?: string;
}

export function SearchFilterBar({
  activeFilters,
  onClearAll,
  search,
  filters,
  results,
  children,
  className,
  filterItemClassName = 'sm:w-48',
}: SearchFilterBarProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {search ? <div className="flex-1">{search}</div> : null}

        {filters?.map((filter, index) => (
          <div key={index} className={filterItemClassName}>
            {filter}
          </div>
        ))}

        {results ? (
          <div className="self-start lg:ml-auto lg:self-auto">{results}</div>
        ) : null}

        {children}
      </div>

      <ActiveFiltersBar filters={activeFilters} onClearAll={onClearAll} />
    </div>
  );
}
