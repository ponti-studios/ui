"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import * as React from "react";

import { cn } from "../../lib/utils";

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default";
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer inline-flex shrink-0 items-center rounded-full border border-transparent p-px",
        "data-checked:bg-primary data-unchecked:bg-input",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        size === "default" ? "h-[1.15rem] w-8" : "h-3.5 w-6",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        data-size={size}
        className={cn(
          "pointer-events-none block rounded-full bg-background shadow-sm ring-1 ring-border/5 transition-transform duration-150 ease-out",
          size === "default" ? "size-4 data-checked:translate-x-3" : "size-3 data-checked:translate-x-2",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
