"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseFilterStateOptions<T> {
  initialFilters: T;
  onFiltersChange?: (filters: T) => void;
  debounceMs?: number;
}

export function useFilterState<T extends Record<string, unknown>>(
  options: UseFilterStateOptions<T>,
) {
  const { initialFilters, onFiltersChange, debounceMs } = options;
  const [filters, setFiltersState] = useState<T>(initialFilters);
  const onFiltersChangeRef = useRef(onFiltersChange);
  const previousFiltersRef = useRef(filters);
  onFiltersChangeRef.current = onFiltersChange;

  const setFilters = useCallback(
    (newFilters: T | ((prev: T) => T)) => {
      setFiltersState(newFilters);
    },
    [],
  );

  const updateFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [setFilters],
  );

  const clearFilters = useCallback(() => {
    setFiltersState(initialFilters);
  }, [initialFilters]);

  useEffect(() => {
    if (Object.is(previousFiltersRef.current, filters)) return;
    previousFiltersRef.current = filters;

    if (!debounceMs || debounceMs <= 0) {
      onFiltersChangeRef.current?.(filters);
      return;
    }

    const timeoutId = setTimeout(() => {
      onFiltersChangeRef.current?.(filters);
    }, debounceMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [filters, debounceMs]);

  return {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
  };
}
