"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { Circle } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";

const RadioGroup = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive>
>(({ className, ...props }, ref) => {
  return <RadioGroupPrimitive className={cn("grid gap-2", className)} {...props} ref={ref} />;
});
RadioGroup.displayName = "RadioGroup";

const RadioGroupItem = React.forwardRef<
  React.ComponentRef<typeof RadioPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioPrimitive.Root
      ref={ref}
      className={cn(
        "border-primary bg-background focus-visible:border-ring focus-visible:bg-muted/25 focus-visible:ring-ring aspect-square size-6 rounded-full border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        "flex items-center justify-center",
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        keepMounted
        className="data-unchecked:opacity-0 data-checked:opacity-100 data-starting-style:animate-fade-in data-ending-style:animate-fade-out"
      >
        <Circle className="fill-primary size-5" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  );
});
RadioGroupItem.displayName = "Radio";

export { RadioGroup, RadioGroupItem };
