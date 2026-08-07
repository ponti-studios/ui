import { forwardRef, useState } from "react";
import { TextInput, type TextInputProps } from "react-native";
import { useCSSVariable } from "uniwind";

export const TextField = forwardRef<TextInput, TextInputProps>(function TextField(
  { onBlur, onFocus, style, ...props },
  ref,
) {
  const [ring, borderInput, foreground, mutedForeground] = useCSSVariable([
    "--color-ring",
    "--color-input",
    "--color-foreground",
    "--color-muted-foreground",
  ]) as string[];
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      {...props}
      ref={ref}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      placeholderTextColor={props.placeholderTextColor ?? mutedForeground}
      className="rounded-md border min-h-11 px-4 py-3 text-base"
      style={[{ borderColor: focused ? ring : borderInput, color: foreground }, style]}
    />
  );
});
