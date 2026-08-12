import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useId, useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "../overlays/popover";
import { Button } from "../primitives/button";
import { Calendar } from "./calendar";
import { formatDateInput, parseDateInput } from "./date-utils";
import { DatePicker, type DatePickerProps } from "./date-picker";

export interface DateRangeValue {
  from?: Date | string | null;
  to?: Date | string | null;
}

interface DateFieldCommonProps {
  id?: string;
  label?: string;
  showLabel?: boolean;
  placeholder?: string;
  dateFormat?: string;
  disabled?: boolean;
  containerClassName?: string;
  popoverAlign?: DatePickerProps["popoverAlign"];
  variant?: DatePickerProps["variant"];
}

export interface SingleDateFieldProps extends DateFieldCommonProps {
  mode?: "single";
  name: string;
  defaultValue?: Date | string | null;
}

export interface RangeDateFieldProps extends DateFieldCommonProps {
  mode: "range";
  startName: string;
  endName: string;
  defaultValue?: DateRangeValue;
}

export type DateFieldProps = SingleDateFieldProps | RangeDateFieldProps;

const TRIGGER_CLASSES =
  "border-border bg-background text-foreground placeholder:text-muted-foreground min-h-10 max-h-10 w-full justify-start rounded-l-none rounded-r-xl border-l-0 text-left font-normal";

function SingleDateField({
  name,
  defaultValue,
  id,
  label,
  showLabel,
  placeholder,
  dateFormat,
  disabled,
  containerClassName,
  popoverAlign,
  variant,
}: SingleDateFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [value, setValue] = useState<Date | undefined>(() => parseDateInput(defaultValue));

  return (
    <div>
      <DatePicker
        id={inputId}
        label={label}
        showLabel={showLabel}
        placeholder={placeholder}
        dateFormat={dateFormat}
        disabled={disabled}
        containerClassName={containerClassName}
        popoverAlign={popoverAlign}
        variant={variant}
        value={value}
        onSelect={setValue}
      />
      <input type="hidden" name={name} value={value ? formatDateInput(value) : ""} />
    </div>
  );
}

function RangeDateField({
  startName,
  endName,
  defaultValue,
  id,
  label,
  showLabel = true,
  placeholder = "Pick a date range",
  dateFormat = "MMM d, yyyy",
  disabled = false,
  containerClassName = "flex-1 min-w-0",
  popoverAlign = "start",
  variant = "outline",
}: RangeDateFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [range, setRange] = useState<{ from?: Date; to?: Date }>(() => ({
    from: parseDateInput(defaultValue?.from),
    to: parseDateInput(defaultValue?.to),
  }));

  const fromLabel = range.from ? format(range.from, dateFormat) : null;
  const toLabel = range.to ? format(range.to, dateFormat) : null;
  const triggerLabel = fromLabel
    ? toLabel
      ? `${fromLabel} – ${toLabel}`
      : `From ${fromLabel}`
    : toLabel
      ? `Until ${toLabel}`
      : placeholder;

  return (
    <div className={containerClassName}>
      {showLabel && label ? (
        <label htmlFor={inputId} className="text-foreground mb-2 block text-sm font-medium">
          {label}
        </label>
      ) : null}
      <Popover>
        <div className="flex w-full items-center">
          <div className="border-border bg-background text-foreground flex size-10 shrink-0 items-center justify-center rounded-l-xl border">
            <CalendarIcon className="size-4" aria-hidden />
          </div>
          <PopoverTrigger asChild>
            <Button id={inputId} variant={variant} disabled={disabled} className={TRIGGER_CLASSES}>
              {triggerLabel}
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent
          className="bg-popover w-auto p-0"
          align={popoverAlign}
          aria-label={label ?? "Choose a date range"}
        >
          <Calendar
            mode="range"
            selected={range.from ? { from: range.from, to: range.to } : undefined}
            defaultMonth={range.from ?? range.to}
            resetOnSelect
            onSelect={(next) => setRange({ from: next?.from, to: next?.to })}
          />
        </PopoverContent>
      </Popover>
      <input type="hidden" name={startName} value={range.from ? formatDateInput(range.from) : ""} />
      <input type="hidden" name={endName} value={range.to ? formatDateInput(range.to) : ""} />
    </div>
  );
}

/**
 * DateField — calendar picker backed by hidden inputs that submit "YYYY-MM-DD"
 * local date strings, so forms never receive UTC-shifted dates. Supports both
 * a single date (`name`) and a range (`startName` + `endName`).
 *
 * @example
 * <DateField name="startDate" defaultValue="2020-01-15" label="Start date" />
 * <DateField
 *   mode="range"
 *   startName="startDate"
 *   endName="endDate"
 *   defaultValue={{ from: "2020-01-15", to: "2020-06-30" }}
 *   label="Active period"
 * />
 */
function DateField(props: DateFieldProps) {
  if (props.mode === "range") {
    return <RangeDateField {...props} />;
  }
  return <SingleDateField {...props} />;
}

export { DateField };
