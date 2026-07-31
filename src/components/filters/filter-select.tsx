import { useId, useMemo } from "react";

import { cn } from "../../lib/utils";
import { Label } from "../primitives/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../forms/select";

export interface FilterSelectOption {
  value: string;
  label: string;
}

export interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterSelectOption[];
  label: string;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  emptyLabel?: string;
  className?: string;
  id?: string;
}

const ALL_VALUE = "";

export function FilterSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "All",
  disabled = false,
  isLoading = false,
  emptyLabel = "No options available",
  className,
  id,
}: FilterSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const items = useMemo(
    () => [{ value: ALL_VALUE, label: placeholder }, ...options],
    [options, placeholder],
  );

  return (
    <div className={cn("space-y-2 min-w-36 bg-background", className)}>
      <Label htmlFor={selectId}>{label}</Label>
      <Select value={value} onValueChange={onChange} items={items}>
        <SelectTrigger
          id={selectId}
          disabled={disabled}
          aria-label={label}
          className="w-full"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-background max-h-[250px] min-w-36 overflow-y-auto">
          <SelectItem value={ALL_VALUE}>{placeholder}</SelectItem>
          {isLoading ? (
            <div className="text-muted-foreground px-2 py-1.5 text-sm">Loading…</div>
          ) : options.length === 0 ? (
            <div className="text-muted-foreground px-2 py-1.5 text-sm">{emptyLabel}</div>
          ) : (
            options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
