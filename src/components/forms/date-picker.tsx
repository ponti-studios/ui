import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Calendar } from "../forms/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../overlays/popover";
import { Button } from "../primitives/button";

export interface DatePickerProps {
  value: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  label?: string;
  dateFormat?: string;
  showLabel?: boolean;
  containerClassName?: string;
  popoverAlign?: "start" | "center" | "end";
  variant?: "outline" | "default" | "destructive" | "secondary" | "ghost" | "link";
}

export function DatePicker({
  value,
  onSelect,
  disabled = false,
  id = "date-picker",
  placeholder = "Pick a date",
  label,
  dateFormat = "MMM d, yyyy",
  showLabel = true,
  containerClassName = "flex-1 min-w-0",
  popoverAlign = "start",
  variant = "outline",
}: DatePickerProps) {
  return (
    <div className={containerClassName}>
      {showLabel && label ? (
        <label htmlFor={id} className="text-foreground mb-2 block text-sm font-medium">
          {label}
        </label>
      ) : null}
      <Popover>
        <div className="flex w-full items-center">
          <div className="border-border bg-surface-2 text-text-1 flex size-10 shrink-0 items-center justify-center rounded-l-xl border">
            <CalendarIcon className="size-4" aria-hidden />
          </div>
          <PopoverTrigger asChild>
            <Button
              id={id}
              variant={variant}
              disabled={disabled}
              className="border-border bg-surface-2 text-text-1 placeholder:text-muted-foreground min-h-10 max-h-10 w-full justify-start rounded-l-none rounded-r-xl border-l-0 text-left font-normal"
            >
              {value ? format(value, dateFormat) : <span>{placeholder}</span>}
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent className="bg-popover w-auto p-0" align={popoverAlign}>
          <Calendar mode="single" selected={value} onSelect={onSelect} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
